// models/MovieExtras.js
const mongoose = require('mongoose');

const MovieExtrasSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true
    },
    songsPlaylistUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true // createdAt, updatedAt auto
  }
);

module.exports = mongoose.model('MovieExtras', MovieExtrasSchema);
