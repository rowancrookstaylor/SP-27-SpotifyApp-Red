// backend/server.js
import dotenv from "dotenv";
dotenv.config();


import cors from "cors";
import express from "express";
import fetch from "node-fetch";



const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Endpoint to exchange code for tokens
app.post("/auth/token", async (req, res) => {
  const { code } = req.body;
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get token" });
  }
});

// Endpoint to refresh tokens
app.post("/auth/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));