import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// 📺 OTT platforms (Movie / TV)
// type = movie | tv
router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (!["movie", "tv"].includes(type)) {
    return res.status(400).json({ error: "Invalid content type" });
  }

  try {
    const { data } = await axios.get(
      `${TMDB_BASE}/${type}/${id}/watch/providers`,
      {
        params: { api_key: API_KEY },
      }
    );

    // 🇮🇳 India providers only
    const indiaProviders = data.results?.IN;

    if (!indiaProviders) {
      return res.json({
        platforms: [],
        message: "No OTT providers found for India",
      });
    }

    const platforms = [];

    // Streaming
    indiaProviders.flatrate?.forEach((p) => {
      platforms.push({
        platform: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        type: "stream",
      });
    });

    // Rent
    indiaProviders.rent?.forEach((p) => {
      platforms.push({
        platform: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        type: "rent",
      });
    });

    // Buy
    indiaProviders.buy?.forEach((p) => {
      platforms.push({
        platform: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        type: "buy",
      });
    });

    res.json({
      country: "IN",
      platforms,
      tmdbLink: indiaProviders.link,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OTT providers" });
  }
});

export default router;
