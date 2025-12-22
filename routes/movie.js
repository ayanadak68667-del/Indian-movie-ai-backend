import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/movie/:id/blog", async (req, res) => {
  const movieId = req.params.id;

  try {
    // 1️⃣ TMDB movie details
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    );
    const movie = await tmdbRes.json();

    if (!movie || movie.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // 2️⃣ Gemini prompt
    const prompt = `
Write a detailed, human-like movie review article in English.

Movie title: ${movie.title}
Release year: ${movie.release_date}
Overview: ${movie.overview}
Genres: ${movie.genres?.map(g => g.name).join(", ")}

Use these sections exactly:
1. Synopsis
2. Box Office & Budget
3. Pros and Cons
4. Why You Should Watch This Movie
5. Actor Performance
6. Character Overview
7. Target Audience
8. Language & Style

Tone: cinematic, professional, SEO-friendly.
Do not mention AI.
`;

    // 3️⃣ Gemini API call
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();

    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({
      movie_id: movieId,
      title: movie.title,
      blog: text
    });

  } catch (err) {
    console.error("AI BLOG ERROR:", err);
    res.status(500).json({ error: "AI blog generation failed" });
  }
});

export default router;
