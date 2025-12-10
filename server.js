// server.js (final backend for Indian Movie AI)

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ENV keys
const TMDB_KEY = process.env.TMDB_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const TMDB_BASE = 'https://api.themoviedb.org/3';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;

// ---------- Helper: call TMDB discover for a section ----------
async function fetchSection(sortBy, languageCode) {
  const url = `${TMDB_BASE}/discover/movie`;
  const params = {
    api_key: TMDB_KEY,
    language: 'en-US',   // লেবেল ইংরেজি, কিন্তু কনটেন্ট সব ভাষার
    region: 'IN',
    sort_by: sortBy,     // popularity.desc / release_date.asc / vote_average.desc
    'vote_count.gte': 50,
    page: 1
  };

  // ইউজার যদি নির্দিষ্ট ভাষা চায় (hi, ta, te...) তখনই ফিল্টার
  if (languageCode && languageCode !== 'all') {
    params.with_original_language = languageCode;
  }

  const res = await axios.get(url, { params });
  // আমরা এখানে ১২টা কার্ডই নেব
  return res.data.results.slice(0, 12);
}

// ---------- Home sections: Trending / Upcoming / Top Rated ----------

app.get('/api/movies/trending', async (req, res) => {
  try {
    const lang = req.query.language || 'all';
    const results = await fetchSection('popularity.desc', lang);
    res.json({ results });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load trending movies' });
  }
});

app.get('/api/movies/upcoming', async (req, res) => {
  try {
    const lang = req.query.language || 'all';
    const results = await fetchSection('release_date.asc', lang);
    res.json({ results });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load upcoming movies' });
  }
});

app.get('/api/movies/top-rated', async (req, res) => {
  try {
    const lang = req.query.language || 'all';
    const results = await fetchSection('vote_average.desc', lang);
    res.json({ results });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load top rated movies' });
  }
});

// ---------- Search endpoint ----------

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    const lang = req.query.language || 'all';

    if (!query.trim()) {
      return res.json({ results: [] });
    }

    const params = {
      api_key: TMDB_KEY,
      query,
      language: 'en-US',
      region: 'IN',
      include_adult: false,
      page: 1
    };

    // নির্দিষ্ট ভাষা চাইলে ফিল্টার
    if (lang && lang !== 'all') {
      params.with_original_language = lang;
    }

    const tmdbRes = await axios.get(`${TMDB_BASE}/search/movie`, { params });
    res.json({ results: tmdbRes.data.results || [] });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ---------- Movie detail + AI blog + OTT + trailer ----------

app.get('/api/movie/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const detailsRes = await axios.get(`${TMDB_BASE}/movie/${id}`, {
      params: {
        api_key: TMDB_KEY,
        append_to_response: 'videos,watch/providers,credits,external_ids'
      }
    });

    const movie = detailsRes.data;

    // YouTube official trailer খোঁজা
    const trailer = (movie.videos?.results || []).find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );
    const trailerUrl = trailer
      ? `https://www.youtube.com/embed/${trailer.key}`
      : null;

    // ভারতীয় region‑এর OTT provider
    const providersIN = movie['watch/providers']?.results?.IN || {};
    const ottLinks = (providersIN.flatrate || [])
      .filter((p) =>
        ['Netflix', 'Amazon Prime Video'].includes(p.provider_name)
      )
      .map((p) => ({
        name: p.provider_name,
        // TMDB সরাসরি OTT URL দেয় না, তাই generic search লিংক
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${movie.title} ${p.provider_name} watch online`
        )}`
      }));

    const mainCast = (movie.credits?.cast || [])
      .slice(0, 5)
      .map((c) => c.name)
      .join(', ');
    const director =
      (movie.credits?.crew || []).find((c) => c.job === 'Director')?.name ||
      'Unknown';

    const genres = (movie.genres || []).map((g) => g.name);
    const langCode = movie.original_language || 'hi';

    // Gemini prompt – AI blog
    const prompt = `
You are an Indian movie critic. Write a short English blog-style analysis (100-150 words)
for the movie "${movie.title}".
Release date: ${movie.release_date}.
Director: ${director}.
Main cast: ${mainCast}.
Genres: ${genres.join(', ')}.
Language: ${langCode}.
Focus on storyline, performances and box-office potential in a dark, cinematic tone.
`;

    let aiBlog = '';
    if (GEMINI_KEY) {
      const aiRes = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      aiBlog =
        aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    res.json({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genres,
      language: langCode,
      imdb_id: movie.imdb_id || null,
      imdb_url: movie.imdb_id
        ? `https://www.imdb.com/title/${movie.imdb_id}`
        : null,
      trailer_url: trailerUrl,
      ott_links: ottLinks,
      ai_blog: aiBlog
    });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load movie details' });
  }
});

// ---------- "You May Also Like" recommendations ----------

app.get('/api/movie/:id/recommendations', async (req, res) => {
  try {
    const id = req.params.id;

    // TMDB similar movies (region=IN)
    const simRes = await axios.get(`${TMDB_BASE}/movie/${id}/similar`, {
      params: {
        api_key: TMDB_KEY,
        language: 'en-US',
        region: 'IN',
        page: 1
      }
    });

    let list = (simRes.data.results || []).slice(0, 20);

    // চাইলে এখানে Gemini দিয়ে ফিল্টার/র‍্যাঙ্কিং করা যেতে পারে, তবে সিম্পল রাখতে সরাসরি top 8 পাঠাচ্ছি
    list = list.slice(0, 8);

    res.json({ results: list });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

// ---------- 24/7 AI Chatbot ----------

app.post('/api/chat', async (req, res) => {
  try {
    const question = req.body.message || '';

    if (!GEMINI_KEY) {
      return res.json({ reply: 'Gemini API key not set.' });
    }

    const systemPrompt = `You are an Indian movie assistant.
Answer in English.
You know movies and series from all Indian languages (Hindi, Tamil, Telugu,
Malayalam, Kannada, Marathi, Bengali, and others).`;

    const aiRes = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_KEY}`,
      {
        contents: [
          { parts: [{ text: systemPrompt }] },
          { parts: [{ text: question }] }
        ]
      }
    );

    const reply =
      aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No reply.';
    res.json({ reply });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// ---------- Health check ----------

app.get('/health', (req, res) => res.send('OK'));

// ---------- Start server ----------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
