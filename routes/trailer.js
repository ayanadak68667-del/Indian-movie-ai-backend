import express from "express";

const router = express.Router();

/**
 * GET /api/trailer/:title
 * Example: /api/trailer/3 idiots
 */
router.get("/:title", async (req, res) => {
  const { title } = req.params;

  // 🔁 Fallback trailer search (YouTube search link)
  const query = encodeURIComponent(`${title} official trailer`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${query}`;

  res.json({
    title,
    trailerType: "youtube-search",
    trailerUrl: youtubeSearchUrl,
    note: "YouTube API not used (fallback mode)",
  });
});

export default router;
