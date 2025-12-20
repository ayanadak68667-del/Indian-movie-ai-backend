// server.js
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config(); // local dev এর জন্য, Render এ env UI থেকে আসবে

const app = express();

// Basic middlewares
app.use(cors()); // Public API হিসেবে সব origin allow করা আছে
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Indian Movie AI backend is running' });
});

// Routes
const homeRouter = require('./routes/home');
const movieRouter = require('./routes/movie');

app.use('/api/home', homeRouter);
app.use('/api/movie', movieRouter);

// 24 ঘন্টা অন্তর data warmup (optional, future use)
const {
  getTrendingMovies,
  getPopularWebSeries,
  getTopRatedMovies,
  getUpcomingMovies
} = require('./services/tmdbService');

cron.schedule('0 0 * * *', async () => {
  // Every day at midnight (server time) [web:182][web:181]
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

// Port config (Render / local)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
