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

    // Validate input before connecting to DB (fail fast)
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    await connectMongo();

    // Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await user.save();

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

    return res.status(201).json({
      message: "Registration successful",
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ message: "Server error", debug: error.message });
  }
}
