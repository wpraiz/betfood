// Gera os ícones do app (roleta BetFood) em PNG puro, sem dependências.
// Uso: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../public/icons/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const RED = [234, 29, 44];
const RED_DARK = [176, 18, 30];
const AMBER = [245, 166, 35];
const PINK = [251, 214, 216];
const WHITE = [255, 255, 255];

/** Cor de um pixel do ícone, em coordenadas normalizadas (-1..1). */
function pixel(x, y, maskable) {
  const r = Math.hypot(x, y);
  // margem extra quando maskable (iOS/Android cortam as bordas)
  const scale = maskable ? 0.78 : 1;
  const rr = r / scale;
  const ang = (Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2); // 0 = topo, horário

  if (rr > 0.98) return RED; // fundo vermelho (sangra até a borda)
  if (rr > 0.86) return RED_DARK; // aro externo
  if (rr < 0.3) return RED; // miolo
  if (rr < 0.34) return WHITE; // anel do miolo

  const slice = Math.floor(ang / (Math.PI / 4)); // 8 fatias
  return slice % 4 === 0 ? AMBER : slice % 2 === 0 ? PINK : WHITE;
}

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, maskable) {
  // linhas RGB com filtro 0, com 3x3 supersampling pra suavizar bordas
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let py = 0; py < size; py++) {
    raw[p++] = 0;
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const x = ((px + (sx + 0.5) / 3) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / 3) / size) * 2 - 1;
          const c = pixel(x, y, maskable);
          acc[0] += c[0];
          acc[1] += c[1];
          acc[2] += c[2];
        }
      }
      raw[p++] = Math.round(acc[0] / 9);
      raw[p++] = Math.round(acc[1] / 9);
      raw[p++] = Math.round(acc[2] / 9);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  ["icon-180.png", 180, false], // apple-touch-icon (iPhone)
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
];

for (const [name, size, maskable] of targets) {
  writeFileSync(new URL(name, OUT), png(size, maskable));
  console.log("ok:", name, size + "px");
}
