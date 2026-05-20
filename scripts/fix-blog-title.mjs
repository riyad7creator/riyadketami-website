/**
 * One-shot script: fixes the "Ai era for founders and creators" title casing in MongoDB.
 * Run once: node scripts/fix-blog-title.mjs
 */
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually (no dotenv dependency needed)
const envPath = join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

await mongoose.connect(uri);

const db = mongoose.connection.db;
const posts = db.collection('posts');

const result = await posts.updateMany(
  {
    title: {
      $regex: /^ai era for founders and creators$/i,
    },
  },
  {
    $set: { title: 'AI Era for Founders and Creators' },
  }
);

console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

await mongoose.disconnect();
