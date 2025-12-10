import connectMongo from "../_lib/mongoose.js";
import ShortLink from "../_lib/models/ShortLink.js";
import ClickLog from "../_lib/models/ClickLog.js";
import { sendTelegram } from "../_lib/telegram.js";

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
};

const parseUserAgent = (ua) => {
  if (!ua) return "Unknown";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Linux")) return "Linux";
  return "Browser";
};

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

    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ message: "Short link has expired" });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const referer = req.headers["referer"] || null;

    // Redirect immediately
    res.redirect(302, link.originalUrl);

    // Background tasks (fire and forget)
    Promise.all([
      ShortLink.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }),
      ClickLog.create({ shortId, ip, userAgent, referer, at: new Date() }),
      sendTelegram(
        `🔗 <b>Link Clicked!</b>\n\n` +
          `📎 <b>Short ID:</b> <code>${shortId}</code>\n` +
          `🌐 <b>URL:</b> ${link.originalUrl.substring(0, 80)}...\n` +
          `📍 <b>IP:</b> <code>${ip}</code>\n` +
          `📱 <b>Device:</b> ${parseUserAgent(userAgent)}\n` +
          `🕐 <b>Time:</b> ${new Date().toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
          })}`
      ),
    ]).catch((err) => console.error("Background error:", err.message));
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
