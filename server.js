const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_KEY = process.env.TMDB_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function fetchSection(sortBy) {
  const url = `${TMDB_BASE}/discover/movie`;
  const params = {
    api_key: TMDB_KEY,
    language: 'en-US',
    region: 'IN',
    with_original_language: 'hi',
    sort_by: sortBy,
    'vote_count.gte': 50,
    page: 1
  };
  const res = await axios.get(url, { params });
  return res.data.results.slice(0, 12);
}

app.get('/api/home', async (req, res) => {
  try {
    const [trending, upcoming, topRated] = await Promise.all([
      fetchSection('popularity.desc'),
      fetchSection('release_date.asc'),
      fetchSection('vote_average.desc')
    ]);
    res.json({ trending, upcoming, topRated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load movies' });
  }
});

app.get('/api/movie/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const detailsRes = await axios.get(
      `${TMDB_BASE}/movie/${id}`,
      { params: { api_key: TMDB_KEY, append_to_response: 'videos,watch/providers,credits' } }
    );
    const movie = detailsRes.data;

    const trailer = (movie.videos?.results || []).find(
      v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    );
    const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;

    const providersIN = movie['watch/providers']?.results?.IN || {};

    const mainCast = (movie.credits?.cast || []).slice(0, 5).map(c => c.name).join(', ');
    const director = (movie.credits?.crew || []).find(c => c.job === 'Director')?.name || 'Unknown';

    const prompt = `
Write a 120-word English blog-style review for the Indian movie "${movie.title}".
Release date: ${movie.release_date}.
Director: ${director}.
Main cast: ${mainCast}.
Genres: ${(movie.genres || []).map(g => g.name).join(', ')}.
Focus on storyline, performances and box office potential in a dark, cinematic tone.
`;

    let aiBlog = '';
    if (GEMINI_KEY) {
      const aiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      aiBlog = aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    res.json({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      imdb_url: movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : null,
      trailer_url: trailerUrl,
      providers: providersIN,
      ai_blog: aiBlog
    });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load movie details' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const question = req.body.message || '';
    if (!GEMINI_KEY) return res.json({ reply: 'Gemini API key not set.' });

    const aiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      { contents: [{ parts: [{ text: `You are an Indian movie assistant. Answer in English.
${question}` }] }] }
    );
    const reply = aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No reply.';
    res.json({ reply });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
