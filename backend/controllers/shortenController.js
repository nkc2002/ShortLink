import { nanoid } from "nanoid";
import { ShortLink } from "../models/index.js";

// Validate URL helper
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// POST /api/shorten
export const createShortLink = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    if (!isValidUrl(url)) {
      return res
        .status(400)
        .json({ message: "Invalid URL. Must be http or https." });
    }

    // Generate unique shortId
    let shortId;
    let exists = true;

    while (exists) {
      shortId = nanoid(7);
      exists = await ShortLink.findOne({ shortId });
    }

    // Get owner from auth middleware (if authenticated)
    const owner = req.user ? req.user._id : null;

    // Create short link
    const shortLink = new ShortLink({
      shortId,
      originalUrl: url,
      owner,
    });

    await shortLink.save();

    // Build short URL
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const shortUrl = `${baseUrl}/r/${shortId}`;

    res.status(201).json({
      shortUrl,
      shortId,
      originalUrl: url,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/shorten/history
export const getHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const links = await ShortLink.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const formattedLinks = links.map((link) => ({
      id: link._id,
      shortId: link.shortId,
      shortUrl: `${baseUrl}/r/${link.shortId}`,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    }));

    res.json({ links: formattedLinks });
  } catch (error) {
    next(error);
  }
};

// GET /api/shorten/:shortId/stats
export const getStats = async (req, res, next) => {
  try {
    const { shortId } = req.params;

    const link = await ShortLink.findOne({ shortId });

    if (!link) {
      return res.status(404).json({ message: "Short link not found" });
    }

    res.json({
      shortId: link.shortId,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shorten/:shortId
export const deleteShortLink = async (req, res, next) => {
  try {
    const { shortId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const link = await ShortLink.findOne({ shortId, owner: req.user._id });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Short link not found or not authorized" });
    }

    await ShortLink.deleteOne({ _id: link._id });

    res.json({ message: "Short link deleted successfully" });
  } catch (error) {
    next(error);
  }
};
