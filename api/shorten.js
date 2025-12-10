import { nanoid } from "nanoid";
import connectMongo from "./_lib/mongoose.js";
import ShortLink from "./_lib/models/ShortLink.js";
import { verifyAuth } from "./_lib/auth.js";

const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Debug: Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not defined in environment variables");
      return res
        .status(500)
        .json({
          message: "Database configuration error",
          debug: "MONGO_URI missing",
        });
    }

    console.log("Connecting to MongoDB...");
    await connectMongo();
    console.log("Connected to MongoDB");

    // POST /api/shorten - Create short link
    if (req.method === "POST") {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      if (!isValidUrl(url)) {
        return res
          .status(400)
          .json({ message: "Invalid URL. Must be http or https." });
      }

      let shortId;
      let exists = true;
      while (exists) {
        shortId = nanoid(7);
        exists = await ShortLink.findOne({ shortId });
      }

      const user = await verifyAuth(req);
      const owner = user ? user._id : null;

      const shortLink = new ShortLink({
        shortId,
        originalUrl: url,
        owner,
      });
      await shortLink.save();

      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      const shortUrl = `${baseUrl}/r/${shortId}`;

      return res.status(201).json({
        shortUrl,
        shortId,
        originalUrl: url,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Shorten error:", error.message, error.stack);
    return res.status(500).json({
      message: "Server error",
      debug: error.message,
    });
  }
}
