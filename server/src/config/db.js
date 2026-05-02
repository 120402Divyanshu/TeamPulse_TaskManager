import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }
  // mongodb+srv uses DNS SRV lookups; some Windows networks return ECONNREFUSED for SRV.
  // Set DNS_SERVERS=8.8.8.8,1.1.1.1 in .env or use a non-SRV connection string from Atlas.
  const custom = process.env.DNS_SERVERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (custom?.length) {
    dns.setServers(custom);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
