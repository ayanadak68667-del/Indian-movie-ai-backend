import express from "express";
import axios from "axios";

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// ======================================
// 🤖 AI Analysis & Insights (FINAL)
// ======================================
router.get("/movie-analysis/:id", async (req, res) => {
  try {
    const movieId = req.params.id;

    // Fetch movie + credits
    const { data } = await axios.get(
      `${BASE_URL}/movie/${movieId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "credits",
        },
      }
    );

    const title = data.title;
    const overview = data.overview || "Story details are currently unavailable.";
    const rating = data.vote_average || "N/A";
    const budget = data.budget || null;
    const revenue = data.revenue || null;

    // Lead actor info
    const lead = data.credits?.cast?.[0];
    const actorName = lead?.name || "the lead actor";
    const characterName = lead?.character || "the main character";

    const profit =
      budget && revenue ? revenue - budget : null;

    const blog = `
🧠 AI Analysis & Insights

🎬 ${title}

📖 Synopsis:
${overview}

🎭 Performance Spotlight:
${actorName} stands out in the role of ${characterName}. 
The performance feels natural and emotionally grounded, helping the audience connect deeply with the character.
The actor’s screen presence plays a major role in elevating the film’s overall impact.

✅ The Scorecard (What Works Well):
• Strong lead performance that anchors the story  
• Engaging narrative with emotional moments  
• Effective direction and pacing in key scenes  
• Good production value and cinematic presentation  

⚠️ The Caveat (What Could Be Better):
• Certain portions may feel slow for some viewers  
• Supporting characters could have been explored more deeply  
• The narrative may feel predictable in parts  

📊 Data Deep Dive (Box Office & Ratings):
IMDb Rating: ${rating}/10  
Budget: ${budget ? budget + " USD" : "N/A"}  
Box Office Collection: ${revenue ? revenue + " USD" : "N/A"}  

${profit !== null
  ? profit > 0
    ? "Financial Verdict: The movie performed well commercially and recovered its budget successfully."
    : "Financial Verdict: The movie struggled to achieve strong box office returns."
  : "Financial Verdict: Complete financial data is not available."}

🎯 Who Should Watch This?
This movie is ideal for viewers who enjoy character-driven stories, 
strong acting performances, and emotionally engaging cinema.
Fans of drama and mainstream Indian films will likely appreciate this experience.
`;

    res.json({
      movieId,
      title,
      analysisTitle: "AI Analysis & Insights",
      leadActor: actorName,
      character: characterName,
      content: blog.trim(),
    });
  } catch (error) {
    console.error("AI Blog Error:", error.message);
    res.status(500).json({
      error: "Failed to generate AI Analysis & Insights",
    });
  }
});

export default router;
