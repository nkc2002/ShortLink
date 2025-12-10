export default function handler(req, res) {
  return res.status(200).json({
    message: "API is working",
    mongoUri: process.env.MONGO_URI ? "defined" : "NOT DEFINED",
    jwtSecret: process.env.JWT_SECRET ? "defined" : "NOT DEFINED",
  });
}
