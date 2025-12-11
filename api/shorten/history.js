import jwt from "jsonwebtoken";
import connectMongo from "../_lib/mongoose.js";
import ShortLink from "../_lib/models/ShortLink.js";

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
    // Verify token first (before DB connection for faster rejection)
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

    // Get user's links using indexed query
    const links = await ShortLink.find({ owner: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); // Use lean() for faster read-only queries

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
