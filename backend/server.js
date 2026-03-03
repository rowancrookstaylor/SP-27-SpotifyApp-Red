// backend/server.js

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

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

// ---------- LOGIN ROUTE ----------
app.get("/login", (req, res) => {
    console.log("REDIRECT URI:", process.env.SPOTIFY_REDIRECT_URI);

  if (!process.env.SPOTIFY_REDIRECT_URI) {
    return res.status(500).send("Redirect URI is undefined on backend");
  }

  const scope =
    "user-read-email user-read-private user-top-read playlist-read-private user-read-recently-played user-read-playback-state";

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

// ---------- CALLBACK ROUTE ----------
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_REDIRECT_URI) {
    return res.status(500).send("Spotify env variables are missing");
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
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
      body: body,
    });

    

const data = await response.json();
console.log("Spotify token response:", data);

    // Redirect to app with access & refresh token
    res.redirect(`spotifyapp://?access_token=${data.access_token}&refresh_token=${data.refresh_token}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exchanging code for token");
  }
});

// ---------- PROTECTED ROUTES ----------

// Middleware to get token from header
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
    const data = await response.json();
    res.json(data);
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
    const data = await response.json();
    res.json(data);
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
    const data = await response.json();
    res.json(data);
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
    const data = await response.json();
    res.json(data);
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
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching recently played tracks");
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});