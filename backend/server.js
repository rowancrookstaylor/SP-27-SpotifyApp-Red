// backend/server.js
import dotenv from "dotenv";
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });


import { Buffer } from 'buffer';
import cors from "cors";
import express from "express";
import fetch from "node-fetch";
import { fileURLToPath } from "url";




// ---------- VERIFY ENV ----------
if (!process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    !process.env.SPOTIFY_REDIRECT_URI) {
  console.error("⚠️ Missing Spotify env vars!");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;

// ---------- IN-MEMORY STORAGE ----------
const codeVerifiers = {}; // { [loginId]: codeVerifier }

// ---------- UTILS ----------
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.randomBytes(length);
  return Array.from(values).map(x => possible[x % possible.length]).join('');
};

const sha256 = (plain) => crypto.createHash("sha256").update(plain).digest();
const base64encode = (buffer) =>
  buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

// ---------- LOGIN ROUTE ----------
app.get("/login", (req, res) => {
  const scope = "user-read-email user-read-private user-top-read playlist-read-private user-read-recently-played user-read-playback-state";

  // generate per-login code verifier & challenge
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64encode(sha256(codeVerifier));

  // generate a login ID to track this verifier
  const loginId = generateRandomString(16);
  codeVerifiers[loginId] = codeVerifier;

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: loginId // pass loginId so we can retrieve verifier later
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

// ---------- CALLBACK ROUTE ----------
app.get("/callback", async (req, res) => {
  const { code, state: loginId } = req.query;

  if (!code || !loginId || !codeVerifiers[loginId]) {
    return res.status(400).send("Missing code or invalid state/loginId");
  }

  const codeVerifier = codeVerifiers[loginId];
  delete codeVerifiers[loginId]; // clean up

  try {
    const body = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier,
    }).toString();

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const tokenData = await tokenResponse.json();
    console.log("Spotify token response:", tokenData);

    if (tokenData.error) {
      return res.status(500).send(JSON.stringify(tokenData));
    }

    // Redirect to Expo deep link
    res.redirect(`spotifyapp://?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}`);
  } catch (err) {
    console.error("Callback fetch error:", err);
    res.status(500).send("Error exchanging code for token :(");
  }
});

// ---------- PROTECTED ROUTES ----------
function requireToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("Missing Authorization header");
  const token = auth.split(" ")[1];
  if (!token) return res.status(401).send("Missing token");
  req.token = token;
  next();
}

// GET /me
app.get("/me", requireToken, async (req, res) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${req.token}` },
    });
    res.json(await response.json());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching profile");
  }
});

// GET /top-artists
app.get("/top-artists", requireToken, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=6",
      { headers: { Authorization: `Bearer ${req.token}` } }
    );
    res.json(await response.json());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching top artists");
  }
});

// GET /top-tracks
app.get("/top-tracks", requireToken, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=6",
      { headers: { Authorization: `Bearer ${req.token}` } }
    );
    res.json(await response.json());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching top tracks");
  }
});

// GET /playlists
app.get("/playlists", requireToken, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/playlists?limit=5",
      { headers: { Authorization: `Bearer ${req.token}` } }
    );
    res.json(await response.json());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching playlists");
  }
});

// GET /recently-played
app.get("/recently-played", requireToken, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=5",
      { headers: { Authorization: `Bearer ${req.token}` } }
    );
    res.json(await response.json());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching recently played tracks");
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));