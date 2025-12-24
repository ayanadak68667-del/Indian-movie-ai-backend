// routes/movie.js
const express = require("express");
const router = express.Router();

const fetch = global.fetch;
const TMDB_KEY = process.env.TMDB_API_KEY;

/* =========================
   MOVIE DETAILS
========================= */
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const base = "https://api.themoviedb.org/3";

    const [detailsRes, creditsRes, providersRes, recsRes] =
      await Promise.all([
        fetch(`${base}/movie/${movieId}?api_key=${TMDB_KEY}&language=en-US`),
        fetch(`${base}/movie/${movieId}/credits?api_key=${TMDB_KEY}`),
        fetch(`${base}/movie/${movieId}/watch/providers?api_key=${TMDB_KEY}`),
        fetch(`${base}/movie/${movieId}/recommendations?api_key=${TMDB_KEY}`)
      ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const providers = await providersRes.json();
    const recs = await recsRes.json();

    if (!details || details.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const cast = (credits.cast || []).slice(0, 12).map(p => ({
      id: p.id,
      name: p.name,
      character: p.character,
      profileUrl: p.profile_path
        ? `https://image.tmdb.org/t/p/w185${p.profile_path}`
        : null
    }));

    const inProviders = providers.results?.IN || {};
    const flatrate = inProviders.flatrate || [];

    const streamingLinks = flatrate.map(p => ({
      platform: p.provider_name,
      logoUrl: p.logo_path
        ? `https://image.tmdb.org/t/p/w92${p.logo_path}`
        : null
    }));

    const recommendations = (recs.results || []).slice(0, 20).map(r => ({
      id: r.id,
      title: r.title,
      posterUrl: r.poster_path
        ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
        : null
    }));

    res.json({
      id: details.id,
      title: details.title,
      overview: details.overview,
      releaseDate: details.release_date,
      runtime: details.runtime,
      voteAverage: details.vote_average,
      genres: details.genres.map(g => g.name),
      posterUrl: details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null,
      backdropUrl: details.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}`
        : null,
      cast,
      streamingLinks,
      recommendations
    });
  } catch (err) {
    console.error("MOVIE DETAILS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

/* =========================
   TRAILER (SEPARATE ROUTE)
========================= */
router.get("/movie/:id/trailer", async (req, res) => {
  const movieId = req.params.id;

  try {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_KEY}`;
    const data = await fetch(url).then(r => r.json());

    const trailer = (data.results || []).find(
      v => v.site === "YouTube" && v.type === "Trailer"
    );

    res.json({
      movie_id: movieId,
      trailerUrl: trailer
        ? `https://www.youtube.com/embed/${trailer.key}`
        : null
    });
  } catch (err) {
    console.error("TRAILER ERROR:", err);
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});

/* =========================
   AI BLOG (UNCHANGED)
========================= */
router.get("/movie/:id/blog", async (req, res) => {
  const movieId = req.params.id;

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&language=en-US`
    );

    const movie = await tmdbRes.json();

    if (!movie || movie.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

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

module.exports = router;
