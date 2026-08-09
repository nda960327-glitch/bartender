/* ============================================================
 *  바텐톡 앱 아이콘 생성기 (외부 의존성 없음)
 *
 *  로고: "세 물방울" — 크기가 다른 물방울 셋이 대화를 주고받는 모습.
 *  앱 안의 익명 아바타와 같은 형태라 아이콘과 프로필이 한 가족으로 보입니다.
 *
 *  사용법:  node tools/gen-icons.js icons
 * ============================================================ */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2] || "icons";

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

/* ---------- 도형 ---------- */
/* 물방울 = 아래쪽 원 + 꼭짓점에서 그 원에 그은 두 접선이 만드는 삼각형.
 * 접선으로 이어야 원과 만나는 지점이 꺾이지 않고 매끄럽습니다.
 * (단순히 폭을 0까지 줄이면 끝이 바늘처럼 되어 방울로 안 읽혀요)
 *
 * 꼭짓점을 원 중심에서 거리 d 만큼 위에 두면
 *   접선의 기울기 tanα = r / √(d²−r²),  접점 높이 = cy − r²/d
 */
function makeDroplet(cx, cy, r, stretch = 2.2) {
  const d = r * stretch;              // 꼭짓점까지의 거리 (클수록 길쭉)
  const tipY = cy - d;
  const slope = r / Math.sqrt(d * d - r * r);
  const touchY = cy - (r * r) / d;    // 접점 높이 — 여기부터는 원이 담당
  return { cx, cy, r, tipY, slope, touchY };
}

function inDroplet(x, y, D) {
  const dx = x - D.cx, dy = y - D.cy;
  if (dx * dx + dy * dy <= D.r * D.r) return true;      // 아래 원
  if (y > D.touchY || y < D.tipY) return false;
  return Math.abs(dx) <= (y - D.tipY) * D.slope;        // 접선 사이
}

const roundRectInside = (x, y, w, h, r) => {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  return Math.hypot(x - cx, y - cy) <= r;
};

// 세 물방울 — 대화가 오가듯 크기와 높이를 다르게 놓았습니다.
// 뒤(연한 것)부터 그려서 가운데 큰 방울이 앞에 오게 합니다.
const DROPS = [
  { d: makeDroplet(146, 344, 58, 2.0), alpha: 0.50 },   // 왼쪽
  { d: makeDroplet(372, 350, 46, 2.0), alpha: 0.72 },   // 오른쪽
  { d: makeDroplet(256, 300, 92, 2.3), alpha: 1.00 },   // 가운데 (가장 앞)
];

/**
 * @param {number} size 출력 픽셀 크기
 * @param {boolean} maskable true 면 전체 블리드 + 콘텐츠를 안전영역으로 축소
 */
function draw(size, maskable) {
  const SS = 4;                     // 슈퍼샘플링
  const rgba = Buffer.alloc(size * size * 4);
  const scale = 512 / size;
  const k = maskable ? 0.66 : 1;    // 마스커블은 중앙 원 안에 들어오게 축소
  const tx = (v) => (v - 256) / k + 256;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, cov = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) * scale;
          const uy = (py + (sy + 0.5) / SS) * scale;

          if (!maskable && !roundRectInside(ux, uy, 512, 512, 120)) continue;

          // 배경: 분홍 대각 그라디언트
          const t = Math.max(0, Math.min(1, (ux + uy) / 1024));
          let cr = 0xff;
          let cg = Math.round(0x5c + (0x8a - 0x5c) * t);
          let cb = Math.round(0x35 + (0xd4 - 0x35) * t);

          // 물방울 (흰색, 뒤에서 앞으로 겹쳐 그림)
          const gx = tx(ux), gy = tx(uy);
          for (const { d, alpha } of DROPS) {
            if (inDroplet(gx, gy, d)) {
              cr = Math.round(cr + (255 - cr) * alpha);
              cg = Math.round(cg + (255 - cg) * alpha);
              cb = Math.round(cb + (255 - cb) * alpha);
            }
          }

          r += cr; g += cg; b += cb; cov++;
        }
      }

      const i = (py * size + px) * 4;
      const total = SS * SS;
      if (cov > 0) {
        rgba[i] = Math.round(r / cov);
        rgba[i + 1] = Math.round(g / cov);
        rgba[i + 2] = Math.round(b / cov);
      }
      rgba[i + 3] = Math.round((cov / total) * 255);
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-192.png", 192, true],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],   // iOS 는 직접 마스크를 씌우므로 full-bleed
];

fs.mkdirSync(OUT, { recursive: true });
for (const [name, size, maskable] of targets) {
  const buf = draw(size, maskable);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, size + "x" + size, (buf.length / 1024).toFixed(1) + "KB");
}
