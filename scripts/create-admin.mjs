// Run once to create your admin account:
//   node scripts/create-admin.mjs
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
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

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  console.log('\n── Create Admin Account ─────────────────────');
  const name = await ask('Name:     ');
  const email = await ask('Email:    ');
  const password = await ask('Password: ');
  rl.close();

  if (!name || !email || !password) {
    console.error('All fields are required.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`\n⚠  A user with that email already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.create({ name, email, password: hashed, role: 'admin' });

  console.log(`\n✓ Admin account created for ${email}`);
  console.log('  Log in at http://localhost:3000/login\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
