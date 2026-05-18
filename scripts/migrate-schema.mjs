/**
 * Schema migration script: applies additive changes to existing MongoDB documents.
 * Run: node scripts/migrate-schema.mjs
 *
 * Changes applied:
 *  - links:       add icon_url (null) if missing
 *  - posts:       add translated_from (null), translated_at (null),
 *                 manually_edited (false) if missing; create indexes
 *  - subscribers: add unsubscribed (false), unsubscribedAt (undefined) if missing
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

async function run() {
  console.log('Connected to:', uri.replace(/:.*@/, ':****@'));
  console.log('');

  // ── Links: icon_url ──────────────────────────────────────────────────────
  const links = db.collection('links');
  const linksResult = await links.updateMany(
    { icon_url: { $exists: false } },
    { $set: { icon_url: null } }
  );
  console.log(`links       — matched: ${linksResult.matchedCount}, modified: ${linksResult.modifiedCount} (icon_url)`);

  // ── Posts: translation + manually_edited fields ──────────────────────────
  const posts = db.collection('posts');
  const postsResult = await posts.updateMany(
    {
      $or: [
        { translated_from: { $exists: false } },
        { translated_at: { $exists: false } },
        { manually_edited: { $exists: false } },
      ],
    },
    {
      $set: {
        translated_from: null,
        translated_at: null,
        manually_edited: false,
      },
    }
  );
  console.log(`posts       — matched: ${postsResult.matchedCount}, modified: ${postsResult.modifiedCount} (translation fields)`);

  // ── Posts: create compound indexes ───────────────────────────────────────
  // These are idempotent — MongoDB skips existing indexes automatically,
  // but we await them anyway so the script finishes cleanly.
  await posts.createIndex({ language: 1, status: 1, createdAt: -1 });
  await posts.createIndex({ tags: 1 });
  await posts.createIndex({ category: 1, language: 1 });
  await posts.createIndex({ translated_from: 1 });
  console.log('posts       — ensured 4 compound indexes');

  // ── Subscribers: unsubscribed flags ──────────────────────────────────────
  const subscribers = db.collection('subscribers');
  const subsResult = await subscribers.updateMany(
    {
      $or: [
        { unsubscribed: { $exists: false } },
        { unsubscribedAt: { $exists: false } },
      ],
    },
    {
      $set: {
        unsubscribed: false,
      },
      // $unset is not allowed alongside $set on the same field path,
      // but unsubscribedAt should simply remain absent if it never existed.
      // If it exists with a value, leave it alone.
    }
  );
  console.log(`subscribers — matched: ${subsResult.matchedCount}, modified: ${subsResult.modifiedCount} (unsubscribed flags)`);

  console.log('');
  console.log('✓ Migration complete');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
