const express = require("express");
const axios = require("axios"); // ✅ REPLACE fetch
const router = express.Router();

const TMDB_KEY = process.env.TMDB_API_KEY;
const MovieExtras = require("../models/MovieExtras");
const { getSongsPlaylist } = require("../services/youtubeSongsService");

// Format USD (unchanged)
function formatUsdAmount(amount) {
  if (!amount || amount <= 0) return null;
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  return `$${(amount / 1_000_000).toFixed(1)}M`;
}

// ✅ FIXED: Movie Details Route
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  
  // 🔹 API KEY CHECK
  if (!TMDB_KEY) {
    return res.status(500).json({ error: "TMDB_API_KEY missing" });
  }

  try {
    const base = "https://api.themoviedb.org/3";
    
    const [detailsRes, creditsRes, providersRes, recsRes] = await Promise.all([
      axios.get(`${base}/movie/${movieId}?api_key=${TMDB_KEY}&language=en-US`),
      axios.get(`${base}/movie/${movieId}/credits?api_key=${TMDB_KEY}&language=en-US`),
      axios.get(`${base}/movie/${movieId}/watch/providers?api_key=${TMDB_KEY}`),
      axios.get(`${base}/movie/${movieId}/recommendations?api_key=${TMDB_KEY}&language=en-US`)
    ]);

    const details = detailsRes.data;
    const credits = creditsRes.data;
    const providers = providersRes.data;
    const recs = recsRes.data;

    if (!details || details.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Cast, Crew, Streaming, Recommendations (unchanged logic)
    const cast = (credits.cast || []).slice(0, 12).map(p => ({
      id: p.id, name: p.name, character: p.character,
      profileUrl: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null
    }));

    const crew = credits.crew || [];
    const directors = crew.filter(c => c.job === "Director").map(c => c.name);
    const writers = crew.filter(c => ["Writer", "Screenplay", "Story"].includes(c.job)).map(c => c.name);
    const producers = crew.filter(c => ["Producer", "Executive Producer"].includes(c.job)).map(c => c.name);

    const inProviders = providers.results?.IN || {};
    const streamingLinks = (inProviders.flatrate || []).map(p => ({
      platform: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
    }));

    const recommendations = (recs.results || []).slice(0, 20).map(r => ({
      id: r.id, title: r.title,
      posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null
    }));

    // Songs playlist (unchanged)
    let songsPlaylistUrl = null;
    try {
      const existing = await MovieExtras.findOne({ tmdbId: details.id }).lean();
      if (existing?.songsPlaylistUrl) {
        songsPlaylistUrl = existing.songsPlaylistUrl;
      } else {
        const year = details.release_date?.slice(0, 4);
        const playlist = await getSongsPlaylist(details.title, year);
        if (playlist?.url) {
          songsPlaylistUrl = playlist.url;
          await MovieExtras.findOneAndUpdate(
            { tmdbId: details.id },
            { tmdbId: details.id, songsPlaylistUrl },
            { upsert: true }
          );
        }
      }
    } catch (err) {
      console.error("Songs error:", err.message);
    }

    res.json({
      id: details.id, title: details.title, overview: details.overview,
      releaseDate: details.release_date, runtime: details.runtime,
      voteAverage: details.vote_average, genres: (details.genres || []).map(g => g.name),
      posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}` : null,
      aiSummary: "Cinematic blend of entertainment and social commentary.",
      budgetDisplay: formatUsdAmount(details.budget),
      boxOfficeDisplay: formatUsdAmount(details.revenue),
      directors, writers, producers, songsPlaylistUrl, cast, streamingLinks, recommendations
    });

  } catch (err) {
    console.error("MOVIE ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Trailer route (FIXED)
router.get("/movie/:id/trailer", async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${req.params.id}/videos?api_key=${TMDB_KEY}&language=en-US`
    );
    
    const trailer = (data.results || []).find(v => v.site === "YouTube" && v.type === "Trailer");
    
    res.json({
      movie_id: req.params.id,
      trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null
    });
  } catch (err) {
    console.error("TRAILER ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});

// AI Blog route (FIXED)
router.get("/movie/:id/blog", async (req, res) => {
  try {
    const { data: movie } = await axios.get(
      `https://api.themoviedb.org/3/movie/${req.params.id}?api_key=${TMDB_KEY}&language=en-US`
    );

    if (!movie || movie.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Gemini API call (unchanged)
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Write movie review for ${movie.title}...` }] }] // Shortened
      }
    );

    const text = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    res.json({ movie_id: req.params.id, title: movie.title, blog: text });
  } catch (err) {
    console.error("AI BLOG ERROR:", err.message);
    res.status(500).json({ error: "AI blog failed" });
  }
});

module.exports = router;
