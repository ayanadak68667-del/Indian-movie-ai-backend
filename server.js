// server.js
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose'); // ✅ ADD
require('dotenv').config(); // Render env থাকলেও এটা সমস্যা করে না

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   ✅ MongoDB Connection (FIXED)
========================= */
const MONGODB_URI = process.env.MONGODB_URI;

async function connectMongo() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI missing in environment');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: 'filmi-bharat'
    });

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}

connectMongo();

/* =========================
   Health check
========================= */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Indian Movie AI backend is running'
  });
});

/* =========================
   Routes
========================= */
const homeRouter = require('./routes/home');
const movieRouter = require('./routes/movie');

app.use('/api', homeRouter);
app.use('/api', movieRouter);

/* =========================
   Cron Jobs (UNCHANGED)
========================= */
const {
  getTrendingMovies,
  getPopularWebSeries,
  getTopRatedMovies,
  getUpcomingMovies
} = require('./services/tmdbService');

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Cron: warming up TMDB caches...');
    await Promise.all([
      getTrendingMovies(),
      getPopularWebSeries(),
      getTopRatedMovies(),
      getUpcomingMovies()
    ]);
    console.log('Cron: TMDB warmup done');
  } catch (err) {
    console.error('Cron error:', err.message || err);
  }
});

/* =========================
   Server start
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
