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
const VERSION = "2.9.0";
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

/* ---------- 앱을 꺼둬도 오는 알림 ----------
 * 앱이 떠 있어야만 알림이 온다면 그건 알림이 아닙니다.
 * 서비스워커는 앱이 닫혀 있어도 안드로이드가 깨워주므로 여기서 받습니다.
 *
 * 메시지 내용은 싣지 않습니다. 푸시 본문은 구글·애플의 서버를 지나가요.
 * "새 메시지가 왔다"까지만 알리고, 내용은 앱을 열어 확인하게 합니다.
 */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {}; }
  e.waitUntil(
    self.registration.showNotification(d.title || "바텐톡", {
      body: d.body || "새 메시지가 도착했어요.",
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: d.tag || "bartalk",       // 같은 대화의 알림은 겹쳐 쌓이지 않게
      renotify: true,
      data: { cid: d.cid || null },
    })
  );
});

// 알림을 누르면 이미 열려 있는 앱으로 가고, 없으면 새로 엽니다.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const cid = e.notification.data && e.notification.data.cid;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      try {
        if (new URL(w.url).origin !== self.location.origin) continue;
      } catch (err) { continue; }
      await w.focus();
      w.postMessage({ type: "open-chat", cid: cid });
      return;
    }
    await self.clients.openWindow(cid ? "./?chat=" + cid : "./");
  })());
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
