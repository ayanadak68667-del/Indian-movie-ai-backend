const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_KEY = process.env.TMDB_API_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const TMDB_BASE = 'https://api.themoviedb.org/3';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/* ---------------- TRENDING MOVIES ---------------- */
app.get('/trending-movies', async (req, res) => {
  try {
    const r = await axios.get(`${TMDB_BASE}/discover/movie`, {
      params: {
        api_key: TMDB_KEY,
        sort_by: 'popularity.desc',
        region: 'IN',
        page: 1
      }
    });
    res.json({ results: r.data.results.slice(0, 12) });
  } catch {
    res.status(500).json({ results: [] });
  }
});

/* ---------------- POPULAR WEB SERIES ---------------- */
app.get('/popular-web-series', async (req, res) => {
  try {
    const r = await axios.get(`${TMDB_BASE}/discover/tv`, {
      params: {
        api_key: TMDB_KEY,
        sort_by: 'popularity.desc',
        region: 'IN',
        page: 1
      }
    });
    res.json({ results: r.data.results.slice(0, 12) });
  } catch {
    res.status(500).json({ results: [] });
  }
});

/* ---------------- MOVIE DETAIL ---------------- */
app.get('/api/movie/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const d = await axios.get(`${TMDB_BASE}/movie/${id}`, {
      params: {
        api_key: TMDB_KEY,
        append_to_response: 'credits'
      }
    });

    const m = d.data;

    const cast = (m.credits.cast || []).slice(0, 6).map(c => ({
      name: c.name,
      character: c.character,
      image: c.profile_path
        ? `https://image.tmdb.org/t/p/w300${c.profile_path}`
        : 'https://via.placeholder.com/150'
    }));

    let aiSummary = '';
    if (GEMINI_KEY) {
      const ai = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Write a short cinematic English summary for the movie ${m.title}`
                }
              ]
            }
          ]
        }
      );
      aiSummary =
        ai.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    res.json({
      id: m.id,
      title: m.title,
      synopsis: m.overview,
      releaseDate: m.release_date,
      imdbRating: m.vote_average?.toFixed(1),
      genres: m.genres.map(g => g.name),
      cast,
      aiSummary
    });
  } catch {
    res.status(500).json({ error: 'Movie load failed' });
  }
});

/* ---------------- YOUTUBE TRAILER ---------------- */
app.get('/api/youtube/trailer', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ trailerId: null });

    const r = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: `${q} official trailer`,
          key: YT_KEY,
          maxResults: 1,
          type: 'video'
        }
      }
    );

    res.json({
      trailerId: r.data.items?.[0]?.id?.videoId || null
    });
  } catch {
    res.json({ trailerId: null });
  }
});

/* ---------------- HEALTH ---------------- */
app.get('/', (_, res) => res.send('Backend Live'));
app.get('/health', (_, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
