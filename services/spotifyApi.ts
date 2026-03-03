// services/spotifyApi.ts

const CLIENT_ID = '9757040e89904a92871a38381243d8e8';

import { useSpotify } from '../context/SpotifyContext';

const API_URL = 'https://api.spotify.com/v1';

export async function getUserProfile(accessToken: string) {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json();
}