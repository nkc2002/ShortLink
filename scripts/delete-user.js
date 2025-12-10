import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/shortlink";

async function deleteUser(email) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.collection("users").deleteMany({
      email: email.toLowerCase(),
    });

    console.log(`Deleted ${result.deletedCount} user(s) with email: ${email}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log("Usage: node delete-user.js <email>");
  process.exit(1);
}

deleteUser(email);
