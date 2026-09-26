/* 결제경로 캡처 — 공개 화면(로그인 전)을 실제 크롬 창으로 띄우고 화면 전체를 찍어요.
 *   주소창의 barapp.kr 과 작업표시줄 시계가 함께 찍혀서 토스 가이드 요건에 맞아요.
 *
 *   cd tools/payment-path && node capture.mjs   → store/결제경로/캡처/02·03·04·05 저장
 *   이어서 npm run pptx                          → 그 캡처로 PPT 를 다시 만들어요
 *
 * · 찍는 동안(30초쯤) 크롬 창이 화면 맨 앞에 와야 해요. 다른 창을 만지지 마세요.
 * · 로그인 뒤 화면(06 가게 상품 목록 · 07 결제 확인 창 · 08 토스 카드 입력창)은 직접 로그인해서 찍어요.
 *   같은 방법으로 찍으려면: 크롬 최대화 → 화면 → PrtSc → 그림판에 붙여 넣기 → store/결제경로/캡처/06-이름.png 로 저장.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(ROOT, "store", "결제경로", "캡처");
const SITE = "https://barapp.kr";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TEST_ID = "review@barapp.kr";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser, page;
function shot(name) {
  const out = path.join(OUT, name + ".png");
  const pid = browser.process() ? browser.process().pid : 0;
  let r;
  for (let i = 0; i < 6; i++) {   // 다른 창이 앞에 있으면 잠깐 기다렸다 다시 시도해요
    r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(HERE, "screenshot.ps1"), "-ChromePid", String(pid), "-Out", out], { encoding: "utf8" });
    if (r.status === 0) break;
    console.log(r.status === 3 ? "  … 크롬이 맨 앞이 아니에요. 다른 창을 만지지 마세요. 다시 시도" : "  … 캡처 오류, 다시 시도: " + String(r.stderr || r.stdout).split(/\r?\n/)[0].slice(0, 120));
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
  }
  if (r.status !== 0) throw new Error("캡처 실패: " + (r.stderr || r.stdout));
  if (!fs.existsSync(out)) throw new Error("캡처 파일이 저장되지 않았어요: " + out);
  console.log("  ✔", name + ".png");
}
async function scrollTo(sel, block = "center") {
  await page.evaluate((s, b) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: b }); }, sel, block);
  await page.mouse.click(60, 400);   // 주소창에 남은 선택 표시를 없애요 (왼쪽 빈 여백)
  await sleep(500);
}

fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bartalk-capture-"));
browser = await puppeteer.launch({
  executablePath: CHROME, headless: false, defaultViewport: null,
  args: ["--start-maximized", "--lang=ko-KR", "--no-first-run", "--no-default-browser-check", "--disable-infobars", "--user-data-dir=" + profile],
  ignoreDefaultArgs: ["--enable-automation"],
});
try {
  page = (await browser.pages())[0] || (await browser.newPage());

  console.log("02 하단 사업자정보 / 05 상품 목록 (pass.html)");
  await page.goto(SITE + "/pass.html", { waitUntil: "networkidle2" });
  await sleep(800);
  await scrollTo("#foot", "end"); shot("02-사업자정보");
  await scrollTo(".section-title", "start"); shot("05-상품안내");

  console.log("03 환불규정 (refund.html)");
  await page.goto(SITE + "/refund.html", { waitUntil: "networkidle2" });
  await sleep(500);
  await scrollTo("#doc", "start"); shot("03-환불규정");

  console.log("04 로그인 화면 (테스트 계정 이메일 입력, 비밀번호 칸 펼침)");
  await page.goto(SITE + "/", { waitUntil: "networkidle2" });
  await sleep(1500);
  await page.click("#login-email-toggle"); await sleep(300);
  await page.type("#login-email", TEST_ID);
  await page.click("#login-pw-toggle"); await sleep(800);
  await scrollTo("#login-pw-box", "end"); shot("04-로그인");
  console.log("캡처 완료 →", OUT);
  console.log("남은 것: 06 가게 상품 목록 · 07 결제 확인 창 · 08 토스 카드 입력창 — 로그인해서 직접 찍어 같은 폴더에 넣으세요.");
} finally {
  await sleep(300);
  await browser.close().catch(() => {});
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
