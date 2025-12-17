import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// 🔥 Hot & Trending Indian Movies
router.get("/trending", async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/trending/movie/week`, {
      params: {
        api_key: API_KEY,
        region: "IN",
        with_original_language: "hi",
      },
    });

    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending Indian movies" });
  }
});

// 🎬 Popular Indian Web Series
router.get("/webseries", async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/discover/tv`, {
      params: {
        api_key: API_KEY,
        with_original_language: "hi",
        region: "IN",
        sort_by: "popularity.desc",
      },
    });

    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Indian web series" });
  }
});

// ⭐ Top IMDb Rated Indian Movies
router.get("/top-rated", async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/discover/movie`, {
      params: {
        api_key: API_KEY,
        with_original_language: "hi",
        region: "IN",
        sort_by: "vote_average.desc",
        vote_count_gte: 100,
      },
    });

    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top rated Indian movies" });
  }
});

// 📅 Upcoming Indian Movies
router.get("/upcoming", async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/upcoming`, {
      params: {
        api_key: API_KEY,
        region: "IN",
      },
    });

    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming Indian movies" });
  }
});

export default router;
