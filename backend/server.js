// backend/server.js
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import { Buffer } from 'buffer';
import cors from "cors";
import express from "express";
import fetch from "node-fetch";

console.log("CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.SPOTIFY_CLIENT_SECRET ? "[HIDDEN]" : "MISSING");
console.log("REDIRECT_URI:", process.env.SPOTIFY_REDIRECT_URI);


if (!process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    !process.env.SPOTIFY_REDIRECT_URI) {
  console.error("⚠️ Missing Spotify env vars!");
  process.exit(1);
}



const app = express();
app.use(cors());
app.use(express.json());
//hello
const PORT = process.env.PORT || 8081;

// ---------- LOGIN ROUTE ----------
app.get("/login", (req, res) => {
  const scope = "user-read-email user-read-private user-top-read playlist-read-private user-read-recently-played user-read-playback-state";

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI, // must match Spotify Dashboard
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

// ---------- CALLBACK ROUTE ----------
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

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

    const tokenData = await tokenResponse.json();
    console.log("Spotify token response:", tokenData);

    if (tokenData.error) {
      console.error("Spotify token error:", tokenData);
      return res.status(500).send("Error getting token from Spotify");
    }

    // Redirect to Expo app deep link
    res.redirect(`spotifyapp://?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}`);
  } catch (err) {
    console.error("Callback fetch error:", err);
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