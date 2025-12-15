import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

/* ===============================
   BASIC ROOT CHECK
================================ */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Indian Movie AI Backend is running 🚀",
  });
});

/* ===============================
   TMDB TRENDING MOVIES
   URL: /api/trending
================================ */
app.get("/api/trending", async (req, res) => {
  try {
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.TMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

/* ===============================
   TMDB MOVIE DETAILS
   URL: /api/movie/:id
================================ */
app.get("/api/movie/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

/* ===============================
   YOUTUBE TRAILER SEARCH
   URL: /api/trailer?q=movie name
================================ */
app.get("/api/trailer", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Query missing" });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query + " official trailer"
    )}&key=${process.env.YOUTUBE_API_KEY}&maxResults=1&type=video`;

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});

/* ===============================
   AI SUMMARY (GEMINI)
   URL: /api/ai-summary
================================ */
app.post("/api/ai-summary", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "AI summary failed" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
