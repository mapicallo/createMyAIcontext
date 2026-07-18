import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

/** Teal document + spark — distinct from LocalChat purple */
const TEAL_A = { r: 15, g: 118, b: 110 };
const TEAL_B = { r: 13, g: 148, b: 136 };
const PAPER = { r: 240, g: 253, b: 250, a: 255 };
const INK = { r: 19, g: 78, b: 74, a: 255 };
const SPARK = { r: 253, g: 224, b: 71, a: 255 };

function setRgba(data, w, x, y, c) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (w * y + x) << 2;
  data[i] = c.r;
  data[i + 1] = c.g;
  data[i + 2] = c.b;
  data[i + 3] = c.a ?? 255;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rl = x0 + r;
  const rr = x1 - r;
  const rt = y0 + r;
  const rb = y1 - r;
  if (x >= rl && x <= rr) return true;
  if (y >= rt && y <= rb) return true;
  const cx = x < rl ? rl : rr;
  const cy = y < rt ? rt : rb;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inCircle(x, y, cx, cy, rad) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= rad * rad;
}

function renderIcon(W) {
  const png = new PNG({ width: W, height: W, colorType: 6, inputColorType: 6, bitDepth: 8 });
  const bgR = Math.max(2, Math.round(W * 0.16));
  const bgPad = Math.max(0, Math.round(W * 0.04));

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (!inRoundedRect(x, y, bgPad, bgPad, W - bgPad - 1, W - bgPad - 1, bgR)) continue;
      const t = (x + y) / (2 * (W - 1));
      setRgba(png.data, W, x, y, {
        r: lerp(TEAL_A.r, TEAL_B.r, t),
        g: lerp(TEAL_A.g, TEAL_B.g, t),
        b: lerp(TEAL_A.b, TEAL_B.b, t),
        a: 255,
      });
    }
  }

  const docPad = Math.round(W * 0.22);
  const docX0 = docPad;
  const docY0 = Math.round(W * 0.2);
  const docX1 = W - docPad - Math.round(W * 0.08);
  const docY1 = W - Math.round(W * 0.22);
  const docR = Math.max(2, Math.round(W * 0.06));

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (inRoundedRect(x, y, docX0, docY0, docX1, docY1, docR)) {
        setRgba(png.data, W, x, y, PAPER);
      }
    }
  }

  if (W >= 24) {
    const lineH = Math.max(1, Math.round(W * 0.04));
    const lx0 = docX0 + Math.round(W * 0.08);
    const lx1 = docX1 - Math.round(W * 0.1);
    for (const frac of [0.38, 0.5, 0.62]) {
      const ly = Math.round(W * frac);
      for (let y = ly; y < ly + lineH; y++) {
        for (let x = lx0; x <= lx1; x++) {
          setRgba(png.data, W, x, y, INK);
        }
      }
    }
    const sx = Math.round(W * 0.72);
    const sy = Math.round(W * 0.28);
    const sr = Math.max(2, Math.round(W * 0.09));
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        if (inCircle(x, y, sx, sy, sr)) setRgba(png.data, W, x, y, SPARK);
      }
    }
  }

  return PNG.sync.write(png);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), renderIcon(size));
}

console.log('[icons] Create my AI Context PNGs → public/icons');
