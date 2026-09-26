/* 토스페이먼츠 카드사 심사용 "결제경로 파일"(빌링) 만들기
 *
 *   cd tools/payment-path && npm install
 *   npm run all        → 미리보기 캡처 + PPT
 *   npm run shots      → barapp.kr 공개 화면 미리보기 캡처만 (store/결제경로/미리보기/)
 *   npm run pptx       → PPT 만 다시 (store/결제경로/결제경로_스테인비밀의정원.pptx)
 *
 * 토스 가이드(홈페이지 결제경로 제작 가이드_정기결제용.pdf) 순서 그대로 슬라이드를 만들어요.
 *   ① 가맹점 정보(표지) ② 하단 사업자정보 ③ 환불규정 ④ 로그인 ⑤ 상품선택·구매과정 ⑥ 빌링 카드 입력창
 *
 * ⚠️ 카드사 심사는 "주소창에 barapp.kr 이 보이고 PC 시계가 함께 찍힌" 캡처를 요구해요.
 *    이 스크립트가 자동으로 찍는 미리보기는 페이지 내용만 있어서(주소창·시계 없음) 자리 표시용이에요.
 *    크롬에서 직접 Win+Shift+S 로 찍은 그림을 store/결제경로/캡처/ 에 아래 번호로 시작하는 이름으로 넣고
 *    npm run pptx 를 다시 돌리면 그 그림으로 바뀌어요.
 *      02-*.png 하단 사업자정보   03-*.png 환불규정   04-*.png 로그인 화면(비밀번호 칸)
 *      05-*.png 상품 안내 페이지   06-*.png 앱 가게 페이지 상품 목록(로그인 후)
 *      07-*.png 결제 확인 창(이용기간·자동결제 동의)   08-*.png 토스 빌링 카드 입력창
 *      09-*.png 결제 완료·내 패스(자동 갱신 해지 버튼)
 *    비밀번호는 프로젝트 루트 _review-account.md 에서 읽어 표지에 넣어요. 결과물 폴더는 커밋되지 않아요.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(ROOT, "store", "결제경로");
const PREVIEW = path.join(OUT, "미리보기");
const CAPTURE = path.join(OUT, "캡처");
const SITE = "https://barapp.kr";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const BIZ = {
  name: "스테인 비밀의정원", ceo: "노도아", regNo: "324-44-01175",
  address: "서울특별시 강남구 언주로98길 14, 지하1층(역삼동)", phone: "010-5604-1996",
  email: "nda960327@naver.com", mid: "bill_barapd8zg", testId: "review@barapp.kr",
};
function testPw() {
  try {
    const m = fs.readFileSync(path.join(ROOT, "_review-account.md"), "utf8").match(/^PW:\s*(\S+)/m);
    return m ? m[1] : "";
  } catch { return ""; }
}

/* ---------- 1. 미리보기 캡처 (공개 화면만 — 로그인 뒤 화면은 직접 찍어야 해요) ---------- */
async function shots() {
  const puppeteer = require("puppeteer-core");
  fs.mkdirSync(PREVIEW, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=ko-KR", "--font-render-hinting=none"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const shot = (name) => page.screenshot({ path: path.join(PREVIEW, name + ".png") });
    const settle = (ms) => new Promise((r) => setTimeout(r, ms));

    // 02 하단 사업자정보 (pass.html 맨 아래)
    await page.goto(SITE + "/pass.html", { waitUntil: "networkidle2" });
    await page.evaluate(() => document.getElementById("biz").scrollIntoView({ block: "center" }));
    await settle(300); await shot("02");
    // 05 상품 목록
    await page.evaluate(() => document.getElementById("plans").scrollIntoView({ block: "start" }));
    await settle(300); await shot("05");
    // 03 환불규정
    await page.goto(SITE + "/refund.html", { waitUntil: "networkidle2" });
    await page.evaluate(() => document.getElementById("doc").scrollIntoView({ block: "start" }));
    await settle(300); await shot("03");
    // 04 로그인 화면 — 이메일 칸 열고 비밀번호 칸까지 펼친 상태
    await page.goto(SITE + "/", { waitUntil: "networkidle2" });
    await settle(1500);
    await page.evaluate(() => { const t = document.getElementById("login-email-toggle"); if (t) t.click(); });
    await settle(200);
    await page.type("#login-email", BIZ.testId).catch(() => {});
    await page.evaluate(() => { const t = document.getElementById("login-pw-toggle"); if (t) t.click(); });
    await settle(500);
    await page.evaluate(() => { const b = document.getElementById("login-pw-box"); if (b) b.scrollIntoView({ block: "end" }); });
    await settle(300); await shot("04");
    console.log("미리보기 캡처 완료 →", PREVIEW);
  } finally { await browser.close(); }
}

/* ---------- 2. PPT ---------- */
function pickImage(no) {
  const two = String(no).padStart(2, "0");
  for (const dir of [CAPTURE, PREVIEW]) {
    if (!fs.existsSync(dir)) continue;
    const f = fs.readdirSync(dir).find((x) => x.startsWith(two) && /\.(png|jpe?g)$/i.test(x));
    if (f) return { file: path.join(dir, f), provisional: dir === PREVIEW };
  }
  return null;
}
function imageSize(file) {
  // PNG/JPEG 크기만 읽어요 (비율 유지용)
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return { w: 16, h: 9 };
}

const STEPS = [
  { no: 2, tag: "② 하단 정보 캡처", title: "홈페이지 하단 사업자정보",
    caption: "상품 안내 페이지(barapp.kr/pass.html)와 이용약관·환불규정·개인정보처리방침 하단에 사업자등록증과 동일하게 기재",
    need: "크롬에서 https://barapp.kr/pass.html 을 열고 맨 아래 '사업자 정보' 상자가 보이게 캡처",
    facts: ["상호명 " + BIZ.name, "대표자명 " + BIZ.ceo, "사업자등록번호 " + BIZ.regNo, "사업장주소 " + BIZ.address, "유선전화번호 " + BIZ.phone, "통신판매업신고번호 — 신고 진행 중(신고 즉시 추가 기재)"] },
  { no: 3, tag: "③ 환불규정 캡처 (무형 상품)", title: "환불·해지 규정",
    caption: "https://barapp.kr/refund.html — 시작 전 전액, 시작 후 일할 환불(이미 마신 잔·위약금 10% 이내 공제), 자동결제 후 7일 미이용 시 전액, 영업일 3일 내 결제수단으로 환불",
    need: "크롬에서 https://barapp.kr/refund.html 을 열고 '1. 상품과 이용기간'~'3. 이용 시작 후 해지·환불'이 보이게 캡처" },
  { no: 4, tag: "④ 로그인 캡처", title: "로그인 (테스트 계정)",
    caption: "barapp.kr → '이메일로 시작하기' → 이메일 입력 → '비밀번호가 있는 계정' → 비밀번호 입력 → 로그인. 비회원 구매는 불가(만 19세 확인 때문)",
    need: "크롬에서 https://barapp.kr 을 열고 이메일 칸에 " + BIZ.testId + " 를 넣고 '비밀번호가 있는 계정'을 눌러 비밀번호 칸이 보이는 상태로 캡처" },
  { no: 5, tag: "⑤ 상품 선택 / 구매과정 캡처 (1/4)", title: "상품 안내 — 정기결제 상품과 가격·이용기간",
    caption: "라이트 39,000 / 스타터 119,000 / 스탠다드 159,000 / 프리미엄 219,000 / 팀 패스 399,000원 — 30일 단위 자동결제. 상품마다 이용기간(결제일부터 30일)과 자동결제 안내 표기",
    need: "크롬에서 https://barapp.kr/pass.html 의 '1. 상품 구성과 가격' 카드들이 보이게 캡처" },
  { no: 6, tag: "⑤ 상품 선택 / 구매과정 캡처 (2/4)", title: "앱 가게 페이지 — 상품 선택",
    caption: "로그인 후 하단 '바' 탭 → '스테인 비밀의정원' → 하우스 패스 상품 목록에서 상품을 선택",
    need: "로그인한 뒤 가게 '스테인 비밀의정원' 페이지의 하우스 패스 상품 목록이 보이게 캡처" },
  { no: 7, tag: "⑤ 상품 선택 / 구매과정 캡처 (3/4)", title: "결제 확인 — 이용기간·자동결제 동의",
    caption: "상품을 누르면 뜨는 확인 창: 상품명·금액·'오늘 결제 후 매달 같은 날 같은 카드로 자동 결제, 언제든 해지' 안내와 환불 규정 요약을 확인하고 동의",
    need: "상품을 누른 뒤 뜨는 결제 확인 창(자동결제 안내 문구)이 보이게 캡처" },
  { no: 8, tag: "⑥ 카드 결제경로 캡처", title: "토스페이먼츠 빌링 카드 입력창",
    caption: "확인을 누르면 토스페이먼츠 정기결제용 카드 입력창(requestBillingAuth)이 열림 → 카드 등록 → 빌링키 발급 → 첫 회 결제. 현재 테스트 클라이언트 키로 연동",
    need: "결제 확인 창에서 진행을 눌러 토스페이먼츠 '카드 정보를 입력해주세요' 창이 뜬 상태로 캡처 (카드번호는 입력하지 않아도 됨)" },
  { no: 9, tag: "⑤ 상품 선택 / 구매과정 캡처 (4/4)", title: "결제 완료 — 내 패스와 자동 갱신 해지",
    caption: "결제 후 '내 패스' 화면: 이용기간, 남은 잔 수, 등록 카드, '자동 갱신 끄기'와 '환불·해지 규정 보기' 버튼",
    need: "테스트 결제를 마친 뒤 '내 패스' 화면(자동 갱신 끄기 버튼이 보이는 상태)을 캡처" },
];

function buildPptx() {
  const pptxgen = require("pptxgenjs");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";            // 13.33 × 7.5
  pres.title = "결제경로 (빌링) — " + BIZ.name;
  const FONT = "Malgun Gothic";
  const C = { ink: "191F28", sub: "6B7684", blue: "3182F6", pale: "E8F3FF", line: "E5E8EB", warn: "F04452", warnPale: "FFF1F1" };
  const pw = testPw();
  const today = new Date().toISOString().slice(0, 10);

  // 표지 — ① 가맹점 정보 기재
  {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText("① 가맹점 정보 기재", { x: 5.17, y: 0.35, w: 3, h: 0.42, fill: { color: C.blue }, color: "FFFFFF", fontFace: FONT, fontSize: 14, bold: true, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText("홈페이지 결제경로 파일 (빌링 · 정기결제)", { x: 0.7, y: 1.1, w: 11.9, h: 0.8, fontFace: FONT, fontSize: 30, bold: true, color: C.ink, align: "center", isTextBox: true, margin: 0 });
    s.addText("바텐톡 하우스 패스 — 동네 바 월정액 이용권", { x: 0.7, y: 1.9, w: 11.9, h: 0.5, fontFace: FONT, fontSize: 16, color: C.sub, align: "center", isTextBox: true, margin: 0 });
    const rows = [
      ["(1) 상호명", BIZ.name], ["(2) 사업자번호", BIZ.regNo], ["(3) URL", SITE + "  (상품 " + SITE + "/pass.html)"],
      ["(4) Test ID", BIZ.testId], ["(5) Test PW", pw || "[ _review-account.md 의 PW 를 넣으세요 ]"],
      ["(6) MID", BIZ.mid], ["(7) 담당자", BIZ.ceo + " · " + BIZ.phone + " · " + BIZ.email],
    ];
    s.addShape(pres.ShapeType.roundRect, { x: 2.4, y: 2.7, w: 8.5, h: 3.9, fill: { color: "F9FAFB" }, line: { color: C.line, width: 1 }, rectRadius: 0.15 });
    rows.forEach((r, i) => {
      const y = 2.95 + i * 0.52;
      s.addText(r[0], { x: 2.8, y, w: 2.2, h: 0.45, fontFace: FONT, fontSize: 15, bold: true, color: C.blue, valign: "middle", isTextBox: true, margin: 0 });
      s.addText(": " + r[1], { x: 5.0, y, w: 5.7, h: 0.45, fontFace: FONT, fontSize: 15, color: C.ink, valign: "middle", isTextBox: true, margin: 0 });
    });
    s.addText("작성일 " + today + " · 로그인 방법: " + SITE + " → 이메일로 시작하기 → 이메일 입력 → '비밀번호가 있는 계정' → 비밀번호 → 로그인", { x: 0.7, y: 6.8, w: 11.9, h: 0.4, fontFace: FONT, fontSize: 11, color: C.sub, align: "center", isTextBox: true, margin: 0 });
  }

  // 결제경로 순서 요약
  {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText("결제경로 순서", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: C.ink, isTextBox: true, margin: 0 });
    s.addText("무형 상품(매장 이용권) · 회원만 구매 가능 · 정기결제(빌링) + 1회 결제 병행", { x: 0.7, y: 1.2, w: 12, h: 0.4, fontFace: FONT, fontSize: 13, color: C.sub, isTextBox: true, margin: 0 });
    const flow = ["홈페이지 하단\n사업자정보", "환불·해지\n규정", "로그인\n(테스트 계정)", "상품 안내 →\n가게 페이지 상품 선택", "결제 확인\n(이용기간·자동결제 동의)", "토스 빌링\n카드 입력창", "결제 완료\n내 패스 · 해지"];
    flow.forEach((t, i) => {
      const x = 0.7 + i * 1.72;
      s.addShape(pres.ShapeType.roundRect, { x, y: 2.3, w: 1.55, h: 1.5, fill: { color: i === 5 ? C.blue : C.pale }, line: { color: i === 5 ? C.blue : C.pale, width: 0 }, rectRadius: 0.12 });
      s.addText(String(i + 1), { x, y: 2.38, w: 1.55, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: i === 5 ? "FFFFFF" : C.blue, align: "center", isTextBox: true, margin: 0 });
      s.addText(t, { x: x + 0.05, y: 2.7, w: 1.45, h: 1.0, fontFace: FONT, fontSize: 11.5, bold: true, color: i === 5 ? "FFFFFF" : C.ink, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    });
    const notes = [
      "상품: 하우스 패스(월정액 매장 이용권). 정기결제 상품 5종(39,000~399,000원/30일), 1회 결제 상품 2종(원데이 19,000원/1일, 3개월권 429,000원/90일). 단건 최고가 478,800원(팀 패스 1회 결제).",
      "정기결제: 결제일 기준 30일마다 같은 카드로 자동 결제. '내 패스 > 자동 갱신 끄기'로 언제든 해지, 해지 시 다음 결제부터 중단.",
      "제공: 배송 없음. 판매자 매장(" + BIZ.address + ")에서 앱 QR로 입장·잔 사용 기록. 만 19세 이상만 구매.",
      "연동: 토스페이먼츠 빌링 SDK(requestBillingAuth) → 빌링키 발급 API → 빌링키 결제 API를 홈페이지에 직접 연동(호스팅사 없음). 캡처는 테스트 클라이언트 키 기준.",
    ];
    s.addText(notes.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < notes.length - 1, paraSpaceAfter: 8 } })), { x: 0.7, y: 4.2, w: 12, h: 2.8, fontFace: FONT, fontSize: 13, color: C.ink, valign: "top", isTextBox: true });
  }

  // 단계별 캡처 슬라이드
  for (const st of STEPS) {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(st.tag, { x: 4.67, y: 0.25, w: 4, h: 0.42, fill: { color: C.blue }, color: "FFFFFF", fontFace: FONT, fontSize: 13, bold: true, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(st.title, { x: 0.6, y: 0.8, w: 12.1, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.ink, align: "center", isTextBox: true, margin: 0 });
    s.addText(st.caption, { x: 0.9, y: 1.3, w: 11.5, h: 0.55, fontFace: FONT, fontSize: 11.5, color: C.sub, align: "center", valign: "top", isTextBox: true, margin: 0 });

    const box = { x: 0.6, y: 1.95, w: st.facts ? 8.4 : 12.1, h: 5.2 };
    const img = pickImage(st.no);
    if (img) {
      const sz = imageSize(img.file);
      const r = Math.min(box.w / sz.w, box.h / sz.h);
      const w = sz.w * r, h = sz.h * r;
      s.addImage({ path: img.file, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h });
      if (img.provisional) {
        s.addText("자리 표시용 미리보기 — 주소창·PC 시계가 보이는 크롬 캡처(" + String(st.no).padStart(2, "0") + "-*.png)로 바꾸세요", { x: box.x, y: box.y + box.h + 0.02, w: box.w, h: 0.3, fontFace: FONT, fontSize: 9.5, color: C.warn, align: "center", isTextBox: true, margin: 0 });
      }
    } else {
      s.addShape(pres.ShapeType.roundRect, { x: box.x, y: box.y, w: box.w, h: box.h, fill: { color: C.warnPale }, line: { color: C.warn, width: 1, dashType: "dash" }, rectRadius: 0.1 });
      s.addText([
        { text: "캡처 " + String(st.no).padStart(2, "0") + " 을 여기에 넣으세요", options: { bold: true, fontSize: 16, breakLine: true } },
        { text: "\n" + st.need, options: { fontSize: 12.5, breakLine: true } },
        { text: "\n주소창에 barapp.kr 이 보이고 작업표시줄 시계가 함께 나오게 · 북마크바는 숨기고 · 저장 위치 store/결제경로/캡처/" + String(st.no).padStart(2, "0") + "-이름.png", options: { fontSize: 11, color: C.sub } },
      ], { x: box.x + 0.4, y: box.y + 0.3, w: box.w - 0.8, h: box.h - 0.6, fontFace: FONT, color: C.ink, align: "center", valign: "middle", isTextBox: true });
    }
    if (st.facts) {
      s.addShape(pres.ShapeType.roundRect, { x: 9.2, y: 1.95, w: 3.5, h: 5.2, fill: { color: "F9FAFB" }, line: { color: C.line, width: 1 }, rectRadius: 0.12 });
      s.addText("필수 구성항목 (사업자등록증과 동일)", { x: 9.4, y: 2.1, w: 3.1, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: C.blue, isTextBox: true, margin: 0 });
      s.addText(st.facts.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < st.facts.length - 1, paraSpaceAfter: 6 } })), { x: 9.4, y: 2.55, w: 3.15, h: 4.5, fontFace: FONT, fontSize: 11.5, color: C.ink, valign: "top", isTextBox: true });
    }
    s.addText(String(st.no).padStart(2, "0"), { x: 12.5, y: 7.05, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 9, color: C.sub, align: "right", isTextBox: true, margin: 0 });
  }

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, "결제경로_스테인비밀의정원.pptx");
  return pres.writeFile({ fileName: file }).then(() => {
    const missing = STEPS.filter((st) => !pickImage(st.no)).map((st) => st.no);
    const prov = STEPS.filter((st) => { const i = pickImage(st.no); return i && i.provisional; }).map((st) => st.no);
    console.log("PPT 저장 →", file);
    if (prov.length) console.log("자리 표시용 미리보기가 들어간 슬라이드:", prov.join(", "), "→ store/결제경로/캡처/ 에 크롬 캡처를 넣고 npm run pptx");
    if (missing.length) console.log("아직 그림이 없는 슬라이드(직접 캡처 필요):", missing.join(", "));
  });
}

const args = process.argv.slice(2);
const doShots = args.includes("--shots") || args.length === 0;
const doPptx = args.includes("--pptx") || args.length === 0;
if (doShots) await shots().catch((e) => console.error("미리보기 캡처 실패 (PPT 는 계속 만들어요):", e.message));
if (doPptx) await buildPptx();
