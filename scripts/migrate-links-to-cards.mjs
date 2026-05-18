/**
 * Migration: convert old Link documents into LinkCard section='resource'.
 * Run: node scripts/migrate-links-to-cards.mjs
 *
 * Idempotent — skips cards that already exist with the same title + href
 * in the resource section.
 */
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
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

  const links = db.collection('links');
  const linkcards = db.collection('linkcards');

  const oldLinks = await links.find({}).toArray();
  console.log(`Found ${oldLinks.length} old Link document(s)`);

  let created = 0;
  let skipped = 0;

  for (const link of oldLinks) {
    const title = link.title;
    const href = link.url;

    // Idempotency check
    const exists = await linkcards.findOne({ section: 'resource', title, href });
    if (exists) {
      console.log(`  SKIP  "${title}" — already exists as LinkCard`);
      skipped++;
      continue;
    }

    const doc = {
      section: 'resource',
      title,
      href,
      description: link.description || undefined,
      icon: link.icon || undefined,
      order: typeof link.order === 'number' ? link.order : 0,
      active: link.isVisible !== false,
      createdAt: link.createdAt || new Date(),
      updatedAt: link.updatedAt || new Date(),
    };

    await linkcards.insertOne(doc);
    console.log(`  CREATE  "${title}" → resource card`);
    created++;
  }

  console.log('');
  console.log(`Done. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
