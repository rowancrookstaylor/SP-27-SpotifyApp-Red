import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { encode as encodeBase64 } from 'base64-arraybuffer';
import { useSpotify } from '../context/SpotifyContext';
import { Platform } from 'react-native';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const BACKEND_URL = 'https://sp-27-spotifyapp-red.onrender.com/callback';

// Generate random string for PKCE
export function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < length; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
  return str;
}

// Cross-platform SHA256 code challenge
export async function generateCodeChallenge(codeVerifier: string) {
  if (Platform.OS === 'web') {
    // Web browser fallback
    const buffer = new TextEncoder().encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const bytes = new Uint8Array(hash);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } else {
    // Mobile / Expo Go
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

// Main login hook
export function useSpotifyAuth() {
  const { setTokens } = useSpotify();

  const login = async () => {
    try {
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = Linking.createURL('');

      const authUrl = `${SPOTIFY_AUTH_URL}?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-private user-read-email&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

      Linking.openURL(authUrl);

      // Wait for redirect
      const code = await new Promise<string>((resolve) => {
        const listener = Linking.addEventListener('url', ({ url }) => {
          listener.remove();
          const query = Linking.parse(url).queryParams;
          resolve(query?.code as string);
        });
      });

      // Exchange code via backend
      const tokenResponse = await fetch(`${BACKEND_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      }).then((r) => r.json());

      setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
    } catch (err) {
      console.error('Spotify login error:', err);
    }
  };

  return { login };
}