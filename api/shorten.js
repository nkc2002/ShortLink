import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import connectMongo from "./_lib/mongoose.js";
import ShortLink from "./_lib/models/ShortLink.js";

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
    const shortId = nanoid(7);

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
