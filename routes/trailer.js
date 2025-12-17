import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// 🎞️ Movie Trailer
router.get("/movie/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data } = await axios.get(
      `${BASE_URL}/movie/${id}/videos`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );

    // Only YouTube trailers
    const trailers = data.results.filter(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );

    res.json(trailers);
  } catch (error) {
    res.status(500).json({ error: "Trailer not found" });
  }
});

export default router;
