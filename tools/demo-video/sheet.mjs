// 점검 스크린샷을 한 장으로 모아 보기 (contact sheet)
import puppeteer from "puppeteer-core";
import fs from "fs";
import { fileURLToPath } from "url";
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(OUT).filter((f) => /^check-\d+\.png$/.test(f)).sort();
const pick = process.argv[2] ? process.argv[2].split(",").map((n) => `check-${n.padStart(2, "0")}.png`) : files;
const imgs = pick.map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(OUT + f).toString("base64")}"><figcaption>${f}</figcaption></figure>`).join("");
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
const cols = Math.min(4, pick.length);
await p.setViewport({ width: cols * 300, height: 700 });
await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},300px);background:#222;font:12px sans-serif;color:#fff">${imgs}</body><style>figure{margin:4px}img{width:292px;display:block}</style>`);
await p.screenshot({ path: OUT + "sheet.png", fullPage: true });
await b.close();
console.log("sheet.png");
