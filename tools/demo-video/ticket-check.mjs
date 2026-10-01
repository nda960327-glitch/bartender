// 입장권 점검 — 인원·후카를 고르면 금액이 맞게 나오는지, 서버 계산과 같은지 확인합니다.
//   node tools/serve.js  (다른 창)  →  node ticket-check.mjs
import puppeteer from "puppeteer-core";
import fs from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { APP, launchDemoBrowser, installDemoConfig, installDemoData } from "./mock.mjs";

const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fail = 0;
const check = (name, ok, extra) => { if (!ok) fail++; console.log((ok ? "✓ " : "✗ ") + name + (extra ? "  — " + extra : "")); };

// 서버 계산식 (api/pass-billing.js 에서 그대로 떼어 와 돌려봅니다)
const src = fs.readFileSync(fileURLToPath(new URL("../../api/pass-billing.js", import.meta.url)), "utf8");
const part = src.slice(src.indexOf("const TICKET = "), src.indexOf("/* 카드 등록 + 첫 결제 + 패스 발급 */"));
const srv = new Function(part + "; return { ticketOrder, ticketPrice, ticketLabel };")();
const CASES = [[1, 0, 38000], [1, 1, 57000], [2, 0, 76000], [2, 1, 104000], [3, 1, 142000], [5, 2, 246000], [1, 2, 94000]];
CASES.forEach(([p, h, want]) => check(`서버: ${p}명 · 후카 ${h}대 = ${want.toLocaleString()}원`, srv.ticketPrice(38000, p, h) === want, String(srv.ticketPrice(38000, p, h))));
check("서버: 인원 0·음수·문자는 1명으로", srv.ticketOrder({ party: 0 }).party === 1 && srv.ticketOrder({ party: -3 }).party === 1 && srv.ticketOrder({ party: "abc" }).party === 1);
check("서버: 인원 99 → 10명, 후카 99 → 4대로 막음", srv.ticketOrder({ party: 99, hookah: 99 }).party === 10 && srv.ticketOrder({ party: 99, hookah: 99 }).hookah === 4);
check("서버: 이름표", srv.ticketLabel("입장권", 3, 1) === "입장권 · 3명 · 후카 1대" && srv.ticketLabel("입장권", 1, 0) === "입장권");

const { browser, page } = await launchDemoBrowser(puppeteer);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await installDemoConfig(page);
await page.goto(APP, { waitUntil: "networkidle2" });
await wait(1200);
await installDemoData(page);
// 가게 상품을 입장권 + (숨겨져야 할) 예전 월정액 상품으로 바꿔 둡니다. 내 패스는 없는 상태.
await page.evaluate(() => {
  const S = window.BarTalkSync, KEY = "stayin비밀의정원|구미";
  const plans = [
    { id: 1, name: "스탠다드", price: 159000, kind: "personal", days: "all", drinks_per_day: 3, monthly_cap: 32, team_size: 1, duration_days: 30, active: true, note: "예전 월정액" },
    { id: 9, name: "입장권", price: 38000, kind: "oneday", days: "all", drinks_per_day: 99, monthly_cap: null, team_size: 1, duration_days: 2, active: true, note: "2시간 동안 기본 칵테일 무제한" },
  ];
  const settings = { enabled: true, bar_name: "STAY IN 비밀의정원", once_markup_pct: 20, stamp_goal: 4, special_drink: "", refund_drink_price: 15000 };
  S.passProgram = async () => ({ ok: true, settings, plans, mine: null, owner: false, seats: {}, offer: null });
  S.passMine = async () => ({ ok: true, passes: [] });
  S.passOwnedBars = async () => ({ ok: true, bars: [] });
  window.__paid = null;
  window.TossPayments = () => ({ requestPayment: async (m, req) => { window.__paid = req; } });
});
const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 6000 }); await page.$eval(sel, (e) => e.click()); await wait(350); };
const text = (sel) => page.$eval(sel, (e) => e.innerText).catch(() => "");

await click('.nav-btn[data-view="home"]');
check("홈 제목이 입장권", (await text("#view-home")).includes("입장권 🎫") && !(await text("#view-home")).includes("하우스 패스"));
check("홈 배너 문구", (await text("#home-pass")).includes("입장권 끊고, QR 찍고 입장"), (await text("#home-pass")).replace(/\n/g, " | ").slice(0, 90));
await page.screenshot({ path: OUT + "ticket-1-home.png" });
await click('[data-go="bars"], [data-view="bars"]');
await click("#view-bars .bar-item[data-id]");
await page.waitForSelector("#bar-pass .pass-plan", { visible: true });
const plansShown = await page.$$eval("#bar-pass .pass-plan", (els) => els.map((e) => e.innerText.replace(/\n/g, " ")));
check("손님에게는 입장권만 보임 (월정액 숨김)", plansShown.length === 1 && plansShown[0].includes("입장권") && plansShown[0].includes("38,000원"), plansShown.join(" || "));
check("상품 설명: 2시간 무제한", plansShown[0].includes("2시간") && plansShown[0].includes("무제한"));
check("안내문에 자동결제 없음", !(await text("#bar-pass")).includes("자동결제") && (await text("#bar-pass")).includes("한 번만 결제"));
await page.evaluate(() => document.querySelector("#bar-pass").scrollIntoView({ block: "start" }));
await page.screenshot({ path: OUT + "ticket-2-bar.png" });

await click("#bar-pass .pass-plan");
await page.waitForSelector("#tk-pay", { visible: true });
const sum = () => text("#tk-sum");
const step = async (k, d, n = 1) => { for (let i = 0; i < n; i++) await page.$eval(`.tk-step button[data-k="${k}"][data-d="${d}"]`, (e) => e.click()); await wait(120); };
check("처음: 1명 38,000원", (await sum()) === "38,000원", await sum());
check("줄이기 버튼은 막힘", await page.$eval('.tk-step button[data-k="party"][data-d="-1"]', (e) => e.disabled));
await step("hookah", 1);
check("1명 + 후카 1대 = 57,000원 (세트)", (await sum()) === "57,000원", (await sum()) + " / " + (await text("#tk-detail")));
await step("party", 1);
check("2명 + 후카 1대 = 104,000원 · 1인당 52,000원", (await sum()) === "104,000원" && (await text("#tk-per")).includes("52,000원"), (await sum()) + " / " + (await text("#tk-per")));
await page.screenshot({ path: OUT + "ticket-3-sheet.png" });
await step("party", 1, 3); await step("hookah", 1);
check("5명 + 후카 2대 = 246,000원", (await sum()) === "246,000원", await sum());
await step("party", 1, 9);
check("인원은 10명까지", (await text("#tk-party")) === "10");
await step("party", -1, 5);

// 결제창으로 넘어가는 값
await click("#tk-pay");
await page.waitForSelector(".sheet-opt", { visible: true });
check("결제 수단 창 제목", (await text(".sheet h3")).includes("입장권 · 5명 · 후카 2대") && (await text(".sheet h3")).includes("246,000원"), await text(".sheet h3"));
await page.$eval(".sheet-opt", (e) => e.click()); await wait(800);
const paid = await page.evaluate(() => window.__paid);
const intent = await page.evaluate(() => JSON.parse(localStorage.getItem("bartalk_passPayIntent")));
check("토스에 넘긴 금액·이름", paid && paid.amount === 246000 && paid.orderName.includes("5명 · 후카 2대"), JSON.stringify(paid && { amount: paid.amount, orderName: paid.orderName }));
check("서버로 보낼 인원·후카 저장", intent && intent.ticket && intent.ticket.party === 5 && intent.ticket.hookah === 2 && intent.amount === 246000);
check("앱 금액 = 서버 금액", srv.ticketPrice(38000, 5, 2) === paid.amount);
check("화면 오류 없음", errors.length === 0, errors.join(" / "));
console.log(fail ? `\n실패 ${fail}개` : "\n전부 통과");
await browser.close();
process.exit(fail ? 1 : 0);
