// server.js
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ FIX 1: Specific origin for Hostinger
app.use(cors({
  origin: ['https://তোমার-hostinger-url.hostingerapp.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB (unchanged - perfect)
const MONGODB_URI = process.env.MONGODB_URI;
async function connectMongo() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI missing');
      return;
    }
    await mongoose.connect(MONGODB_URI, { dbName: 'filmi-bharat' });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
  }
}
connectMongo();

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Indian Movie AI backend running' });
});

// ✅ FIX 2: Separate route prefixes
const homeRouter = require('./routes/home');
const movieRouter = require('./routes/movie');
app.use('/api/home', homeRouter);     // Changed
app.use('/api/movie', movieRouter);   // Changed

// Cron jobs (unchanged)
const { getTrendingMovies, getPopularWebSeries, getTopRatedMovies, getUpcomingMovies } = require('./services/tmdbService');
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Cron: warming up TMDB...');
    await Promise.all([getTrendingMovies(), getPopularWebSeries(), getTopRatedMovies(), getUpcomingMovies()]);
    console.log('Cron: done');
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
