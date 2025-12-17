import express from "express";
import cors from "cors";

import indianRoutes from "./routes/indian.js";
import detailsRoutes from "./routes/details.js";
import aiRoutes from "./routes/ai.js";
import trailerRoutes from "./routes/trailer.js";
import ottRoutes from "./routes/ott.js";

const app = express();

// ========================
// 🔧 MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());

// ========================
// 🏠 HEALTH CHECK
// ========================
app.get("/", (req, res) => {
  res.send("✅ Filmi Bharat Backend is running");
});

// ========================
// 🇮🇳 INDIAN CONTENT ROUTES
// ========================
app.use("/api/indian", indianRoutes);

// ========================
// 🎬 DETAILS (Movie / TV)
// ========================
app.use("/api/details", detailsRoutes);

// ========================
// 🤖 AI FEATURES
// ========================
app.use("/api/ai", aiRoutes);

// ========================
// 🎞️ TRAILER
// ========================
app.use("/api/trailer", trailerRoutes);

// ========================
// 📺 OTT PLATFORMS
// ========================
app.use("/api/ott", ottRoutes);

// ========================
// 🚀 SERVER START
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
