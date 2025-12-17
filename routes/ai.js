import express from "express";

const router = express.Router();

/**
 * POST /api/ai/explain
 * body: { title, overview, rating, genre }
 */
router.post("/explain", async (req, res) => {
  const { title, overview, rating, genre } = req.body;

  // 🧠 Fallback AI logic (no external API)
  const explanation = `
"${title}" is a ${genre?.join(", ") || "film"} that explores an engaging story.
It has received an average rating of ${rating || "N/A"}.
The movie focuses on emotional depth, strong performances,
and a storyline that keeps the audience connected.
`;

  res.json({
    type: "explanation",
    title,
    result: explanation.trim(),
    ai: "fallback",
  });
});

/**
 * POST /api/ai/recommend
 * body: { mood }
 */
router.post("/recommend", async (req, res) => {
  const { mood } = req.body;

  const recommendations = {
    happy: ["3 Idiots", "Chhichhore", "PK"],
    sad: ["Kal Ho Naa Ho", "Taare Zameen Par"],
    action: ["War", "Pathaan", "KGF"],
    romance: ["DDLJ", "Veer-Zaara", "Rockstar"],
  };

  res.json({
    type: "recommendation",
    mood,
    movies: recommendations[mood] || ["Forrest Gump", "The Pursuit of Happyness"],
    ai: "fallback",
  });
});

/**
 * POST /api/ai/summary
 * body: { overview }
 */
router.post("/summary", async (req, res) => {
  const { overview } = req.body;

  res.json({
    type: "summary",
    result: overview
      ? overview.split(".").slice(0, 2).join(".") + "."
      : "No overview available.",
    ai: "fallback",
  });
});

export default router;
