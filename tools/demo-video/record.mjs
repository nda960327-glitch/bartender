// 바텐톡 시연 영상 녹화 — 설치된 크롬을 조작하고, 크롬의 WebCodecs 로 MP4 를 만듭니다.
//   node record.mjs  →  out/capture.json  (encode.mjs 가 영상으로 바꿔요)
import puppeteer from "puppeteer-core";
import fs from "fs";
import { fileURLToPath } from "url";
import { APP, launchDemoBrowser, installDemoConfig, installDemoData } from "./mock.mjs";

const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const CHECK = process.argv.includes("--check");   // 녹화 없이 장면마다 스크린샷만

const { browser, page } = await launchDemoBrowser(puppeteer);
await installDemoConfig(page);

/* ---------- 녹화 ---------- */
const frames = [], captions = [];
const cdp = await page.createCDPSession();
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data });
  try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let shot = 0;
const say = async (text, sub) => {
  captions.push({ t: Date.now() / 1000, text, sub: sub || "" });
  if (CHECK) await page.screenshot({ path: OUT + `check-${String(++shot).padStart(2, "0")}.png` });
};
async function tap(sel, opt = {}) {
  const el = await page.waitForSelector(sel, { visible: true, timeout: 8000 });
  await el.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
  await wait(opt.scrollWait ?? 350);
  const box = await el.boundingBox();
  await page.evaluate((x, y) => window.__tap(x, y), box.x + box.width / 2, box.y + box.height / 2);
  await wait(120);
  await el.evaluate((e) => e.click());
  await wait(opt.after ?? 900);
}
async function scroll(dy, ms = 900) {
  await page.evaluate((dy) => {
    const v = [...document.querySelectorAll(".view")].find((x) => !x.hidden && x.offsetParent !== null) || document;
    const sa = v.querySelector(".scroll-area") || document.scrollingElement;
    sa.scrollBy({ top: dy, behavior: "smooth" });
  }, dy);
  await wait(ms);
}
const back = async () => { await page.evaluate(() => { const b = [...document.querySelectorAll(".view")].find((x) => !x.hidden && x.offsetParent !== null)?.querySelector(".back-btn"); b ? b.click() : history.back(); }); await wait(700); };
// 홈으로 돌아가는 동안엔 자막을 내려요 (다음 장면 자막은 화면이 바뀐 뒤에)
const home = async () => { captions.push({ t: Date.now() / 1000, text: "", sub: "" }); await tap('.nav-btn[data-view="home"]', { after: 1000 }); };

await page.goto(APP, { waitUntil: "networkidle2" });
await wait(1500);

await installDemoData(page);

if (!CHECK) await cdp.send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
const T0 = Date.now() / 1000;

/* ---------- 장면 ---------- */
await home();
await say("홈", "내 패스와 운영 가게 매출이 한눈에");
await wait(2600);

await tap('[data-go="bars"], [data-view="bars"]', { after: 350 });
await say("바 찾기", "하우스 패스를 파는 동네 바");
await wait(2200);
await tap("#view-bars .bar-item[data-id]", { after: 350 });
await say("가게 페이지", "월정액 상품 — 얼마 아끼는지 바로 보여요");
await page.evaluate(() => document.querySelector("#bar-pass").scrollIntoView({ block: "start", behavior: "smooth" }));
await wait(2200);
await scroll(260, 1800);
await tap('#bar-pass .pass-plan[data-plan="3"]', { after: 350 });
await say("결제", "정기 구독이 정가 · 한 번만 결제는 20% 더");
await wait(3400);
await page.evaluate(() => document.querySelector(".sheet-backdrop")?.remove());
await wait(400);

await home();
await tap("#home-pass [data-pass]", { after: 350 });
await say("내 패스", "90초마다 바뀌는 입장 QR");
await wait(4200);
await scroll(420, 1500);
await say("도장판 · 한 잔 쏘기", "네 번째 방문엔 한정 칵테일, 친구에겐 링크로 한 잔");
await wait(1200);
await tap("#pass-gift", { after: 1300 });
await tap(".bt-modal [data-yes]", { after: 1600, scrollWait: 100 });
await wait(900);

await home();
await tap("#home-pass .pass-scan-btn", { after: 350 });
await say("사장님 · 입장 확인", "손님 QR을 비추면 바로 인식");
await wait(5000);
await say("잔 사용", "하루·월 잔수는 서버가 자동으로 막아요");
await tap('#pass-admin-area [data-act="drink"]', { after: 1500 });
await wait(1500);

await page.evaluate(() => { const a = document.querySelector("#pass-admin-area .scan-result"); if (a) a.remove(); });
await tap('#pass-admin-tabs [data-tab="scan"]', { after: 900 });
await tap("#offer-open", { after: 900 });
await say("빈자리 알림", "자리가 비면 회원 폰에 “지금 오면 +1잔”");
await tap('#of-seat-seg [data-v="10"]', { after: 700, scrollWait: 100 });
await wait(900);
await tap("#of-send", { after: 1800 });
await wait(1500);

await tap('#pass-admin-tabs [data-tab="stats"]', { after: 350 });
await say("매출 · 지표", "이달 구독 매출과 목표 달성률");
await wait(3600);
await tap('#pass-admin-area .kpi[data-k="visits"]', { after: 350 });
await say("숫자를 누르면 내역", "안 온 회원까지 보여요");
await wait(3400);
await page.evaluate(() => document.querySelector(".sheet-backdrop")?.remove());

captions.push({ t: Date.now() / 1000, text: "", sub: "" });
await tap('.nav-btn[data-view="community"]', { after: 350 });
await say("커뮤니티", "사장님 · 바텐더 · 손님이 함께");
await wait(3500);

await home();
await tap('[data-go="cbt"], [data-view="cbt"]', { after: 350 });
await say("조주기능사 필기 CBT", "기출 600문항 · 실기 카드 · 무료");
await wait(2600);
await tap(".cbt-mock", { after: 350 });
await say("랜덤 모의고사", "바텐더 준비생이 먼저 모이는 곳");
await wait(3600);

const T1 = Date.now() / 1000;
if (!CHECK) await cdp.send("Page.stopScreencast");
await wait(300);
console.log("frames", frames.length, "duration", (T1 - T0).toFixed(1) + "s");
if (CHECK) { await browser.close(); process.exit(0); }

/* ---------- 녹화 결과 저장 → encode.mjs 가 영상으로 만듭니다 ---------- */
fs.writeFileSync(OUT + "capture.json", JSON.stringify({ T0, T1, captions, frames }));
console.log("capture.json", (fs.statSync(OUT + "capture.json").size / 1e6).toFixed(1) + "MB");
await browser.close();
