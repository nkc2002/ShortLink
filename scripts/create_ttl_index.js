import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
const TTL_DAYS = parseInt(process.env.CLICKLOG_TTL_DAYS, 10) || 90;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

async function createTTLIndex() {
  if (!MONGO_URI) {
    console.error("MONGO_URI environment variable is required");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("clicklogs");

    // Drop existing TTL index if exists (to update TTL value)
    const indexes = await collection.indexes();
    const existingTTLIndex = indexes.find(
      (idx) =>
        idx.key && idx.key.at === 1 && idx.expireAfterSeconds !== undefined
    );

    if (existingTTLIndex) {
      console.log(`Dropping existing TTL index: ${existingTTLIndex.name}`);
      await collection.dropIndex(existingTTLIndex.name);
    }

    // Create new TTL index
    console.log(
      `Creating TTL index with expireAfterSeconds: ${TTL_SECONDS} (${TTL_DAYS} days)`
    );
    await collection.createIndex(
      { at: 1 },
      { expireAfterSeconds: TTL_SECONDS, name: "at_ttl_index" }
    );

    console.log("TTL index created successfully");

    // Also ensure compound index for queries
    console.log("Creating compound index on shortId + at...");
    await collection.createIndex(
      { shortId: 1, at: -1 },
      { name: "shortId_at_compound" }
    );

    console.log("Compound index created successfully");

    // List all indexes
    const allIndexes = await collection.indexes();
    console.log("\nCurrent indexes on clicklogs:");
    allIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
  } catch (error) {
    console.error("Error creating indexes:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

createTTLIndex();
