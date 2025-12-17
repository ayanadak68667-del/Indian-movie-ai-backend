/**
 * 🧠 AI Service (Fallback-first)
 * Later: Gemini / OpenAI replaceable
 */

// ✍️ Movie / Series AI Blog
export const generateAIBlog = ({
  title,
  overview,
  genres = [],
  rating,
  releaseDate,
}) => {
  if (!overview) {
    return `“${title}” is an Indian cinematic experience that has gained attention for its storytelling and performances.`;
  }

  return `
"${title}" is an Indian ${genres.join(", ") || "film"} released on ${
    releaseDate || "recently"
  }.
The movie has received an average rating of ${
    rating ? rating.toFixed(1) : "N/A"
  }.

Story-wise, ${overview}

Overall, "${title}" stands out for its direction, performances,
and emotional depth, making it a notable watch for Indian cinema lovers.
`.trim();
};

// 🎯 Micro-personalized recommendations
export const getAIRecommendations = (genres = []) => {
  const map = {
    Action: ["War", "Pathaan", "KGF"],
    Drama: ["3 Idiots", "Taare Zameen Par"],
    Romance: ["Veer-Zaara", "DDLJ"],
    Thriller: ["Andhadhun", "Drishyam"],
  };

  let result = [];

  genres.forEach((g) => {
    if (map[g]) result.push(...map[g]);
  });

  return [...new Set(result)].slice(0, 5);
};

// 📝 Short AI Summary
export const generateSummary = (overview) => {
  if (!overview) return "No summary available.";

  return overview.split(".").slice(0, 2).join(".") + ".";
};
