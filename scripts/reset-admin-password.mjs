// Reset the password of an existing admin account.
//
//   node scripts/reset-admin-password.mjs --list   # show admin accounts
//   node scripts/reset-admin-password.mjs          # reset one interactively
//
// The password is typed directly into this script and is never echoed, never
// logged, and never leaves your machine — only its bcrypt hash is written to
// the database.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (same approach as create-admin.mjs)
const envPath = resolve(__dirname, '../.env.local');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch {
  console.error('Could not read .env.local — make sure MONGODB_URI is set');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

const MIN_LENGTH = 8;
const BCRYPT_COST = 12;

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a.trim()); }));
}

/** Prompt without echoing what is typed. */
function askSecret(question) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (chunk) => {
      if (!muted) rl.output.write(chunk);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      res(answer);
    });
    muted = true;
  });
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const users = mongoose.connection.db.collection('users');

  const admins = await users
    .find({ role: 'admin' }, { projection: { email: 1, name: 1, isActive: 1, lastLoginAt: 1 } })
    .toArray();

  if (admins.length === 0) {
    console.error('No admin accounts found. Use scripts/create-admin.mjs instead.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\n── Admin accounts ───────────────────────────');
  for (const a of admins) {
    const last = a.lastLoginAt ? new Date(a.lastLoginAt).toISOString().slice(0, 10) : 'never';
    console.log(`  ${a.email}  (${a.name ?? 'no name'}, active: ${a.isActive !== false}, last login: ${last})`);
  }
  console.log('');

  if (process.argv.includes('--list')) {
    await mongoose.disconnect();
    return;
  }

  const email = (await ask('Email to reset: ')).toLowerCase();
  const target = admins.find((a) => a.email?.toLowerCase() === email);
  if (!target) {
    console.error('No admin account with that email.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const password = await askSecret('New password (min 8, not shown): ');
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const confirm = await askSecret('Confirm password:              ');
  if (password !== confirm) {
    console.error('Passwords did not match. Nothing was changed.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, BCRYPT_COST);

  // Also clear the lockout counters so a forgotten-password lockout is lifted.
  await users.updateOne(
    { _id: target._id },
    { $set: { password: hashed, loginAttempts: 0, updatedAt: new Date() }, $unset: { lockUntil: '' } }
  );

  console.log(`\n✓ Password updated for ${target.email}`);
  console.log('  Sign in at http://localhost:3000/login\n');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Failed:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
