import connectMongo from "../_lib/mongoose.js";
import ShortLink from "../_lib/models/ShortLink.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectMongo();
    const user = await verifyAuth(req);

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const links = await ShortLink.find({ owner: user._id })
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
    return res.status(500).json({ message: "Server error" });
  }
}
