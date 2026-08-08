/* 바텐톡 서비스 워커
 * 앱 셸: 캐시 우선(빠른 실행) + 백그라운드 갱신
 * 그 외:  네트워크 우선, 실패 시 캐시
 * ※ 배포할 때마다 VERSION 을 올려야 사용자 기기의 낡은 캐시가 정리돼요.
 */
const VERSION = "1.2.0";
const CACHE = "bartalk-v" + VERSION;

// 오프라인에서도 앱이 뜨도록 미리 받아두는 파일
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/deep.css",
  "./js/config.js",
  "./js/legal.js",
  "./js/sync.js",
  "./js/cocktail-deep.js",
  "./js/whisky-deep.js",
  "./js/app.js",
  "./manifest.json",
  "./icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // 하나라도 실패하면 설치가 통째로 실패하므로 개별로 담아요.
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

const isShell = (url) =>
  url.origin === self.location.origin &&
  SHELL.some((p) => url.pathname === new URL(p, self.location.href).pathname);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 페이지 이동: 네트워크 우선, 오프라인이면 캐시된 앱 셸
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // 앱 셸: 캐시 우선 + 백그라운드 갱신 (다음 실행부터 최신 반영)
  if (isShell(url)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const fresh = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // 그 외: 네트워크 우선, 실패 시 캐시
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
// - API 응답(위키·칵테일DB)은 앱이 결과를 자체 저장하므로 제외
// - 이미지 판별 모델 가중치(수 MB)는 없어도 앱이 동작하므로 제외
function shouldCache(url, res) {
  // opaque(cors 불가) 응답은 내용 검증이 안 되니 저장하지 않아요.
  if (!res || !res.ok || res.type === "opaque") return false;
  if (url.origin === self.location.origin) return true;

  if (/\/(api|w)\//.test(url.pathname) || url.pathname.endsWith(".php")) return false;
  if (url.hostname.includes("storage.googleapis.com")) return false;
  if (/\.bin$/.test(url.pathname)) return false;

  const type = res.headers.get("content-type") || "";
  return type.startsWith("image/") || type.startsWith("font/") || type.startsWith("text/css");
}
