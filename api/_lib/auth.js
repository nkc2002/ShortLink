import jwt from "jsonwebtoken";
import connectMongo from "../mongoose.js";
import User from "../models/User.js";

export async function verifyAuth(req) {
  const token =
    req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectMongo();
    const user = await User.findById(decoded.userId);
    return user;
  } catch {
    return null;
  }
}

export function setCookie(res, name, value, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    ...options,
  };

  const cookieString = `${name}=${value}; Path=${cookieOptions.path}; Max-Age=${
    cookieOptions.maxAge
  }; ${cookieOptions.httpOnly ? "HttpOnly;" : ""} ${
    cookieOptions.secure ? "Secure;" : ""
  } SameSite=${cookieOptions.sameSite}`;

  res.setHeader("Set-Cookie", cookieString);
}

export function clearCookie(res, name) {
  res.setHeader(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=lax`
  );
}
