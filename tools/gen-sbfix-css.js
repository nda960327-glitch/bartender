/* 삼성 인터넷 강제 다크 모드 보호용 CSS 만들기
 *   node tools/gen-sbfix-css.js   →  css/style.css 맨 끝의 자동 생성 블록을 새로 씁니다
 *
 * 삼성 인터넷은 휴대폰 다크 모드일 때 사이트의 CSS 색을 멋대로 뒤집어요. (끌 방법이 없어요)
 * 대신 투명한 곳 없는 "그림"은 대개 그대로 둡니다. 그래서 삼성 인터넷에서만(html.sbfix)
 * 주황 강조색으로 칠하는 요소 위에 같은 색 그림(--accent-tile, js/app.js 가 만듦)을 덮어요.
 *
 * CSS 에 `background: var(--accent)` 를 새로 쓰면 이 스크립트를 한 번 다시 돌려주세요.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FILES = ["css/style.css", "css/deep.css"];
const START = "/* ==== 자동 생성: 삼성 인터넷 강제 다크 보호 (tools/gen-sbfix-css.js) ==== */";
const END = "/* ==== 자동 생성 끝 ==== */";

function selectorsWithAccentBg(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  // 가장 안쪽 규칙만: "선택자 { 선언 }" (선언 안에 { 가 없는 블록)
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[2];
    if (!/background\s*:\s*var\(--accent\)/.test(body)) continue;
    m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => {
      if (/^@|:root|^from$|^to$|^\d+%$/.test(s)) return;   // @규칙·루트·키프레임은 빼요
      out.push(s);
    });
  }
  return out;
}

const style = path.join(ROOT, "css/style.css");
let base = fs.readFileSync(style, "utf8").replace(/\r\n/g, "\n");
const at = base.indexOf(START);
if (at >= 0) base = base.slice(0, at).replace(/\n+$/, "\n");

const sels = new Set();
for (const f of FILES) selectorsWithAccentBg(fs.readFileSync(path.join(ROOT, f), "utf8")).forEach((s) => sels.add(s));
const list = [...sels].sort();

const rule = list.map((s) => "html.sbfix " + s).join(",\n") +
  " {\n  background-image: var(--accent-tile);\n  background-size: cover;\n  background-position: center;\n}";
const out = base + "\n" + START + "\n" + rule + "\n" + END + "\n";
fs.writeFileSync(style, out);
console.log("css/style.css 에 강조색 요소 " + list.length + "개 보호 규칙을 썼어요");
