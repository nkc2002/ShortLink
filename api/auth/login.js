import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongo from "../_lib/mongoose.js";
import User from "../_lib/models/User.js";

// Handler
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Validate input before connecting to DB
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    await connectMongo();

    // Find user with lean() for faster query
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.setHeader(
      "Set-Cookie",
      `token=${token}; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }; HttpOnly; SameSite=Lax`
    );

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Server error", debug: error.message });
  }
}
