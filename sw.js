/* 바텐톡 서비스 워커
 *
 * 정책
 *   앱 파일(HTML·JS·CSS·매니페스트) : 네트워크 우선  → 항상 최신을 보여줍니다
 *   아이콘·글꼴·이미지                : 캐시 우선      → 바뀌지 않으니 빠르게
 *   오프라인                          : 캐시로 대체    → 인터넷이 없어도 앱이 뜹니다
 *
 * 예전에는 앱 파일도 캐시 우선이었습니다. 그러면 사용자는 늘 "한 버전 뒤처진"
 * 화면을 보게 되고, 새로고침해야 그제야 이전에 받아둔 버전이 뜹니다.
 * 커뮤니티 앱에서는 치명적이라 네트워크 우선으로 바꿨습니다.
 * 첫 화면이 아주 조금 느려지지만 파일이 작아 체감되지 않습니다.
 */
const VERSION = "2.5.2";
const CACHE = "bartalk-v" + VERSION;

// 오프라인에서도 앱이 뜨도록 미리 받아두는 파일
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/deep.css",
  "./css/char.css",
  "./js/config.js",
  "./js/legal.js",
  "./js/sync.js",
  "./js/sfx.js",
  "./js/char.js",
  "./js/app.js",
  // 심층 도감 데이터(cocktail-deep.js / whisky-deep.js)는 셸에서 뺐어요.
  // 설치할 때 500KB 를 같이 받으면 첫 방문이 느려지고, 어차피 도감에 들어가면
  // 아래 규칙으로 저장돼 오프라인에서도 동작합니다.
  "./manifest.json",
  "./icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// 내용이 바뀌지 않는 자산 — 캐시 우선으로 빠르게
const IMMUTABLE = /\/icons\/|\.(png|jpg|jpeg|webp|svg|woff2?)$/i;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 앱이 "지금 당장 새 버전으로 바꿔줘" 라고 요청할 때
self.addEventListener("message", (e) => {
  if (e.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 바뀌지 않는 자산: 캐시 우선
  if (IMMUTABLE.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok && res.type !== "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // 앱 파일과 페이지 이동: 네트워크 우선 → 실패하면 캐시
  if (url.origin === self.location.origin || req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // 외부 요청: 네트워크 우선, 캐시는 오프라인 대비용
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (shouldCache(url, res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// 캐시가 무한정 커지지 않도록, 오프라인에서 실제로 쓸모 있는 것만 저장해요.
function shouldCache(url, res) {
  if (!res || !res.ok || res.type === "opaque") return false;
  if (/\/(api|w)\//.test(url.pathname) || url.pathname.endsWith(".php")) return false;
  if (url.hostname.includes("storage.googleapis.com")) return false;
  if (/\.bin$/.test(url.pathname)) return false;
  const type = res.headers.get("content-type") || "";
  return type.startsWith("image/") || type.startsWith("font/") || type.startsWith("text/css");
}
