/* ============================================================
 *  스토어 등록 자료 만들기 — 구글 플레이 · 애플 앱스토어
 *
 *  준비:  node tools/serve.js      (다른 창에서, 4173 포트)
 *  실행:  npm install && npm run all
 *
 *  나오는 것 (store/ 폴더)
 *    icon/play-512.png        플레이 앱 아이콘 (512, 투명도 있음)
 *    icon/appstore-1024.png   앱스토어 앱 아이콘 (1024, 투명도 없음 — 있으면 반려돼요)
 *    graphic/feature-1024x500.png   플레이 그래픽 이미지
 *    screenshot/play/*.jpg    플레이 휴대폰 스크린샷 1080x1920
 *    screenshot/ios/*.jpg     앱스토어 6.7인치 스크린샷 1290x2796
 *
 *  화면 속 회원·매출·글은 전부 예시입니다. 실제 손님 자료가 아니에요.
 * ============================================================ */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { APP, CHROME, launchDemoBrowser, installDemoConfig, installDemoData } from "../demo-video/mock.mjs";

const require = createRequire(import.meta.url);
const { draw } = require("../gen-icons.js");

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OUT = path.join(ROOT, "store");
const RAW = path.join(OUT, ".raw");
const only = process.argv.slice(2);
const doShots = !only.length || only.includes("--shots");
const doImages = !only.length || only.includes("--images");
const mk = (p) => (fs.mkdirSync(p, { recursive: true }), p);

/* ---------- 장면 목록 ----------
 * cap: 스크린샷 위에 얹는 한 줄. 스토어에서 이 글만 읽고 지나가는 사람이 많아요. */
const SCENES = [
  { id: "01-home", cap: "동네 바를 월정액으로", sub: "매달 정해진 잔 수, 언제든 편하게" },
  { id: "02-plans", cap: "얼마나 아끼는지 한눈에", sub: "상품마다 절약 금액을 그대로 보여줘요" },
  { id: "03-qr", cap: "QR 한 번이면 입장", sub: "90초마다 바뀌어 빌려줄 수 없어요" },
  { id: "04-gift", cap: "친구에게 한 잔 선물", sub: "링크만 보내면 끝 · 도장판은 덤" },
  { id: "05-scan", cap: "사장님은 비추기만", sub: "남은 잔 수는 앱이 알아서 계산해요" },
  { id: "06-stats", cap: "이달 구독 매출이 늘 보여요", sub: "목표 달성률과 회원별 방문까지" },
  { id: "07-offer", cap: "자리가 비면 알림 한 번", sub: "“지금 오면 한 잔 더” 로 빈 밤을 채워요" },
  { id: "08-cbt", cap: "조주기능사 필기 무료", sub: "기출 600문항 · 실기 레시피 카드" },
];

/* ============================================================
 *  1단계 — 앱을 실제로 조작해 원본 스크린샷을 찍어요
 * ============================================================ */
async function shots() {
  mk(RAW);
  const { browser, page } = await launchDemoBrowser(puppeteer, { width: 390, height: 760, deviceScaleFactor: 3 });
  await installDemoConfig(page);
  await page.goto(APP, { waitUntil: "networkidle2" });
  await wait(1500);
  await installDemoData(page);

  const wait_ = wait;
  async function tap(sel, after = 900) {
    const el = await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await el.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await wait_(300);
    await el.evaluate((e) => e.click());
    await wait_(after);
  }
  async function scrollTo(sel) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "start", behavior: "smooth" }), sel);
    await wait_(1000);
  }
  const home = () => tap('.nav-btn[data-view="home"]', 1100);
  const shot = async (id) => {
    await page.screenshot({ path: path.join(RAW, id + ".png") });
    console.log("  찍음", id);
  };
  const closeSheet = () => page.evaluate(() => document.querySelector(".sheet-backdrop")?.remove());

  await home();
  await shot("01-home");

  await tap('[data-go="bars"], [data-view="bars"]');
  await tap("#view-bars .bar-item[data-id]");
  await scrollTo("#bar-pass");
  await shot("02-plans");

  await home();
  await tap("#home-pass [data-pass]", 1600);
  await shot("03-qr");
  await page.evaluate(() => {
    const v = [...document.querySelectorAll(".view")].find((x) => !x.hidden && x.offsetParent !== null);
    (v?.querySelector(".scroll-area") || document.scrollingElement).scrollBy({ top: 520, behavior: "smooth" });
  });
  await wait_(1300);
  await shot("04-gift");

  await home();
  await tap("#home-pass .pass-scan-btn", 1200);
  await wait_(5200);                                   // 가짜 카메라의 QR 을 앱이 읽을 때까지
  await shot("05-scan");

  await page.evaluate(() => document.querySelector("#pass-admin-area .scan-result")?.remove());
  await tap('#pass-admin-tabs [data-tab="stats"]', 1400);
  await shot("06-stats");

  await tap('#pass-admin-tabs [data-tab="scan"]');
  await tap("#offer-open", 1100);
  await tap('#of-seat-seg [data-v="10"]', 800);
  await shot("07-offer");
  await closeSheet();

  await home();
  await tap('[data-go="cbt"], [data-view="cbt"]', 1400);
  await shot("08-cbt");

  await browser.close();
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
 *  2단계 — 아이콘, 그래픽 이미지, 스토어용 스크린샷
 * ============================================================ */
const BRAND = { bg1: "#2a1a14", bg2: "#0b0908", accent: "#ff5c35", accent2: "#ff8ad4", ink: "#ffffff", sub: "#e7d0c4" };
const FONT_CSS = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";
const FONT = `'Pretendard Variable', 'Malgun Gothic', sans-serif`;

/** 스크린샷 한 장의 HTML — 위에 글, 아래에 앱 화면 */
function shotHTML(W, H, scene, dataUri, rawW, rawH) {
  const capH = Math.round(H * 0.155);
  const pad = Math.round(H * 0.035);
  const maxW = Math.round(W * 0.84);
  const maxH = H - capH - pad;
  const k = Math.min(maxW / rawW, maxH / rawH);
  const iw = Math.round(rawW * k), ih = Math.round(rawH * k);
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:${FONT};
       background:linear-gradient(160deg,${BRAND.bg1} 0%,${BRAND.bg2} 70%);
       display:flex;flex-direction:column;align-items:center}
  .glow{position:absolute;top:${-H * 0.12}px;left:50%;transform:translateX(-50%);
        width:${W * 1.1}px;height:${H * 0.34}px;border-radius:50%;
        background:radial-gradient(closest-side,rgba(255,92,53,.30),transparent)}
  .cap{height:${capH}px;display:flex;flex-direction:column;justify-content:center;
       text-align:center;padding:0 ${Math.round(W * 0.07)}px;position:relative}
  h1{font-size:${Math.round(W * 0.064)}px;font-weight:800;color:${BRAND.ink};letter-spacing:-.02em;line-height:1.22}
  p{margin-top:${Math.round(H * 0.012)}px;font-size:${Math.round(W * 0.031)}px;font-weight:500;color:${BRAND.sub};line-height:1.4}
  .shot{position:relative;width:${iw}px;height:${ih}px;border-radius:${Math.round(W * 0.035)}px;overflow:hidden;
        box-shadow:0 ${Math.round(H * 0.012)}px ${Math.round(H * 0.035)}px rgba(0,0,0,.55);
        outline:${Math.max(1, Math.round(W * 0.0018))}px solid rgba(255,255,255,.10);outline-offset:-1px}
  .shot img{width:100%;height:100%;display:block}
  .note{position:absolute;bottom:${Math.round(H * 0.012)}px;width:100%;text-align:center;
        font-size:${Math.round(W * 0.019)}px;color:rgba(255,255,255,.34);font-weight:500}
</style>
<div class="glow"></div>
<div class="cap"><h1>${scene.cap}</h1><p>${scene.sub}</p></div>
<div class="shot"><img src="${dataUri}"></div>
<div class="note">화면은 예시입니다</div>`;
}

/** 플레이 그래픽 이미지 — 검색 결과 맨 위에 걸리는 가로 배너 */
function featureHTML(W, H, iconUri) {
  const s = H / 500;
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:${FONT};
       background:linear-gradient(115deg,${BRAND.bg1} 0%,${BRAND.bg2} 62%);
       display:flex;align-items:center;gap:${44 * s}px;padding:0 ${74 * s}px}
  .glow{position:absolute;left:${-60 * s}px;top:${-120 * s}px;width:${560 * s}px;height:${560 * s}px;border-radius:50%;
        background:radial-gradient(closest-side,rgba(255,92,53,.34),transparent)}
  img{width:${188 * s}px;height:${188 * s}px;border-radius:${44 * s}px;position:relative;
      box-shadow:0 ${10 * s}px ${30 * s}px rgba(0,0,0,.5)}
  .t{position:relative}
  h1{font-size:${84 * s}px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1}
  h2{font-size:${38 * s}px;font-weight:700;color:${BRAND.accent};margin-top:${16 * s}px;letter-spacing:-.02em}
  p{font-size:${27 * s}px;font-weight:500;color:${BRAND.sub};margin-top:${14 * s}px}
</style>
<div class="glow"></div>
<img src="${iconUri}">
<div class="t">
  <h1>바텐톡</h1>
  <h2>동네 바 월정액 패스</h2>
  <p>QR 입장 · 잔 수 관리 · 사장님 매출까지 한 앱에서</p>
</div>`;
}

async function images() {
  const iconDir = mk(path.join(OUT, "icon"));
  const gDir = mk(path.join(OUT, "graphic"));

  // 아이콘 — 플레이는 투명도 있어도 되고, 애플은 있으면 반려돼요
  const play512 = draw(512, "full");
  const ios1024 = draw(1024, "full", true);
  fs.writeFileSync(path.join(iconDir, "play-512.png"), play512);
  fs.writeFileSync(path.join(iconDir, "appstore-1024.png"), ios1024);
  console.log("아이콘 play-512.png", (play512.length / 1024).toFixed(0) + "KB", "· appstore-1024.png", (ios1024.length / 1024).toFixed(0) + "KB");

  // 그림을 읽어줄 작은 서버 (data: 주소로 넣으면 큰 그림에서 크롬이 느려져요)
  const files = new Map();
  const srv = http.createServer((q, r) => {
    const b = files.get(q.url);
    if (!b) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { "Content-Type": "image/png", "Content-Length": b.length });
    r.end(b);
  }).listen(4188);
  const serve = (name, buf) => (files.set("/" + name, buf), `http://localhost:4188/${name}`);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=ko-KR", "--font-render-hinting=none"] });
  const page = await browser.newPage();
  const render = async (html, W, H, out, quality) => {
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    // 글꼴과 그림이 다 올라온 뒤에 찍어야 빈 칸이 안 생겨요
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
    });
    await wait(150);
    await page.screenshot({ path: out, type: quality ? "jpeg" : "png", quality: quality || undefined });
  };

  await render(featureHTML(1024, 500, serve("icon.png", play512)), 1024, 500, path.join(gDir, "feature-1024x500.png"));
  console.log("그래픽 feature-1024x500.png");

  const TARGETS = [
    { dir: "play", w: 1080, h: 1920, label: "플레이 휴대폰" },
    { dir: "ios", w: 1290, h: 2796, label: "앱스토어 6.7인치" },
  ];
  for (const t of TARGETS) {
    const d = mk(path.join(OUT, "screenshot", t.dir));
    for (const [i, sc] of SCENES.entries()) {
      const raw = path.join(RAW, sc.id + ".png");
      if (!fs.existsSync(raw)) { console.log("  건너뜀 (원본 없음)", sc.id); continue; }
      const buf = fs.readFileSync(raw);
      const rw = buf.readUInt32BE(16), rh = buf.readUInt32BE(20);
      const uri = serve(sc.id + ".png", buf);
      const out = path.join(d, `${String(i + 1).padStart(2, "0")}-${sc.id.slice(3)}.jpg`);
      await render(shotHTML(t.w, t.h, sc, uri, rw, rh), t.w, t.h, out, 92);
    }
    console.log(`스크린샷 ${t.label} ${t.w}x${t.h} → store/screenshot/${t.dir}/`);
  }
  await browser.close();
  srv.close();
}

if (doShots) { console.log("앱 화면 찍는 중… (tools/serve.js 가 떠 있어야 해요)"); await shots(); }
if (doImages) await images();
console.log("끝. store/ 폴더를 보세요.");
