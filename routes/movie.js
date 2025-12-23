// routes/movie.js
const express = require("express");
const router = express.Router();

// Node 18+ has global fetch
const fetch = global.fetch;

// 🔹 Movie full details route (TMDB only for now)
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const apiKey = process.env.TMDB_API_KEY;
    const baseUrl = "https://api.themoviedb.org/3";

    // Details + credits + watch providers + recommendations
    const [detailsRes, creditsRes, providersRes, recsRes] = await Promise.all([
      fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}&language=en-US`),
      fetch(`${baseUrl}/movie/${movieId}/credits?api_key=${apiKey}&language=en-US`),
      fetch(`${baseUrl}/movie/${movieId}/watch/providers?api_key=${apiKey}`),
      fetch(`${baseUrl}/movie/${movieId}/recommendations?api_key=${apiKey}&language=en-US&page=1`)
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const providers = await providersRes.json();
    const recs = await recsRes.json();

    if (!details || details.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Build cast (top 12)
    const cast = (credits.cast || []).slice(0, 12).map(person => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: person.profile_path
        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
        : null
    }));

    // Watch providers (IN region)
    const inProviders = providers.results?.IN || {};
    const flatrate = inProviders.flatrate || [];
    const rent = inProviders.rent || [];
    const buy = inProviders.buy || [];

    const streamingLinks = flatrate.map(p => ({
      platform: p.provider_name,
      logoUrl: p.logo_path
        ? `https://image.tmdb.org/t/p/w92${p.logo_path}`
        : null
    }));

    // Recommendations
    const recommendations = (recs.results || []).slice(0, 20).map(item => ({
      id: item.id,
      title: item.title || item.name,
      overview: item.overview,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : null,
      backdropUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
        : null,
      voteAverage: item.vote_average,
      releaseDate: item.release_date || item.first_air_date
    }));

    // Final payload
    res.json({
      id: details.id,
      title: details.title,
      overview: details.overview,
      releaseDate: details.release_date,
      runtime: details.runtime,
      voteAverage: details.vote_average,
      genres: (details.genres || []).map(g => g.name),
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

// 🔹 AI blog route (তোর আগের কোড 그대로)
router.get("/movie/:id/blog", async (req, res) => {
  const movieId = req.params.id;

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
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

module.exports = router;
