// services/youtubeSongsService.js
const fetch = require('node-fetch');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function youtubePlaylistSearch(q, maxResults = 3) {
  const url = new URL(`${YT_BASE_URL}/search`);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'playlist');
  url.searchParams.set('maxResults', maxResults);
  url.searchParams.set('q', q);
  url.searchParams.set('regionCode', 'IN');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('YouTube error');

  const data = await res.json();
  return data.items || [];
}

async function getSongsPlaylist(movieTitle, year) {
  if (!movieTitle) return null;

  const q = `${movieTitle} movie songs playlist ${year || ''}`;
  const items = await youtubePlaylistSearch(q);

  if (!items.length) return null;

  const playlistId = items[0]?.id?.playlistId;
  if (!playlistId) return null;

  return {
    url: `https://www.youtube.com/embed/videoseries?list=${playlistId}`
  };
}

module.exports = { getSongsPlaylist };
