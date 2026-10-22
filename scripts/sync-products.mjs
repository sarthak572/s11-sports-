// Pulls the product list from the shop's Google Sheet and rewrites data/products.json.
// Runs in the GitHub Action before `next build`. When PRODUCTS_SHEET_URL is not set it
// does nothing, so local development keeps using the committed products.json.
//
// Product photos linked in the sheet (Google Drive, Cloudinary, any public URL) are
// downloaded, resized and converted to WebP, then served from the site itself.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHEET_URL = process.env.PRODUCTS_SHEET_URL?.trim();
const BASE_PATH = process.env.BASE_PATH ?? '/s11-sports-';

const PRODUCTS_FILE = path.join(ROOT, 'data/products.json');
const SITE_FILE = path.join(ROOT, 'data/site.json');
const IMAGE_DIR = path.join(ROOT, 'public/images/products/sheet');
const IMAGE_URL_PREFIX = `${BASE_PATH}/images/products/sheet`;
const NO_IMAGE = `${BASE_PATH}/images/products/no-image.svg`;
const IMAGE_MAX_WIDTH = 1200;

// Sheet header -> product field. Headers are matched case-insensitively.
const COLUMN_ALIASES = {
  show: ['show', 'visible', 'in_stock', 'available'],
  id: ['id'],
  slug: ['slug'],
  name: ['name', 'product', 'product_name'],
  brand: ['brand'],
  category: ['category'],
  subcategory: ['subcategory', 'sub_category'],
  price: ['price', 'price_inr'],
  priceCad: ['price_cad'],
  compareAtPrice: ['compare_price', 'compare_at_price', 'mrp'],
  description: ['description'],
  variants: ['sizes', 'variants'],
  specs: ['specs', 'specifications'],
  images: ['images', 'image_urls', 'image_url', 'image'],
  tags: ['tags'],
};

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  // GitHub shows ::warning:: lines on the workflow run summary page.
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `WARNING: ${msg}`);
};

function toCsvUrl(url) {
  // Accept a normal sheet link and turn it into its CSV export.
  const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m && m[1] !== 'e') {
    const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? '0';
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
  }
  return url;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const splitList = (s) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

function parsePrice(s) {
  const cleaned = s.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function parseSpecs(s) {
  return s.split(/[;\n]/).map((part) => {
    const i = part.indexOf(':');
    if (i === -1) return null;
    const name = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    return name && value ? { name, value } : null;
  }).filter(Boolean);
}

// Google Drive "share" links point to a viewer page; rewrite them to the raw file.
function directImageUrl(url) {
  const driveId = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([a-zA-Z0-9_-]+)/)?.[1];
  if (driveId) return `https://drive.google.com/uc?export=download&id=${driveId}`;
  const dropbox = url.match(/^(https:\/\/(?:www\.)?dropbox\.com\/.*?)([?&])dl=0/);
  if (dropbox) return url.replace('dl=0', 'dl=1');
  return url;
}

let sharp;
async function loadSharp() {
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('sharp is not available; images will be saved without resizing.');
  }
}

async function downloadImage(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const existing = (await fs.readdir(IMAGE_DIR)).find((f) => f.startsWith(hash + '.'));
  if (existing) return existing;

  const res = await fetch(directImageUrl(url), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) {
    throw new Error(`link did not return an image (got "${type}"). For Google Drive, set sharing to "Anyone with the link"`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  let fileName;
  if (sharp) {
    fileName = `${hash}.webp`;
    await sharp(buf).rotate().resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 })
      .toFile(path.join(IMAGE_DIR, fileName));
  } else {
    const ext = type.split('/')[1].split(/[;+]/)[0].replace('jpeg', 'jpg');
    fileName = `${hash}.${ext}`;
    await fs.writeFile(path.join(IMAGE_DIR, fileName), buf);
  }
  return fileName;
}

async function resolveImages(cell, label, usedFiles) {
  const paths = [];
  for (const ref of cell.split(/[\s,]+/).filter(Boolean)) {
    if (!/^https?:\/\//i.test(ref)) {
      // A path to an image already in public/, e.g. /images/products/placeholder-1.webp
      paths.push(`${BASE_PATH}/${ref.replace(/^\/+/, '')}`);
      continue;
    }
    try {
      const file = await downloadImage(ref);
      usedFiles.add(file);
      paths.push(`${IMAGE_URL_PREFIX}/${file}`);
    } catch (err) {
      warn(`${label}: could not load image ${ref} (${err.message})`);
    }
  }
  return paths.length ? paths : [NO_IMAGE];
}

async function main() {
  if (!SHEET_URL) {
    console.log('PRODUCTS_SHEET_URL is not set; keeping the existing data/products.json.');
    return;
  }

  const site = JSON.parse(await fs.readFile(SITE_FILE, 'utf8'));
  const categoryBySlug = new Map();
  for (const c of site.categories) {
    categoryBySlug.set(c.slug, c);
    categoryBySlug.set(slugify(c.name), c);
  }

  console.log('Fetching product sheet...');
  const res = await fetch(toCsvUrl(SHEET_URL), { redirect: 'follow' });
  if (!res.ok) throw new Error(`Could not download the sheet (HTTP ${res.status}). Is it shared as "Anyone with the link can view"?`);
  const csv = await res.text();
  if (/^\s*<(!doctype|html)/i.test(csv)) {
    throw new Error('The sheet link returned a web page instead of CSV. Share the sheet as "Anyone with the link can view".');
  }

  const [header, ...rows] = parseCsv(csv);
  const normalized = header.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  const col = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx !== -1) col[field] = idx;
  }
  for (const required of ['name', 'category', 'price']) {
    if (col[required] === undefined) throw new Error(`The sheet is missing the "${required}" column.`);
  }

  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await loadSharp();

  const products = [];
  const usedSlugs = new Set();
  const usedFiles = new Set();

  for (const [i, row] of rows.entries()) {
    const get = (field) => (col[field] === undefined ? '' : (row[col[field]] ?? '').trim());
    const label = `Sheet row ${i + 2}`;
    const name = get('name');
    if (!name) continue; // blank row

    if (/^(no|n|false|hide|hidden|0)$/i.test(get('show'))) continue;

    const category = categoryBySlug.get(slugify(get('category')));
    if (!category) {
      warn(`${label} "${name}": unknown category "${get('category')}", skipped. Use one of: ${site.categories.map((c) => c.name).join(', ')}`);
      continue;
    }

    const price = parsePrice(get('price'));
    if (price === null || Number.isNaN(price)) {
      warn(`${label} "${name}": price "${get('price')}" is not a number, skipped.`);
      continue;
    }
    const compareAtPrice = parsePrice(get('compareAtPrice'));
    const priceCad = parsePrice(get('priceCad'));

    let slug = slugify(get('slug') || name) || `product-${i + 2}`;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(get('slug') || name)}-${n}`;
    usedSlugs.add(slug);

    const subcategory = get('subcategory');
    if (subcategory && !category.subcategories.includes(subcategory)) {
      warn(`${label} "${name}": subcategory "${subcategory}" is not listed under ${category.name} in site.json.`);
    }

    const variants = splitList(get('variants'));
    products.push({
      id: get('id') || slug,
      slug,
      name,
      brand: get('brand'),
      category: category.slug,
      subcategory,
      price,
      priceCad: Number.isNaN(priceCad) ? null : priceCad,
      compareAtPrice: Number.isNaN(compareAtPrice) || !compareAtPrice ? null : compareAtPrice,
      description: get('description'),
      specs: parseSpecs(get('specs')),
      variants: variants.length ? variants : null,
      imagePaths: await resolveImages(get('images'), `${label} "${name}"`, usedFiles),
      tags: splitList(get('tags')).map((t) => t.toLowerCase()),
    });
  }

  if (products.length === 0) {
    throw new Error('No valid products found in the sheet; not replacing the product list.');
  }

  // Remove downloaded photos that are no longer used by any product.
  for (const f of await fs.readdir(IMAGE_DIR)) {
    if (!usedFiles.has(f)) await fs.rm(path.join(IMAGE_DIR, f));
  }

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2) + '\n');
  console.log(`Wrote ${products.length} products to data/products.json (${warnings.length} warnings).`);
}

main().catch((err) => {
  console.error(process.env.GITHUB_ACTIONS ? `::error::${err.message}` : `ERROR: ${err.message}`);
  process.exit(1);
});
