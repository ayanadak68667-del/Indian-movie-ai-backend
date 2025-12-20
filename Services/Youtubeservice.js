// services/youtubeService.js
const fetch = require('node-fetch');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE_URL = 'https://www.googleapis.com/youtube/v3';

if (!YOUTUBE_API_KEY) {
  console.error('YOUTUBE_API_KEY is missing in environment variables');
}

/**
 * YouTube search helper
 * q উদাহরণ: "Animal 2023 official trailer"
 */
async function youtubeSearch(params) {
  const url = new URL(`${YT_BASE_URL}/search`);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', params.maxResults || 5);
  url.searchParams.set('q', params.q);
  // official trailer পাওয়ার জন্য একটু হিন্ট
  if (params.videoDuration) {
    url.searchParams.set('videoDuration', params.videoDuration);
  }
  if (params.regionCode) {
    url.searchParams.set('regionCode', params.regionCode);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('YouTube error:', res.status, text);
    throw new Error(`YouTube request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Best trailer finder
 * ইনপুট: movieTitle, year (optional)
 * আউটপুট: { videoId, title, thumbnailUrl } বা null
 */
async function getOfficialTrailer(movieTitle, year) {
  if (!movieTitle) return null;

  const queryParts = [movieTitle.trim(), 'official trailer'];
  if (year) queryParts.push(String(year));
  const q = queryParts.join(' ');

  const items = await youtubeSearch({
    q,
    maxResults: 5,
    regionCode: 'IN'
  });

  if (!items.length) return null;

  // প্রথম valid video pick করি (embeddable ধরে নিচ্ছি)
  const first = items[0];
  const videoId = first.id && first.id.videoId;
  if (!videoId) return null;

  const snippet = first.snippet || {};
  const thumbs = snippet.thumbnails || {};
  const thumb =
    (thumbs.high && thumbs.high.url) ||
    (thumbs.medium && thumbs.medium.url) ||
    (thumbs.default && thumbs.default.url) ||
    null;

  return {
    videoId,
    title: snippet.title,
    thumbnailUrl: thumb,
    channelTitle: snippet.channelTitle
  };
}

module.exports = {
  getOfficialTrailer
};
