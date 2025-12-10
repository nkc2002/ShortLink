import { verifyAuth } from "../_lib/auth.js";
import connectMongo from "../_lib/mongoose.js";

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
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
