/**
 * Generate simple CWS screenshots + promo tiles (placeholder visuals for listing).
 * Output: store-assets/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'store-assets');
fs.mkdirSync(outDir, { recursive: true });

const TEAL = { r: 15, g: 118, b: 110 };
const BG = { r: 240, g: 253, b: 250 };
const INK = { r: 19, g: 78, b: 74 };
const WHITE = { r: 255, g: 255, b: 255 };

function fill(png, c) {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = c.r;
    png.data[i + 1] = c.g;
    png.data[i + 2] = c.b;
    png.data[i + 3] = 255;
  }
}

function rect(png, x0, y0, x1, y1, c) {
  const w = png.width;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= png.height) continue;
      const i = (w * y + x) << 2;
      png.data[i] = c.r;
      png.data[i + 1] = c.g;
      png.data[i + 2] = c.b;
      png.data[i + 3] = 255;
    }
  }
}

/** Tiny 5x7 bitmap font for labels (uppercase/digits/space/-) */
const GLYPHS = {
  ' ': [],
  '-': [[1, 3], [2, 3], [3, 3]],
  A: [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [3, 3], [0, 4], [3, 4], [0, 5], [3, 5], [0, 6], [3, 6]],
  C: [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 6], [3, 5]],
  E: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [0, 4], [0, 5], [0, 6], [1, 6], [2, 6], [3, 6]],
  F: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [0, 4], [0, 5], [0, 6]],
  I: [[1, 0], [2, 0], [1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [1, 5], [2, 5], [1, 6], [2, 6]],
  M: [[0, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [3, 2], [0, 3], [3, 3], [0, 4], [3, 4], [0, 5], [3, 5], [0, 6], [3, 6]],
  N: [[0, 0], [3, 0], [0, 1], [1, 1], [3, 1], [0, 2], [2, 2], [3, 2], [0, 3], [3, 3], [0, 4], [3, 4], [0, 5], [3, 5], [0, 6], [3, 6]],
  O: [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [3, 3], [0, 4], [3, 4], [0, 5], [3, 5], [1, 6], [2, 6]],
  P: [[0, 0], [1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [1, 3], [2, 3], [0, 4], [0, 5], [0, 6]],
  R: [[0, 0], [1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [1, 3], [2, 3], [0, 4], [2, 4], [0, 5], [3, 5], [0, 6], [3, 6]],
  T: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [1, 5], [2, 5], [1, 6], [2, 6]],
  X: [[0, 0], [3, 0], [0, 1], [3, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [0, 5], [3, 5], [0, 6], [3, 6]],
  Y: [[0, 0], [3, 0], [0, 1], [3, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [1, 5], [2, 5], [1, 6], [2, 6]],
};

function drawText(png, text, x, y, scale, color) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS['-'];
    for (const [gx, gy] of g) {
      rect(png, cx + gx * scale, y + gy * scale, cx + (gx + 1) * scale, y + (gy + 1) * scale, color);
    }
    cx += 5 * scale + scale;
  }
}

function writeShot(name, w, h, title, subtitle) {
  const png = new PNG({ width: w, height: h, colorType: 6 });
  fill(png, BG);
  rect(png, 0, 0, w, Math.round(h * 0.12), TEAL);
  rect(png, Math.round(w * 0.08), Math.round(h * 0.22), Math.round(w * 0.92), Math.round(h * 0.88), WHITE);
  drawText(png, title, Math.round(w * 0.1), Math.round(h * 0.04), Math.max(2, Math.round(w / 320)), WHITE);
  drawText(png, subtitle, Math.round(w * 0.12), Math.round(h * 0.35), Math.max(3, Math.round(w / 220)), INK);
  const file = path.join(outDir, name);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log('[store-assets]', name);
}

writeShot('screenshot-1-from-text-1280x800.png', 1280, 800, 'CREATE MY AI CONTEXT', 'FROM TEXT');
writeShot('screenshot-2-from-file-1280x800.png', 1280, 800, 'CREATE MY AI CONTEXT', 'FROM FILE');
writeShot('screenshot-3-merge-1280x800.png', 1280, 800, 'CREATE MY AI CONTEXT', 'MERGE PACKS');
writeShot('screenshot-4-interpret-1280x800.png', 1280, 800, 'CREATE MY AI CONTEXT', 'INTERPRET');
writeShot('promo-small-440x280.png', 440, 280, 'AI CONTEXT', 'ON DEVICE');
writeShot('promo-large-1400x560.png', 1400, 560, 'CREATE MY AI CONTEXT', 'COMPACT ENGLISH PACKS');

console.log('[store-assets] done →', outDir);
