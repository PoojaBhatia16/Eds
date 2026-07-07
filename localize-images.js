/*
 * localize-images.js — one-time script to localise product images.
 *
 * WHAT IT DOES
 *  1. Backs up data/products.json -> data/products.backup.json (once).
 *  2. Downloads every image URL in products.json.
 *  3. Resizes to max 800px wide and converts to WebP (quality 78).
 *  4. Saves them into images/products/ in the repo (same-origin on EDS).
 *  5. Rewrites products.json so images point to /images/products/<file>.webp
 *  6. If any single download/convert fails, that image KEEPS its original URL
 *     and the script continues — nothing breaks.
 *
 * RUN
 *   npm install sharp
 *   node localize-images.js
 *
 * REVERT (if needed)
 *   copy data\products.backup.json data\products.json   (Windows)
 *   cp   data/products.backup.json data/products.json   (mac/Linux)
 *   then delete the images/products/ folder.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let sharp;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  sharp = require('sharp');
} catch (e) {
  console.error('\n✗ "sharp" is not installed. Run:  npm install sharp\n');
  process.exit(1);
}

const ROOT = __dirname;
const PRODUCTS_JSON = path.join(ROOT, 'data', 'products.json');
const BACKUP_JSON = path.join(ROOT, 'data', 'products.backup.json');
const OUT_DIR = path.join(ROOT, 'images', 'products');
const PUBLIC_PREFIX = '/images/products';

const MAX_WIDTH = 600;
const WEBP_QUALITY = 78;

/* Download a URL to a Buffer, following redirects, with a browser UA. */
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'));
    const lib = url.startsWith('http:') ? http : https;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        },
        timeout: 20000,
      },
      (res) => {
        // follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, url).href;
          return resolve(download(next, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        return undefined;
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

/* Build a stable, safe filename for a product image. */
function fileNameFor(productId, index, url) {
  // try to keep something human-readable from the original name
  let base = '';
  try {
    base = path.basename(new URL(url).pathname).replace(/\.[a-z0-9]+$/i, '');
  } catch {
    base = '';
  }
  base = base.replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  return `${productId}_${index}${base ? `_${base}` : ''}.webp`;
}

async function run() {
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  const products = Array.isArray(raw) ? raw : raw.data || Object.values(raw)[0];

  // one-time backup
  if (!fs.existsSync(BACKUP_JSON)) {
    fs.copyFileSync(PRODUCTS_JSON, BACKUP_JSON);
    console.log(`✓ Backup written: ${path.relative(ROOT, BACKUP_JSON)}`);
  } else {
    console.log('• Backup already exists, leaving it as-is.');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const product of products) {
    if (!Array.isArray(product.images)) continue;
    for (let i = 0; i < product.images.length; i += 1) {
      const url = product.images[i];
      if (!url || typeof url !== 'string') continue;

      // already local? skip
      if (url.startsWith('/') || url.startsWith(PUBLIC_PREFIX)) {
        skipped += 1;
        continue;
      }
      if (url.startsWith('data:')) { skipped += 1; continue; }

      const outName = fileNameFor(product.id, i, url);
      const outPath = path.join(OUT_DIR, outName);

      try {
        // eslint-disable-next-line no-await-in-loop
        const buf = await download(url);
        // eslint-disable-next-line no-await-in-loop
        await sharp(buf)
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outPath);

        product.images[i] = `${PUBLIC_PREFIX}/${outName}`;
        ok += 1;
        process.stdout.write(`✓ ${product.id} [${i}] -> ${outName}\n`);
      } catch (err) {
        // keep the original URL on failure — nothing breaks
        failed += 1;
        process.stdout.write(`✗ ${product.id} [${i}] kept original (${err.message})\n`);
      }
    }
  }

  fs.writeFileSync(PRODUCTS_JSON, `${JSON.stringify(products, null, 2)}\n`);

  console.log('\n──────── SUMMARY ────────');
  console.log(`converted : ${ok}`);
  console.log(`failed    : ${failed} (kept original URL)`);
  console.log(`skipped   : ${skipped} (already local / data URI)`);
  console.log(`output    : ${path.relative(ROOT, OUT_DIR)}/`);
  console.log(`json      : ${path.relative(ROOT, PRODUCTS_JSON)} (rewritten)`);
  console.log('backup    : data/products.backup.json');
  if (failed) {
    console.log(
      '\nNote: some images failed to download (likely CDN blocking). '
      + 'Those still work from their original URLs. Re-run to retry just those.',
    );
  }
  console.log('\nNext:  git checkout -b localize-images && git add images/products data/products.json && git commit -m "localize product images as webp" && git push -u origin localize-images');
}

run().catch((e) => {
  console.error('\n✗ Script failed:', e.message);
  console.error('Your products.json was NOT rewritten if this happened before the write step. '
    + 'Restore from data/products.backup.json if needed.');
  process.exit(1);
});