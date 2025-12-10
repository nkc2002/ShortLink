import mongoose from "mongoose";
import axios from "axios";

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

// ClickLog Schema
const clickLogSchema = new mongoose.Schema({
  shortId: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  referer: { type: String },
  at: { type: Date, default: Date.now },
});

const ClickLog =
  mongoose.models.ClickLog || mongoose.model("ClickLog", clickLogSchema);

// Send Telegram message
async function sendTelegram(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("[Telegram] Not configured");
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    console.log("[Telegram] Message sent");
  } catch (error) {
    console.error("[Telegram] Error:", error.message);
  }
}

// Get client IP
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

// Parse user agent
function parseUserAgent(ua) {
  if (!ua) return "Unknown";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "Mac";
  return "Browser";
}

// Handler
export default async function handler(req, res) {
  const { shortId } = req.query;

  if (!shortId) {
    return res.status(400).json({ message: "Short ID required" });
  }

  try {
    await connectMongo();

    const link = await ShortLink.findOne({ shortId });

    if (!link) {
      return res.status(404).json({ message: "Short link not found" });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers["referer"] || "";

    // Redirect immediately
    res.redirect(302, link.originalUrl);

    // Background tasks
    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    Promise.all([
      ShortLink.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }),
      ClickLog.create({ shortId, ip, userAgent, referer }),
      sendTelegram(
        `🔗 <b>Link Clicked!</b>\n\n` +
          `📎 <b>Short ID:</b> <code>${shortId}</code>\n` +
          `🌐 <b>URL:</b> ${link.originalUrl.substring(0, 80)}${
            link.originalUrl.length > 80 ? "..." : ""
          }\n` +
          `📍 <b>IP:</b> <code>${ip}</code>\n` +
          `📱 <b>Device:</b> ${parseUserAgent(userAgent)}\n` +
          `🕐 <b>Time:</b> ${now}`
      ),
    ]).catch((err) => console.error("Background error:", err.message));
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
