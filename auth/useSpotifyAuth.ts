// Location: src/auth/useSpotifyAuth.ts
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useSpotify } from '../context/SpotifyContext';
import { useState, useEffect } from 'react';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const BACKEND_URL = 'https://sp-27-spotifyapp-red.onrender.com/callback';

// Generate PKCE code verifier
function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < length; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
  return str;
}

// SHA256 code challenge
async function generateCodeChallenge(codeVerifier: string) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useSpotifyAuth() {
  const { setTokens } = useSpotify();
  const [request, setRequest] = useState<AuthSession.AuthRequest | null>(null);

  // Setup AuthRequest once
  useEffect(() => {
    const setup = async () => {
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = AuthSession.makeRedirectUri();

      const req = new AuthSession.AuthRequest({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        scopes: ['user-read-private', 'user-read-email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
      });

      setRequest(req);
    };

    setup();
  }, []);

  // Login function
  const login = async () => {
    if (!request) return;

    try {
      const result = await request.promptAsync();

      if (result.type === 'success' && result.params.code) {
        const redirectUri = request.redirectUri;
        const tokenResponse = await fetch(`${BACKEND_URL}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: result.params.code, redirect_uri: redirectUri }),
        }).then((r) => r.json());

        setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
      }
    } catch (err) {
      console.error('Spotify login error:', err);
    }
  };

  return { login };
}