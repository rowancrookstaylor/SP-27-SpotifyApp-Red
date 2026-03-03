import * as Linking from 'expo-linking';
import * as Random from 'expo-random';
import base64 from 'react-native-base64';
import { useSpotify } from '../context/SpotifyContext';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const BACKEND_URL = 'https://YOUR_RENDER_BACKEND_URL';

function generateRandomString(length: number) {
  const randomBytes = Random.getRandomBytes(length);
  return base64.encodeFromByteArray(randomBytes);
}

export function useSpotifyAuth() {
  const { setTokens } = useSpotify();

  const login = async () => {
    const codeVerifier = generateRandomString(128);
    const redirectUri = Linking.createURL(''); // Expo Linking

    const codeChallenge = base64.encode(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
      )
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const authUrl = `${SPOTIFY_AUTH_URL}?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-private user-read-email&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    // Open Spotify login
    Linking.openURL(authUrl);

    // Handle redirect
    const result = await new Promise<any>((resolve) => {
      const listener = Linking.addEventListener('url', ({ url }) => {
        listener.remove();
        const code = Linking.parse(url).queryParams?.code;
        resolve(code);
      });
    });

    // Exchange code for token via backend
    const tokenResponse = await fetch(`${BACKEND_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: result, redirect_uri: redirectUri })
    }).then(r => r.json());

    setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
  };

  return { login };
}