import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// =========================
// 🤖 AI Movie Analysis
// =========================
router.get("/movie-analysis/:id", async (req, res) => {
  try {
    const movieId = req.params.id;

    const { data } = await axios.get(
      `${BASE_URL}/movie/${movieId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );

    const title = data.title;
    const overview = data.overview || "No overview available.";
    const rating = data.vote_average || "N/A";
    const budget = data.budget;
    const revenue = data.revenue;
    const profit = revenue - budget;

    const blog = `
🎬 ${title}

📖 Story Overview:
${overview}

⭐ Rating Analysis:
IMDb rating is ${rating}, indicating strong audience interest.

💰 Box Office:
Budget: ${budget ? budget + " USD" : "N/A"}
Revenue: ${revenue ? revenue + " USD" : "N/A"}

📊 Verdict:
${profit > 0 ? "This movie was a box office success." : "This movie underperformed at the box office."}

👥 Recommended For:
Perfect for viewers who enjoy engaging storytelling and cinematic experiences.
`;

    res.json({
      movieId,
      title,
      analysis: blog.trim(),
    });
  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    res.status(500).json({
      error: "Failed to generate AI movie analysis",
    });
  }
});

export default router;
