// server.js
const connectDB = require("./config/db"); // Database connection import
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Connect to Database (Express start হওয়ার আগেই)
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Indian Movie AI backend is running' });
});

// Routes
const homeRouter = require('./routes/home');
const movieRouter = require('./routes/movie');

// API Routes
app.use('/api', homeRouter);
app.use('/api', movieRouter);

// Cron Jobs
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

// Port configuration
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
