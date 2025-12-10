import mongoose from "mongoose";
import jwt from "jsonwebtoken";

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

// Handler
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verify token
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    await connectMongo();

    // Get user's links
    const links = await ShortLink.find({ owner: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

    const formattedLinks = links.map((link) => ({
      id: link._id,
      shortId: link.shortId,
      shortUrl: `${baseUrl}/r/${link.shortId}`,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt,
    }));

    return res.status(200).json({ links: formattedLinks });
  } catch (error) {
    console.error("History error:", error);
    return res
      .status(500)
      .json({ message: "Server error", debug: error.message });
  }
}
