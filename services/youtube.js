import axios from "axios";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * 🎞️ Get official trailer videoId
 * If API key missing → fallback search URL
 */
export const getTrailer = async (title) => {
  // 🔁 Fallback (no API key)
  if (!API_KEY) {
    const q = encodeURIComponent(`${title} official trailer`);
    return {
      mode: "fallback",
      embedUrl: null,
      searchUrl: `https://www.youtube.com/results?search_query=${q}`,
    };
  }

  // ✅ API mode
  const { data } = await axios.get(`${YT_BASE}/search`, {
    params: {
      key: API_KEY,
      q: `${title} official trailer`,
      part: "snippet",
      maxResults: 1,
      type: "video",
    },
  });

  const videoId = data.items?.[0]?.id?.videoId || null;

  return {
    mode: "api",
    videoId,
    embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
    searchUrl: null,
  };
};

/**
 * 🎵 Get movie songs playlist (fallback-friendly)
 */
export const getSongsPlaylist = async (title) => {
  const q = encodeURIComponent(`${title} songs playlist`);
  return {
    embedUrl: null,
    searchUrl: `https://www.youtube.com/results?search_query=${q}`,
  };
};
