import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// 🎥 Movie / TV full details
// type = movie | tv
router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (!["movie", "tv"].includes(type)) {
    return res.status(400).json({ error: "Invalid content type" });
  }

  try {
    // 1️⃣ Main details
    const detailsRes = await axios.get(`${TMDB_BASE}/${type}/${id}`, {
      params: { api_key: API_KEY },
    });

    // 2️⃣ Credits (cast & crew)
    const creditsRes = await axios.get(`${TMDB_BASE}/${type}/${id}/credits`, {
      params: { api_key: API_KEY },
    });

    const credits = creditsRes.data;

    // 🎭 Top cast (with images)
    const cast = credits.cast.slice(0, 10).map((actor) => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profile:
        actor.profile_path
          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
          : null,
    }));

    // 🎬 Crew filters
    const director = credits.crew.find((c) => c.job === "Director")?.name || null;
    const writers = credits.crew
      .filter((c) => ["Writer", "Screenplay"].includes(c.job))
      .map((w) => w.name);

    const producers = credits.crew
      .filter((c) => c.job === "Producer")
      .map((p) => p.name);

    // 💰 Budget & Box Office (Movies only)
    const budget = type === "movie" ? detailsRes.data.budget : null;
    const revenue = type === "movie" ? detailsRes.data.revenue : null;

    res.json({
      id: detailsRes.data.id,
      type,
      title: detailsRes.data.title || detailsRes.data.name,
      overview: detailsRes.data.overview,
      releaseDate: detailsRes.data.release_date || detailsRes.data.first_air_date,
      runtime: detailsRes.data.runtime || detailsRes.data.episode_run_time?.[0],
      rating: detailsRes.data.vote_average,
      genres: detailsRes.data.genres,
      poster: `https://image.tmdb.org/t/p/w500${detailsRes.data.poster_path}`,
      backdrop: `https://image.tmdb.org/t/p/original${detailsRes.data.backdrop_path}`,
      cast,
      director,
      writers,
      producers,
      budget,
      boxOffice: revenue,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch content details" });
  }
});

export default router;
