// routes/movie.js (শুধু এই প্রথম /movie/:id ব্লকটা replace করো)
const express = require("express");
const router = express.Router();

const fetch = global.fetch;
const TMDB_KEY = process.env.TMDB_API_KEY;

/* =========================
   MOVIE DETAILS – CINEMATIC PAYLOAD
========================= */
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const base = "https://api.themoviedb.org/3";

    const [detailsRes, creditsRes, providersRes, recsRes] =
      await Promise.all([
        fetch(`${base}/movie/${movieId}?api_key=${TMDB_KEY}&language=en-US`),
        fetch(`${base}/movie/${movieId}/credits?api_key=${TMDB_KEY}&language=en-US`),
        fetch(`${base}/movie/${movieId}/watch/providers?api_key=${TMDB_KEY}`),
        fetch(`${base}/movie/${movieId}/recommendations?api_key=${TMDB_KEY}&language=en-US`)
      ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const providers = await providersRes.json();
    const recs = await recsRes.json();

    if (!details || details.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // CAST
    const cast = (credits.cast || []).slice(0, 12).map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      profileUrl: p.profile_path
        ? `https://image.tmdb.org/t/p/w185${p.profile_path}`
        : null
    }));

    // BEHIND THE SCENES – Director / Writer / Producer
    const crew = credits.crew || [];
    const directors = crew
      .filter((c) => c.job === "Director")
      .map((c) => c.name);
    const writers = crew
      .filter((c) =>
        ["Writer", "Screenplay", "Story"].includes(c.job)
      )
      .map((c) => c.name);
    const producers = crew
      .filter((c) =>
        ["Producer", "Executive Producer"].includes(c.job)
      )
      .map((c) => c.name);

    // STREAMING (OTT)
    const inProviders = providers.results?.IN || {};
    const flatrate = inProviders.flatrate || [];
    const streamingLinks = flatrate.map((p) => ({
      platform: p.provider_name,
      logoUrl: p.logo_path
        ? `https://image.tmdb.org/t/p/w92${p.logo_path}`
        : null
    }));

    // RECOMMENDATIONS
    const recommendations = (recs.results || []).slice(0, 20).map((r) => ({
      id: r.id,
      title: r.title,
      posterUrl: r.poster_path
        ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
        : null
    }));

    // TEMP AI SUMMARY + BUSINESS DATA (demo)
    const aiSummary =
      "Atlee’s directorial venture combines mass entertainment with social messaging. The film delivers powerful performances while addressing corruption and inequality through spectacular action set pieces and emotional depth.";

    // NOTE: চাইলে details.budget / details.revenue থেকে এগুলো auto করতে পারো
    const budgetCrore =
      details.budget && details.budget > 0
        ? Math.round(details.budget / 10000000) // USD → INR handle করিনি, শুধু demo
        : 300;
    const boxOfficeCrore =
      details.revenue && details.revenue > 0
        ? Math.round(details.revenue / 10000000)
        : 1160;

    res.json({
      id: details.id,
      title: details.title,
      overview: details.overview,
      releaseDate: details.release_date,
      runtime: details.runtime,
      voteAverage: details.vote_average,
      genres: (details.genres || []).map((g) => g.name),
      posterUrl: details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null,
      backdropUrl: details.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}`
        : null,

      // NEW FIELDS FOR CINEMATIC DASHBOARD
      aiSummary,
      budget: budgetCrore,
      boxOffice: boxOfficeCrore,
      directors,
      writers,
      producers,

      cast,
      streamingLinks,
      recommendations
    });
  } catch (err) {
    console.error("MOVIE DETAILS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

/* বাকি trailer + blog routes যেমন আছে তেমনই রাখো */
