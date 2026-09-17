// 바텐톡 시연 영상 녹화 — 설치된 크롬을 조작하고, 크롬의 MediaRecorder 로 MP4 를 만듭니다.
//   node record.mjs  →  out/bartalk-demo.mp4
import puppeteer from "puppeteer-core";
import fs from "fs";
import { fileURLToPath } from "url";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const APP = "http://localhost:4173/";
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const CHECK = process.argv.includes("--check");   // 녹화 없이 장면마다 스크린샷만

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--lang=ko-KR", "--font-render-hinting=none"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});
await browser.defaultBrowserContext().overridePermissions("http://localhost:4173", ["geolocation"]);
const page = await browser.newPage();
await page.setGeolocation({ latitude: 36.1047, longitude: 128.4192, accuracy: 30 });
await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36");
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

/* ---------- 서버 없이 도는 시연용 설정 ---------- */
await page.setRequestInterception(true);
page.on("request", (req) => {
  const u = req.url();
  if (u.startsWith(APP) && u.endsWith("/sw.js")) return req.respond({ status: 404, body: "" });   // 캐시 없이
  req.continue();
});

await page.evaluateOnNewDocument(() => {
  // 서버 없이 도는 시연 — 앱이 설정을 넣는 순간 서버 주소를 비우고 결제 키만 시연용으로
  let cfg;
  Object.defineProperty(window, "BARTALK_CONFIG", { configurable: true, get: () => cfg, set: (v) => { cfg = Object.assign({}, v, { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", TOSS_CLIENT_KEY: "test_ck_demo", TURNSTILE_SITE_KEY: "", KAKAO_JS_KEY: "" }); } });
  const H = 3600e3, now = Date.now();
  const set = (k, v) => { if (localStorage.getItem("bartalk_" + k) === null) localStorage.setItem("bartalk_" + k, JSON.stringify(v)); };
  set("user", { nick: "도아", color: 13, onboarded: true, role: "owner", roleAsked: true, name: "노도아", phone: "01012345678", points: 180, badges: ["start"], lastAttend: new Date().toDateString(), attendStreak: 3 });
  set("themeMode", "light"); set("seedv", 13); set("barseedv", 3); set("phoneAskedAt", now); set("push", false);
  localStorage.setItem("bartalk_push_nudge_off", "1");
  const P = (id, cat, color, hAgo, title, body, likes, cm) => ({ id, cat, color, time: now - hAgo * H, title, body, likes, comments: Array.from({ length: cm }, (_, i) => ({ id: id * 10 + i, color: 17 + i, text: "공감해요", time: now - (hAgo - 0.2) * H })) });
  set("posts", [
    P(900001, "free", 17, 1, "[예시] 화요일 저녁 칵테일 한 잔 어디가 좋을까요", "퇴근하고 조용히 한 잔 할 곳 찾고 있어요. 구미 쪽 추천 부탁드려요.", 6, 3),
    P(900002, "free", 13, 3, "[예시] 사장님들 월정액 패스 써보신 분?", "단골 만들기용으로 구독 상품 고민 중인데 반응 어떤가요.", 11, 5),
    P(900003, "promo", 14, 5, "[예시] 9월 한정 피치 스매시 출시", "이달 네 번째 방문하시면 한 잔 드려요.", 4, 1),
    P(900004, "free", 25, 8, "[예시] 조주기능사 실기 3주 컷 후기", "레시피 카드로 매일 20분씩 외웠어요.", 18, 7),
  ]);
  // 시연 환경은 카카오 지도 도메인이 아니라서 지도 칸은 숨겨요
  document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = ".bar-map-wrap{display:none!important}"; document.head.appendChild(st); });
  // 손 터치 표시
  window.__tap = (x, y) => {
    const d = document.createElement("div");
    d.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(255,92,53,.35);border:2px solid rgba(255,92,53,.9);z-index:2147483647;pointer-events:none;transition:transform .45s ease,opacity .45s ease;`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = "scale(1.6)"; d.style.opacity = "0"; });
    setTimeout(() => d.remove(), 600);
  };
  // 가짜 카메라: 손님 폰 화면의 QR 을 비추는 장면 (앱의 진짜 스캐너가 읽어요)
  const origGUM = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => {
    const cv = document.createElement("canvas"); cv.width = 640; cv.height = 480;
    const g = cv.getContext("2d");
    if (!window.QRCode) await new Promise((res) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    const holder = document.createElement("div");
    new window.QRCode(holder, { text: "BTP:7:ABCD12", width: 220, height: 220, correctLevel: window.QRCode.CorrectLevel.M });
    const qc = holder.querySelector("canvas");
    let t = 0;
    const paint = () => {
      t++;
      const grd = g.createLinearGradient(0, 0, 640, 480); grd.addColorStop(0, "#2a2320"); grd.addColorStop(1, "#140f0d");
      g.fillStyle = grd; g.fillRect(0, 0, 640, 480);
      const dx = Math.sin(t / 18) * 6, dy = Math.cos(t / 23) * 4;
      g.fillStyle = "#1c1c1e"; g.beginPath(); g.roundRect(190 + dx, 40 + dy, 260, 420, 28); g.fill();
      g.fillStyle = "#fff"; g.fillRect(200 + dx, 100 + dy, 240, 240);
      if (t > 25 && qc) g.drawImage(qc, 220 + dx, 120 + dy, 200, 200);   // 둘레에 흰 여백이 있어야 읽혀요
      g.fillStyle = "#ff5c35"; g.font = "bold 22px sans-serif"; g.fillText("STAY IN 비밀의정원", 222 + dx, 90 + dy);
      g.fillStyle = "#bbb"; g.font = "18px sans-serif"; g.fillText("스탠다드 · 7-ABCD12", 238 + dx, 370 + dy);
    };
    setInterval(paint, 50); paint();
    return cv.captureStream(20);
  };
});

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

// 서버 대신 쓰는 예시 응답 (시연용)
await page.evaluate(() => {
  const S = window.BarTalkSync;
  Object.defineProperty(S, "enabled", { get: () => true });
  Object.defineProperty(S, "signedIn", { get: () => true });
  const KEY = "stayin비밀의정원|구미", day = (d) => new Date(Date.now() + d * 86400e3).toISOString().slice(0, 10);
  const plans = [
    { id: 1, name: "라이트", price: 39000, kind: "personal", days: "all", drinks_per_day: 1, monthly_cap: 6, team_size: 1, duration_days: 30, active: true, note: "커피 두 잔 값에 퇴근 한 잔 · 위스키 10% 할인" },
    { id: 2, name: "스타터", price: 119000, kind: "personal", days: "all", drinks_per_day: 2, monthly_cap: 20, team_size: 1, duration_days: 30, active: true, note: "하루 2잔이라 친구 몫도 돼요 · 위스키 10% 할인" },
    { id: 3, name: "스탠다드", price: 159000, kind: "personal", days: "all", drinks_per_day: 3, monthly_cap: 32, team_size: 1, duration_days: 30, active: true, note: "⭐ 가장 인기 · 매일 한 잔 + 주말엔 친구 몫 · 위스키 10% 할인" },
    { id: 4, name: "프리미엄", price: 219000, kind: "personal", days: "all", drinks_per_day: 3, monthly_cap: 48, team_size: 1, duration_days: 30, active: true, note: "시그니처 칵테일까지 · 위스키 15% 할인" },
    { id: 5, name: "팀 패스", price: 399000, kind: "team", days: "all", drinks_per_day: 3, monthly_cap: 75, team_size: 5, duration_days: 30, active: true, note: "5명 · 1인 79,800원 · 법인카드 OK" },
    { id: 6, name: "원데이", price: 19000, kind: "oneday", days: "all", drinks_per_day: 2, monthly_cap: null, team_size: 1, duration_days: 1, active: true, note: "회원이 데려온 동료용 · 당일 2잔" },
  ];
  const mine = { id: 7, user_id: "me", bar_key: KEY, bar_name: "STAY IN 비밀의정원", plan_id: 3, plan_name: "스탠다드", price: 159000, kind: "personal", days: "all", status: "active", drinks_per_day: 3, monthly_cap: 32, duration_days: 30, starts_at: day(-9), ends_at: day(21), today_drinks: 0, month_drinks: 11, stamps: 3, stamp_goal: 4, special_drink: "9월 한정 피치 스매시", nick: "도아", member_name: "노도아", team_id: null, auto_renew: true, paid_via: "toss", approved_at: new Date(Date.now() - 9 * 864e5).toISOString(), created_at: new Date().toISOString() };
  const nicks = ["민수", "지영", "하준", "서연", "도윤", "예린", "현우", "수아"];
  const members = [mine].concat(nicks.map((n, i) => ({ id: 20 + i, user_id: "u" + i, bar_key: KEY, bar_name: mine.bar_name, plan_id: plans[i % 4].id, plan_name: plans[i % 4].name, price: plans[i % 4].price, kind: "personal", status: "active", drinks_per_day: plans[i % 4].drinks_per_day, monthly_cap: plans[i % 4].monthly_cap, duration_days: 30, starts_at: day(-i - 2), ends_at: day(28 - i), paid_via: i % 3 ? "toss" : "manual", auto_renew: i % 3 !== 0, approved_at: new Date(Date.now() - (i + 2) * 864e5).toISOString() })));
  const profiles = Object.fromEntries([["me", { nick: "도아", color: 13 }]].concat(nicks.map((n, i) => ["u" + i, { nick: n, color: 13 + (i * 3) % 16 }])));
  const payments = members.filter((p) => p.paid_via === "toss").map((p, i) => ({ id: i + 1, pass_id: p.id, amount: p.price, status: "paid", paid_at: p.approved_at }));
  let offer = null;
  const settings = { enabled: true, bar_name: "STAY IN 비밀의정원", once_markup_pct: 20, stamp_goal: 4, special_drink: "9월 한정 피치 스매시", refund_drink_price: 15000, goal_monthly: 15000000, notice: "" };
  const visits = [];
  members.forEach((p, i) => { for (let d = 0; d < (i % 5) + 2; d++) visits.push({ id: visits.length + 1, pass_id: p.id, user_id: p.user_id, action: "enter", drinks: 0, day: day(-d * 2), at: new Date(Date.now() - d * 2 * 864e5 - 3600e3 * (i % 4)).toISOString() }, { id: visits.length + 2, pass_id: p.id, user_id: p.user_id, action: "drink", drinks: 1, day: day(-d * 2), at: new Date(Date.now() - d * 2 * 864e5).toISOString() }); });
  const daily = Array.from({ length: 14 }, (_, i) => ({ day: day(i - 13), n: visits.filter((v) => v.action === "enter" && v.day === day(i - 13)).length }));
  Object.assign(S, {
    passProgram: async () => ({ ok: true, settings, plans, mine: null, owner: false, seats: {}, offer }),
    passMine: async () => ({ ok: true, passes: [mine] }),
    passOwnedBars: async () => ({ ok: true, bars: [{ bar_key: KEY, bar_name: "STAY IN 비밀의정원" }] }),
    passPartnerBars: async () => ({ ok: true, bars: [{ bar_key: KEY, bar_name: "STAY IN 비밀의정원", addr: "경북 구미시 인동", region: "경북", area: "구미", type: "칵테일바", lat: 36.1063, lng: 128.4221 }] }),
    passCardLabel: async () => ({ ok: true, label: null }),
    passInfo: async () => ({ ok: true, data: mine }),
    passQr: async () => ({ ok: true, data: { token: "BTP:7:ABCD12", pass_id: 7, code: "ABCD12" } }),
    passOwners: async () => ({ ok: true, owners: [{ user_id: "me", nick: "도아" }] }),
    passOwnerTerms: async () => ({ ok: true, owner: true, accepted: true }),
    passOwnerData: async () => ({ ok: true, settings, plans, passes: members, profiles, memberCols: true, seats: {}, closed: [], payments }),
    passDashboard: async () => ({ ok: true, data: { members: members.length, pending: 0, visits_month: visits.filter((v) => v.action === "enter").length, avg_visits: 3.4, nightly_tt: 6.2, drinks_month: visits.filter((v) => v.action === "drink").length, revenue_month: 0, daily } }),
    passVisitsRecent: async () => ({ ok: true, visits }),
    passOfferNow: async () => ({ ok: true, offer }),
    passOffersFor: async () => ({ ok: true, offers: offer ? [offer] : [] }),
    passOfferApi: async (action, b) => { if (action === "offer") { offer = { id: 1, bar_key: KEY, bar_name: settings.bar_name, seats_left: b.seats_left, bonus_drinks: b.bonus_drinks, oneday_price: b.oneday_price, expires_at: new Date(Date.now() + b.hours * 3600e3).toISOString() }; return { ok: true, offer, people: members.length, sent: members.length }; } offer = null; return { ok: true }; },
    passScan: async (token, action) => { if (action === "drink") { mine.today_drinks++; mine.month_drinks++; } return { ok: true, data: Object.assign({}, mine, { entered_today: true }) }; },
    passGiftsMine: async () => ({ ok: true, data: window.__gifts || [] }),
    passGiftCreate: async (id, msg) => { const g = { id: 1, code: "G-7F3A91C2", pass_id: 7, bar_key: KEY, bar_name: settings.bar_name, message: msg, status: "open", expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), from_nick: "도아", mine: true }; window.__gifts = [g]; return { ok: true, data: g }; },
    passAuditList: async () => ({ ok: true, data: [] }),
  });
  navigator.share = undefined;
  try { navigator.clipboard.writeText = async () => {}; } catch {}
  window.prompt = () => "퇴근길 한 잔 쏠게 🍸";
});

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
