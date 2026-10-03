// CBT 점검 — 이어 풀기 · 과목별 · 오답노트 · 번호판이 실제로 도는지 확인합니다.
//   node tools/serve.js  (다른 창)  →  node cbt-check.mjs
import puppeteer from "puppeteer-core";
import fs from "fs";
import { fileURLToPath } from "url";
import { APP, launchDemoBrowser, installDemoConfig } from "./mock.mjs";

const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const { browser, page } = await launchDemoBrowser(puppeteer);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await installDemoConfig(page);
await page.goto(APP, { waitUntil: "networkidle2" });
await wait(1200);

let fail = 0;
const check = (name, ok, extra) => { if (!ok) fail++; console.log((ok ? "✓ " : "✗ ") + name + (extra ? "  — " + extra : "")); };
const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 6000 }); await page.$eval(sel, (e) => e.click()); await wait(350); };
const text = (sel) => page.$eval(sel, (e) => e.innerText).catch(() => "");
const yes = () => click(".bt-modal [data-yes]");
const pickMode = async (study) => { await page.waitForSelector(".sheet-opt", { visible: true }); await page.$$eval(".sheet-opt", (bs, s) => bs[s ? 1 : 0].click(), study); await wait(400); };
const answer = (right) => page.evaluate((right) => {
  // 화면의 문제를 데이터에서 찾아 정답(또는 일부러 오답)을 고릅니다
  const h = document.querySelector(".cbt-q h3").innerText.replace(/^\d+\.\s*/, "").trim();
  const opts = [...document.querySelectorAll(".cbt-opt")];
  const o0 = opts[0].innerText.replace(/^[①②③④]s*/, "").trim();   // 같은 문제가 여러 회차에 나와서 보기까지 맞춰 봅니다
  let a = -1;
  for (const r of window.CBT_DATA.rounds) for (const q of r.questions) if (q.q.trim() === h && String(q.o[0]).trim() === o0) a = q.a;
  opts[right ? a : (a + 1) % 4].click();
  return a;
}, right);

await click('[data-go="cbt"], [data-view="cbt"]');
await page.waitForSelector(".cbt-subj-btn", { visible: true });
check("과목별 시험 버튼 3개", (await page.$$(".cbt-subj-btn")).length === 3);
check("처음엔 이어 풀기·성적·오답노트 없음", !(await page.$(".cbt-resume")) && !(await page.$(".cbt-stats")) && !(await page.$("#cbt-wrongnote")));

// 1) 과목별 실전 — 20문항, 20분
await page.$$eval(".cbt-subj-btn", (b) => b[2].click()); await wait(300);
await pickMode(false);
await page.waitForSelector(".cbt-q", { visible: true });
check("3과목 20문항", (await text("#cbt-count")).trim() === "0/20", await text("#cbt-count"));
check("과목 표시가 영어", (await text(".cbt-subject")).includes("고객서비스영어"));
check("타이머 20분", /^(19|20):/.test(await text("#cbt-timer")), await text("#cbt-timer"));
await answer(true); await click("#cbt-next"); await answer(false); await click("#cbt-next"); await answer(true);
await click("#cbt-flag");
check("다시 보기 표시됨", (await text("#cbt-flag")).includes("표시함"));
await click("#cbt-grid");
const grid = await page.$$eval(".cbt-grid button", (bs) => ({ n: bs.length, done: bs.filter((b) => b.classList.contains("done")).length, flag: bs.filter((b) => b.classList.contains("flag")).length }));
check("번호판: 20칸 · 푼 것 3 · 표시 1", grid.n === 20 && grid.done === 3 && grid.flag === 1, JSON.stringify(grid));
await page.$$eval(".cbt-grid button", (bs) => bs[9].click()); await wait(400);
check("번호판으로 10번 이동", (await text(".cbt-no")).trim() === "10.");
await page.screenshot({ path: OUT + "cbt-1-exam.png" });

// 2) 앱이 튕긴 것처럼 새로고침 → 이어 풀기
const before = await text("#cbt-timer");
await page.reload({ waitUntil: "networkidle2" }); await wait(1200);
await click('[data-go="cbt"], [data-view="cbt"]');
await page.waitForSelector(".cbt-resume", { visible: true });
check("새로고침 뒤 이어 풀기 카드", (await text(".cbt-resume")).includes("3/20"), (await text(".cbt-resume")).replace(/\n/g, " | "));
await page.screenshot({ path: OUT + "cbt-2-resume.png" });
await click("#cbt-resume");
await page.waitForSelector(".cbt-q", { visible: true });
check("10번에서 이어짐 · 답 3개 유지", (await text(".cbt-no")).trim() === "10." && (await text("#cbt-count")).trim() === "3/20");
const after = await text("#cbt-timer");
const sec = (t) => +t.split(":")[0] * 60 + +t.split(":")[1];
check("꺼져 있던 동안 시간이 멈춤", Math.abs(sec(before) - sec(after)) <= 8, `${before} → ${after}`);

// 3) 제출 → 결과 · 기록 · 오답노트
await click("#cbt-submit"); await yes();
await page.waitForSelector(".cbt-result", { visible: true });
const res = await text(".cbt-result");
check("결과: 20문항 중 2개 정답 = 10점", res.includes("20문항 중 2개") && res.includes("10"), res.replace(/\n/g, " | "));
check("과목 칸은 영어 하나만", (await page.$$(".cbt-subj")).length === 1);
check("틀린 문제만 다시 풀기 버튼", !!(await page.$("#cbt-rewrong")));
await page.screenshot({ path: OUT + "cbt-3-result.png" });
await click("#cbt-list");
await page.waitForSelector(".cbt-stats", { visible: true });
check("목록에 성적 카드", (await text(".cbt-stats")).includes("고객서비스영어"));
check("최근 7일 막대 · 오늘 20문항", (await text(".cbt-week .today")).includes("20"), (await text(".cbt-week .today")).replace(/\n/g, " "));
check("모의고사 카드에 연속·오늘", (await text("#cbt-mock")).includes("연속 1일") && (await text("#cbt-mock")).includes("오늘 1회"), (await text("#cbt-mock")).replace(/\n/g, " "));
check("기출문제 묶음 제목", (await text(".cbt-past-head")).includes("기출문제"));
await click("#cbt-log");
await page.waitForSelector(".cbt-log-row", { visible: true });
const logDay = await text(".cbt-log-list[data-p=\"days\"] .cbt-log-row");
check("기록: 오늘 날짜 · 1회 · 20문항 · 10%", logDay.includes("1회") && logDay.includes("20문항") && logDay.includes("10%"), logDay.replace(/\n/g, " "));
await page.$$eval(".cbt-log-tabs button", (b) => b[1].click()); await wait(200);
const logTest = await text(".cbt-log-list[data-p=\"tests\"] .cbt-log-row");
check("기록: 시험 탭에 3과목 10점", logTest.includes("고객서비스영어") && logTest.includes("10점"), logTest.replace(/\n/g, " "));
await page.screenshot({ path: OUT + "cbt-5-log.png" });
await page.$eval(".sheet-close", (e) => e.click()); await wait(300);
check("오답노트 18문항", (await text("#cbt-wrongnote")).includes("18개"), (await text("#cbt-wrongnote")).replace(/\n/g, " "));
check("이어 풀기 카드는 사라짐", !(await page.$(".cbt-resume")));
await page.screenshot({ path: OUT + "cbt-4-home.png", fullPage: false });

// 4) 오답노트 학습 — 맞히면 빠진다
await click("#cbt-wrongnote"); await pickMode(true);
await page.waitForSelector(".cbt-q", { visible: true });
check("오답노트 18문항으로 시작", (await text("#cbt-count")).trim() === "0/18", await text("#cbt-count"));
await answer(true); await wait(300);
check("학습 모드: 해설 표시", !!(await page.$(".cbt-explain.ok")));
const wrongLeft = await page.evaluate(() => JSON.parse(localStorage.getItem("bartalk_cbtWrong")).length);
check("맞히자 오답노트 17개", wrongLeft === 17, String(wrongLeft));

// 5) 나가기 → 저장 → 새 시험 시작 시 경고
await click("#view-cbt .back-btn"); await yes(); await wait(400);
check("나가도 이어 풀기 남음", !!(await page.$(".cbt-resume")));
await click("#cbt-mock"); await wait(300);
check("새 시험 전에 경고", (await text(".bt-modal")).includes("풀던 시험이 있어요"));
await yes(); await pickMode(false);
await page.waitForSelector(".cbt-q", { visible: true });
check("모의고사 60문항 60분", (await text("#cbt-count")).trim() === "0/60" && /^(59|60):/.test(await text("#cbt-timer")));
const subj = await page.evaluate(() => { const c = [0, 0, 0]; /* 과목 배분 */ return JSON.parse(localStorage.getItem("bartalk_cbtRun")).refs.map((r) => +r.split("#")[1]).reduce((c, i) => { c[i < 30 ? 0 : i < 50 ? 1 : 2]++; return c; }, c); });
check("과목 배분 30·20·10", subj.join() === "30,20,10", subj.join());
// 미니 모의고사
await click("#view-cbt .back-btn"); await yes(); await wait(400);
await click("#cbt-mini"); await yes(); await pickMode(false);
await page.waitForSelector(".cbt-q", { visible: true });
check("미니 모의고사 30문항 30분", (await text("#cbt-count")).trim() === "0/30" && /^(29|30):/.test(await text("#cbt-timer")), (await text("#cbt-count")) + " " + (await text("#cbt-timer")));
const msubj = await page.evaluate(() => JSON.parse(localStorage.getItem("bartalk_cbtRun")).refs.map((r) => +r.split("#")[1]).reduce((c, i) => { c[i < 30 ? 0 : i < 50 ? 1 : 2]++; return c; }, [0, 0, 0]));
check("미니 배분 15·10·5", msubj.join() === "15,10,5", msubj.join());

// 6) 회차 그대로 — 최고 점수 기록
await click("#view-cbt .back-btn"); await yes(); await wait(400);
await click("#cbt-drop"); await yes(); await wait(300);
await page.$eval(".cbt-round", (b) => b.click()); await wait(300); await pickMode(false);
await page.waitForSelector(".cbt-q", { visible: true });
await answer(true); await click("#cbt-submit"); await yes();
await page.waitForSelector(".cbt-result", { visible: true });
check("회차 결과: 불합격 표시", (await text(".cbt-badge")).trim() === "불합격");
await click("#cbt-list"); await page.waitForSelector(".cbt-round", { visible: true });
check("회차에 최고 점수", (await text(".cbt-round")).includes("최고 2점"), (await text(".cbt-round")).replace(/\n/g, " "));

check("화면 오류 없음", errors.length === 0, errors.join(" / "));
console.log(fail ? `\n실패 ${fail}개` : "\n전부 통과");
await browser.close();
process.exit(fail ? 1 : 0);
