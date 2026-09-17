// 만든 영상을 크롬에서 재생해 여러 시점 장면을 한 장으로
import puppeteer from "puppeteer-core";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const buf = fs.readFileSync(OUT + "bartalk-demo.mp4");
const srv = http.createServer((q, r) => {
  if (q.url.startsWith("/v.mp4")) { r.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": buf.length }); return r.end(buf); }
  r.writeHead(200, { "Content-Type": "text/html" }); r.end("<body style='margin:0;background:#222'></body>");
}).listen(4199);
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 900 });
await p.goto("http://localhost:4199/");
const info = await p.evaluate(async () => {
  const v = document.createElement("video"); v.src = "/v.mp4"; v.muted = true; v.preload = "auto";
  await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error("video error")); });
  const dur = v.duration;
  const times = [1.5, 6, 16, 26, 36, 44, 52, 60, 70, dur - 1.0];
  const grid = document.createElement("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(5,236px);gap:4px;padding:4px";
  document.body.appendChild(grid);
  document.body.appendChild(v);
  v.playbackRate = 4;
  const left = [...times];
  await new Promise((resolve) => {
    const onFrame = (now, md) => {
      while (left.length && md.mediaTime >= left[0]) {
        const t = left.shift();
        const c = document.createElement("canvas"); c.width = 236; c.height = 420;
        c.getContext("2d").drawImage(v, 0, 0, 236, 420);
        const w = document.createElement("div"); w.style.cssText = "color:#fff;font:12px sans-serif"; w.append(c, document.createTextNode(md.mediaTime.toFixed(1) + "s"));
        grid.appendChild(w);
      }
      if (left.length && !v.ended) v.requestVideoFrameCallback(onFrame); else resolve();
    };
    v.requestVideoFrameCallback(onFrame);
    v.onended = resolve;
    v.play();
  });
  v.remove();
  return { dur, w: v.videoWidth, h: v.videoHeight };
});
await p.screenshot({ path: OUT + "verify.png", fullPage: true });
console.log(info);
await b.close(); srv.close();
