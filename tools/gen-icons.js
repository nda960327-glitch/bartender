// 바텐톡 앱 아이콘 PNG 생성기 (외부 의존성 없음)
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2];

/* ---------- PNG 인코딩 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- 도형 헬퍼 (좌표계는 512 기준) ---------- */
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};
const roundRectInside = (x, y, w, h, r) => {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  return Math.hypot(x - cx, y - cy) <= r;
};

// 마티니 글라스 (viewBox 0 0 512 512, stroke-width 26)
const GLASS = [
  [150, 150, 362, 150],
  [362, 150, 256, 280],
  [256, 280, 150, 150],
  [256, 280, 256, 390],
  [196, 390, 316, 390],
];
const OLIVE = { x: 312, y: 176, r: 16 };
const STROKE = 13; // 26 / 2

/**
 * @param {number} size  출력 픽셀 크기
 * @param {boolean} maskable  true면 전체 블리드 + 콘텐츠를 안전영역(60%)으로 축소
 */
function draw(size, maskable) {
  const SS = 4; // 슈퍼샘플링
  const rgba = Buffer.alloc(size * size * 4);
  const scale = 512 / size;
  // maskable: 콘텐츠를 0.62배로 축소해 중앙 80% 원 안에 들어오게 함
  const k = maskable ? 0.62 : 1;
  const tx = (x) => (x - 256) / k + 256;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) * scale;
          const uy = (py + (sy + 0.5) / SS) * scale;

          // 배경 (라운드 사각형 + 대각선 그라디언트)
          const inBg = maskable ? true : roundRectInside(ux, uy, 512, 512, 120);
          if (!inBg) continue;
          const t = Math.max(0, Math.min(1, (ux + uy) / 1024));
          let cr = Math.round(0xff + (0xff - 0xff) * t);
          let cg = Math.round(0x5c + (0x8a - 0x5c) * t);
          let cb = Math.round(0x35 + (0xd4 - 0x35) * t);

          // 글라스 (흰색 스트로크)
          const gx = tx(ux), gy = tx(uy);
          let white = OLIVE.r >= Math.hypot(gx - OLIVE.x, gy - OLIVE.y);
          if (!white) {
            for (const [ax, ay, bx, by] of GLASS) {
              if (segDist(gx, gy, ax, ay, bx, by) <= STROKE) { white = true; break; }
            }
          }
          if (white) { cr = 255; cg = 255; cb = 255; }

          r += cr; g += cg; b += cb; a += 255;
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const alpha = a / n;
      if (alpha > 0) {
        // 커버된 서브샘플 기준으로 색 평균 (프리멀티플라이 방지)
        const cov = a / 255;
        rgba[i] = Math.round(r / cov);
        rgba[i + 1] = Math.round(g / cov);
        rgba[i + 2] = Math.round(b / cov);
      }
      rgba[i + 3] = Math.round(alpha);
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-192.png", 192, true],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true], // iOS는 마스크를 직접 씌우므로 full-bleed
];
for (const [name, size, maskable] of targets) {
  const buf = draw(size, maskable);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, size + "x" + size, (buf.length / 1024).toFixed(1) + "KB");
}
