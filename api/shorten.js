import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

// MongoDB connection
let cached = global._mongoose || { conn: null, promise: null };
global._mongoose = cached;

async function connectMongo() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ShortLink Schema
const shortLinkSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const ShortLink =
  mongoose.models.ShortLink || mongoose.model("ShortLink", shortLinkSchema);

// Parse cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });
  }
  return cookies;
}

// Get user from token
function getUserId(req) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// Handler
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectMongo();

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.status(400).json({ message: "Invalid URL" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Get owner if logged in
    const owner = getUserId(req);

    // Generate unique shortId
    let shortId = nanoid(7);

    const shortLink = new ShortLink({
      shortId,
      originalUrl: url,
      owner,
    });
    await shortLink.save();

    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

    return res.status(201).json({
      shortUrl: `${baseUrl}/r/${shortId}`,
      shortId,
      originalUrl: url,
    });
  } catch (error) {
    console.error("Shorten error:", error);
    return res
      .status(500)
      .json({ message: "Server error", debug: error.message });
  }
}
