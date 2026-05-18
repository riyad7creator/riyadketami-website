/**
 * Higgsfield image generation script for Riyad Ketami brand assets.
 * Run: npm run generate:images
 *
 * Generates:
 *   - WHO_SECTION_BG: atmospheric grayscale portrait background
 *   - HERO_PORTRAIT: hero portrait with Matrix atmosphere
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const SUBJECT_REF = process.argv.includes('--subject')
  ? process.argv[process.argv.indexOf('--subject') + 1]
  : null;

const MODEL = process.env.HIGGSFIELD_MODEL || 'soul_cinematic';

const images = [
  {
    name: 'WHO_SECTION_BG',
    prompt:
      'Riyad Ketami, Algerian digital entrepreneur, looking forward, cinematic dark studio lighting, Matrix green atmosphere, neon green particles in background, minimal, professional, dark background, 8K, sharp',
    output: './public/images/riyad-who-bg.jpg',
  },
  {
    name: 'HERO_PORTRAIT',
    prompt:
      'Riyad Ketami, confident entrepreneur, dark background, neon green Matrix glyph atmosphere, professional studio lighting, sharp, minimal',
    output: './public/images/riyad-hero.jpg',
  },
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(dest);
    client
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', reject);
  });
}

async function run() {
  console.log('[HIGGSFIELD] Starting image generation\n');

  for (const img of images) {
    console.log(`[HIGGSFIELD] Generating: ${img.name}`);
    ensureDir(img.output);

    const subjectFlag = SUBJECT_REF ? `--image "${SUBJECT_REF}"` : '';
    const cmd = `higgsfield generate create ${MODEL} \
      --prompt "${img.prompt}" \
      --wait \
      --json \
      ${subjectFlag}`;

    let result;
    try {
      const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 300_000 });
      result = JSON.parse(stdout);
    } catch (err) {
      console.error(`[HIGGSFIELD] ✗ Failed: ${img.name}`, err.message);
      continue;
    }

    const url = result?.output?.image_url ?? result?.image_url ?? result?.url;
    if (!url) {
      console.error(`[HIGGSFIELD] ✗ No image URL in response for: ${img.name}`);
      console.error(JSON.stringify(result, null, 2));
      continue;
    }

    try {
      await downloadImage(url, img.output);
      console.log(`[HIGGSFIELD] ✓ Saved: ${img.output}`);
    } catch (err) {
      console.error(`[HIGGSFIELD] ✗ Download failed: ${img.name}`, err.message);
    }
  }

  console.log('\n[HIGGSFIELD] Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
