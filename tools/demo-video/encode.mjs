// capture.json → out/bartalk-demo.mp4
// 크롬의 WebCodecs(H.264)로 한 장면씩 인코딩하고 mp4-muxer 로 표준 MP4(빠른 시작)로 묶어요.
import puppeteer from "puppeteer-core";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const MUXER = fileURLToPath(new URL("./node_modules/mp4-muxer/build/mp4-muxer.js", import.meta.url));
const cap = JSON.parse(fs.readFileSync(OUT + "capture.json", "utf8"));
const FPS = 30;

const srv = http.createServer((q, r) => {
  if (q.url.startsWith("/frame/")) {
    const i = +q.url.slice(7);
    r.writeHead(200, { "Content-Type": "image/jpeg" });
    return r.end(Buffer.from(cap.frames[i].data, "base64"));
  }
  if (q.url === "/muxer.js") { r.writeHead(200, { "Content-Type": "application/javascript" }); return r.end(fs.readFileSync(MUXER)); }
  r.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  r.end(`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script src="/muxer.js"></script></head><body style="margin:0;background:#000"><canvas id="c" width="720" height="1280"></canvas>
<p style="position:absolute;opacity:0;font-family:'Pretendard Variable'">바텐톡 하우스 패스 시연용 예시 데이터 가나다 0123</p></body></html>`);
}).listen(4198);

const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
p.on("console", (m) => console.log("[page]", m.text()));
await p.goto("http://localhost:4198/", { waitUntil: "networkidle0" });

const meta = { T0: cap.T0, T1: cap.T1, captions: cap.captions, times: cap.frames.map((f) => f.t), FPS };
const res = await p.evaluate(async (meta) => {
  await document.fonts.ready;
  await document.fonts.load('800 40px "Pretendard Variable"'); await document.fonts.load('500 24px "Pretendard Variable"');
  const c = document.getElementById("c"), g = c.getContext("2d");
  const W = 720, H = 1280, FONT = '"Pretendard Variable", "Malgun Gothic", sans-serif';
  const { T0, T1, captions, times, FPS } = meta;

  const codec = "avc1.640028";
  const support = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 4_000_000, framerate: FPS });
  if (!support.supported) throw new Error("H.264 인코더를 쓸 수 없어요");
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, fastStart: "in-memory" });
  let encErr = null;
  let chunks = 0, keys = 0, bytes = 0; const snaps = {};
  const enc = new VideoEncoder({ output: (chunk, m) => { chunks++; bytes += chunk.byteLength; if (chunk.type === "key") keys++; muxer.addVideoChunk(chunk, m); }, error: (e) => (encErr = e) });
  enc.configure({ codec, width: W, height: H, bitrate: 4_000_000, framerate: FPS, avc: { format: "avc" } });

  // 장면 그림 (필요할 때만 불러와서 메모리를 아껴요)
  const cache = new Map();
  async function frameImg(i) {
    if (cache.has(i)) return cache.get(i);
    const blob = await (await fetch("/frame/" + i)).blob();
    const bmp = await createImageBitmap(blob);
    cache.set(i, bmp);
    for (const k of cache.keys()) if (k < i - 2) { cache.get(k).close(); cache.delete(k); }
    return bmp;
  }
  const idxAt = (t) => { let lo = 0, hi = times.length - 1, ans = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (times[m] <= t) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; };

  const bg = () => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#241813"); gr.addColorStop(1, "#0c0a09"); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const phone = { w: 452, h: 978, x: (W - 452) / 2, y: 128 };
  function card(title, lines, a) {
    bg();
    g.globalAlpha = Math.max(0, Math.min(1, a));
    const gr = g.createLinearGradient(W / 2 - 64, 360, W / 2 + 64, 488); gr.addColorStop(0, "#ff5c35"); gr.addColorStop(1, "#ff8ad4");
    g.fillStyle = gr; rr(W / 2 - 64, 360, 128, 128, 36); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(W / 2, 382); g.lineTo(W / 2 + 26, 432); g.arc(W / 2, 440, 30, -0.35, Math.PI + 0.35); g.closePath(); g.fill();
    g.textAlign = "center";
    g.fillStyle = "#fff"; g.font = `800 64px ${FONT}`; g.fillText(title, W / 2, 600);
    g.font = `500 30px ${FONT}`; g.fillStyle = "#f1dcd2";
    lines.forEach((l, i) => g.fillText(l, W / 2, 664 + i * 46));
    g.globalAlpha = 1; g.textAlign = "left";
  }
  function captionAt(t) { let cur = null; for (const k of captions) if (k.t <= t) cur = k; return cur; }
  async function drawApp(t) {
    bg();
    g.fillStyle = "#ff8a6a"; g.font = `700 24px ${FONT}`; g.fillText("바텐톡 · 하우스 패스", 40, 66);
    g.fillStyle = "#9c867c"; g.font = `500 19px ${FONT}`; g.textAlign = "right"; g.fillText("시연용 예시 데이터", W - 40, 66); g.textAlign = "left";
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 44; g.shadowOffsetY = 18;
    g.fillStyle = "#050505"; rr(phone.x - 12, phone.y - 12, phone.w + 24, phone.h + 24, 58); g.fill(); g.restore();
    g.save(); rr(phone.x, phone.y, phone.w, phone.h, 46); g.clip();
    g.drawImage(await frameImg(idxAt(t)), phone.x, phone.y, phone.w, phone.h);
    g.restore();
    const k = captionAt(t);
    if (k && k.text) {
      const a = Math.min(1, (t - k.t) / 0.25), lift = (1 - a) * 14;
      g.globalAlpha = a;
      g.fillStyle = "rgba(255,92,53,.97)"; rr(36, 1128 + lift, W - 72, 122, 28); g.fill();
      g.fillStyle = "#fff"; g.font = `800 36px ${FONT}`; g.fillText(k.text, 66, 1180 + lift);
      g.font = `500 25px ${FONT}`; g.fillStyle = "#fff3ee"; g.fillText(k.sub, 66, 1224 + lift);
      g.globalAlpha = 1;
    }
  }

  const INTRO = 3.2, OUTRO = 3.2, BODY = T1 - T0;
  const total = INTRO + BODY + OUTRO, N = Math.round(total * FPS);
  for (let n = 0; n < N; n++) {
    const el = n / FPS;
    if (el < INTRO) card("바텐톡", ["동네 바를 구독하세요", "월정액 패스 · QR 입장 · 매출 관리"], Math.min(el / 0.5, (INTRO - el) / 0.4));
    else if (el < INTRO + BODY) await drawApp(T0 + (el - INTRO));
    else card("barapp.kr", ["안 오던 손님을", "매달 오는 단골로"], (el - INTRO - BODY) / 0.5);
    if ([45, 400, 1500].includes(n)) snaps[n] = c.toDataURL("image/jpeg", 0.6);
    const vf = new VideoFrame(c, { timestamp: Math.round(n * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(vf, { keyFrame: n % (FPS * 2) === 0 });
    vf.close();
    if (enc.encodeQueueSize > 10) await new Promise((r) => setTimeout(r, 5));
    if (encErr) throw encErr;
    if (n % 300 === 0) console.log(`frame ${n}/${N}`);
  }
  await enc.flush();
  muxer.finalize();
  const buf = new Uint8Array(muxer.target.buffer);
  let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  console.log(`chunks ${chunks} keys ${keys} bytes ${bytes}`);
  return { data: btoa(s), frames: N, seconds: total, snaps };
}, meta);
fs.writeFileSync(OUT + "bartalk-demo.mp4", Buffer.from(res.data, "base64"));
for (const [n, d] of Object.entries(res.snaps || {})) fs.writeFileSync(OUT + `snap-${n}.jpg`, Buffer.from(d.split(",")[1], "base64"));
console.log("saved bartalk-demo.mp4", res.frames, "frames", res.seconds.toFixed(1) + "s", (fs.statSync(OUT + "bartalk-demo.mp4").size / 1e6).toFixed(1) + "MB");
await b.close(); srv.close();
