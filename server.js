const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(express.json());
app.use(
  cors({
    origin: "*", // later restrict to Hostinger domain
  })
);

/* =========================
   ENV VARIABLES (Render)
========================= */
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

/* =========================
   SAFETY CHECK
========================= */
if (!TMDB_API_KEY) {
  console.error("❌ TMDB API KEY missing");
  process.exit(1);
}

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("🎬 Filmi Bharat Backend is running");
});

/* =========================
   HOME PAGE APIs
========================= */

// 🔥 Trending Movies
app.get("/api/trending", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/trending/movie/week`,
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

// ⭐ Top IMDb Rated
app.get("/api/top-rated", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/movie/top_rated`,
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top rated movies" });
  }
});

// 📺 Popular Web Series
app.get("/api/popular-series", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/tv/popular`,
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch web series" });
  }
});

// ⏳ Upcoming Movies
app.get("/api/upcoming", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/movie/upcoming`,
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming movies" });
  }
});

/* =========================
   MOVIE DETAILS PAGE APIs
========================= */

// 🎬 Movie Details
app.get("/api/movie/:id", async (req, res) => {
  try {
    const movieId = req.params.id;

    const { data } = await axios.get(
      `${BASE_URL}/movie/${movieId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "credits,watch/providers",
        },
      }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// 🎭 Similar Movies (Phase-1 Recommendation)
app.get("/api/movie/:id/similar", async (req, res) => {
  try {
    const movieId = req.params.id;

    const { data } = await axios.get(
      `${BASE_URL}/movie/${movieId}/similar`,
      { params: { api_key: TMDB_API_KEY } }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch similar movies" });
  }
});

/* =========================
   FUTURE READY (DISABLED)
========================= */

// Gemini AI → Phase-2
// YouTube Trailer → Phase-2
// AI Recommendation → Phase-2

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
