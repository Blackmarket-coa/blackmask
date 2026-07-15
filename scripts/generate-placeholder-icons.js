// Regenerates the placeholder Black Mask extension/store icons as PNGs.
// Dependency-free (only node's built-in zlib): run `node scripts/generate-placeholder-icons.js`.
// Design: dark rounded square with a white domino-mask glyph; gray variants for the
// disabled toolbar state, amber padlock overlay for the locked state.
// See docs/black-mask/branding.md for the full branding picture.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---------- PNG encoding ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- scene ----------
const CHARCOAL = [23, 23, 27];
const GRAY = [142, 142, 147];
const WHITE = [255, 255, 255];
const AMBER = [255, 176, 32];

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function inEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

// Returns [r,g,b,a] for a point in unit space.
function shade(x, y, { gray, locked }) {
  const bg = gray ? GRAY : CHARCOAL;
  if (!inRoundedRect(x, y, 0.03, 0.03, 0.97, 0.97, 0.21)) return [0, 0, 0, 0];
  let col = bg;
  if (
    inEllipse(x, y, 0.5, 0.46, 0.335, 0.185) &&
    !inEllipse(x, y, 0.36, 0.44, 0.105, 0.08) &&
    !inEllipse(x, y, 0.64, 0.44, 0.105, 0.08)
  ) {
    col = WHITE;
  }
  if (locked) {
    const inBody = inRoundedRect(x, y, 0.56, 0.62, 0.94, 0.94, 0.05);
    const d = Math.hypot(x - 0.75, y - 0.62);
    const inShackle = y < 0.62 && d <= 0.13 && d >= 0.07;
    if (inBody || inShackle) col = AMBER;
  }
  return [col[0], col[1], col[2], 255];
}

function render(size, opts) {
  const SS = 4; // supersample factor
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const [cr, cg, cb, ca] = shade(x, y, opts);
          r += cr * ca;
          g += cg * ca;
          b += cb * ca;
          a += ca;
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      rgba[i] = a ? Math.round(r / a) : 0;
      rgba[i + 1] = a ? Math.round(g / a) : 0;
      rgba[i + 2] = a ? Math.round(b / a) : 0;
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, rgba);
}

const repo = path.join(__dirname, "..");
const img = (f) => path.join(repo, "apps/browser/src/images", f);
const store = (f) => path.join(repo, "apps/browser/store/icons", f);

const jobs = [
  ...[16, 19, 32, 38, 48, 96, 128].flatMap((s) => [
    [img(`icon${s}.png`), s, {}],
    [img(`icon${s}_gray.png`), s, { gray: true }],
  ]),
  [img("icon19_locked.png"), 19, { locked: true }],
  [img("icon38_locked.png"), 38, { locked: true }],
  [img("icon18_safari.png"), 18, {}],
  [img("icon18_safari@2x.png"), 36, {}],
  [img("icon18_safari_locked.png"), 18, { locked: true }],
  [img("icon18_safari_locked@2x.png"), 36, { locked: true }],
  [store("icon64.png"), 64, {}],
  [store("chrome-icon128.png"), 128, {}],
  [store("windows-icon300.png"), 300, {}],
];
for (const [file, size, opts] of jobs) {
  fs.writeFileSync(file, render(size, opts));
  console.log(path.relative(repo, file), size + "x" + size);
}
