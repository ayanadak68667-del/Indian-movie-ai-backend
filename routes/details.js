import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

router.get("/movie/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data } = await axios.get(
      `${BASE_URL}/movie/${id}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "credits,watch/providers,videos",
        },
      }
    );

    // 🎭 Crew extract
    const director = data.credits.crew.find(
      (c) => c.job === "Director"
    );

    const writers = data.credits.crew.filter(
      (c) => c.job === "Writer" || c.job === "Screenplay"
    );

    res.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster: data.poster_path,
      backdrop: data.backdrop_path,
      releaseDate: data.release_date,
      runtime: data.runtime,
      genres: data.genres,
      rating: data.vote_average,

      // 💰 Business
      budget: data.budget,
      revenue: data.revenue,

      // 🎬 Credits
      director,
      writers,
      production: data.production_companies,

      // 📺 OTT
      ott: data["watch/providers"]?.results?.IN || null,

      // 🎞️ Trailer
      trailer: data.videos.results.find(
        (v) => v.site === "YouTube" && v.type === "Trailer"
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Movie details failed" });
  }
});

export default router;
