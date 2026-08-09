/* ============================================================
 *  바텐톡 동기화 계층
 *
 *  설계 원칙
 *   1. 화면은 항상 로컬 데이터로 즉시 그린다 (기존 렌더 코드 그대로).
 *   2. 서버 데이터는 뒤늦게 도착해 로컬을 덮어쓰고 다시 그린다.
 *   3. 쓰기는 로컬에 먼저 반영하고(낙관적), 서버 전송은 큐로 재시도한다.
 *   4. 설정이 비어 있거나 서버에 못 붙으면 앱은 오프라인 모드로 계속 동작한다.
 *
 *  app.js 는 이 파일의 shape(앱 형식 객체)만 알면 되고
 *  DB 컬럼 이름은 전부 여기서 변환합니다.
 * ============================================================ */
(function () {
  "use strict";

  var CFG = window.BARTALK_CONFIG || {};
  var SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  var QUEUE_KEY = "bartalk_syncq";
  var MAX_QUEUE = 200;

  var S = {
    enabled: !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY),
    status: "off",     // off | connecting | online | offline | error
    uid: null,
    error: null,
    isAdmin: false,    // 서버가 판정. 앱에서 조작해도 서버가 거부해요.
    identity: null,    // { id, email, provider, suggestedNick }
    providers: null,   // { google: true, kakao: false, ... } — 서버에서 켜진 로그인 방법
    naverReady: false, // 네이버 로그인 함수가 배포·설정돼 있는지
  };

  var sb = null;              // supabase client
  var onData = function () {};
  var onStatus = function () {};
  var onAuth = function () {};
  var queue = [];
  var flushing = false;
  var pullTimer = null;

  /* ---------- 상태 ---------- */
  function setStatus(s, err) {
    if (S.status === s && !err) return;
    S.status = s;
    S.error = err || null;
    try { onStatus(s, err); } catch (e) {}
  }

  /* ---------- 재시도 큐 ---------- */
  function loadQueue() {
    try { queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
    catch (e) { queue = []; }
  }
  function saveQueue() {
    try {
      if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
  }
  function enqueue(job) {
    queue.push(job);
    saveQueue();
    flush();
  }

  async function flush() {
    if (flushing || !sb || !S.uid || !queue.length) return;
    flushing = true;
    try {
      while (queue.length) {
        var job = queue[0];
        var ok = await runJob(job);
        if (!ok) break;            // 네트워크 문제로 보고 다음 기회에 재시도
        queue.shift();
        saveQueue();
      }
      if (!queue.length) setStatus("online");
    } finally {
      flushing = false;
    }
  }

  async function runJob(job) {
    try {
      var q = sb.from(job.table);
      var res;
      if (job.op === "upsert") res = await q.upsert(job.row);
      else if (job.op === "insert") res = await q.insert(job.row);
      else if (job.op === "delete") res = await q.delete().match(job.match);
      else if (job.op === "update") res = await q.update(job.row).match(job.match);
      else return true;          // 알 수 없는 작업은 버림

      if (res.error) {
        // RLS 위반·중복키 등은 재시도해도 소용없으니 큐에서 제거
        var code = res.error.code || "";
        var permanent = ["23505", "23503", "23514", "42501", "22P02", "PGRST116"];
        if (permanent.indexOf(code) >= 0) {
          console.warn("[sync] 건너뜀:", job.table, code, res.error.message);
          return true;
        }
        setStatus("offline");
        return false;
      }
      return true;
    } catch (e) {
      setStatus("offline");
      return false;
    }
  }

  /* ---------- 사진 업로드 ---------- */
  function dataUrlToBlob(dataUrl) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
    if (!m) return null;
    var bin = atob(m[2]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  }

  // base64 사진을 Storage 에 올리고 공개 URL 을 돌려줘요.
  // 실패하면 null → 호출 쪽에서 사진 없이 진행합니다.
  async function uploadPhoto(dataUrl) {
    if (!sb || !S.uid || !dataUrl || dataUrl.indexOf("data:") !== 0) return null;
    var blob = dataUrlToBlob(dataUrl);
    if (!blob) return null;
    var ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    var path = S.uid + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    try {
      var up = await sb.storage.from("photos").upload(path, blob, {
        contentType: blob.type, cacheControl: "31536000", upsert: false,
      });
      if (up.error) return null;
      return sb.storage.from("photos").getPublicUrl(path).data.publicUrl || null;
    } catch (e) { return null; }
  }

  // 사진이 base64 면 업로드해서 URL 로 바꿔치기 (로컬 객체도 함께 갱신)
  async function resolveImg(localObj) {
    if (!localObj || !localObj.img || localObj.img.indexOf("data:") !== 0) {
      return localObj ? localObj.img || null : null;
    }
    var url = await uploadPhoto(localObj.img);
    if (url) localObj.img = url;   // localStorage 용량도 아껴져요
    return url;
  }

  /* ---------- 형식 변환: DB → 앱 ---------- */
  var t = function (iso) { return iso ? Date.parse(iso) : Date.now(); };

  function toAppComment(row) {
    return {
      id: Number(row.id),
      cid: Number(row.id),
      authorId: row.author_id,
      color: row.color,
      text: row.text,
      img: row.img || undefined,
      time: t(row.created_at),
      mine: row.author_id === S.uid,
      remote: true,
      replies: [],
    };
  }

  function toAppPost(row, comments, likedIds) {
    var mine = row.author_id === S.uid;
    var p = {
      id: Number(row.id),
      authorId: row.author_id,
      cat: row.cat,
      color: row.color,
      nick: row.nick || "익명",
      time: t(row.created_at),
      title: row.title,
      body: row.body || "",
      likes: row.like_count || 0,
      likedByMe: likedIds.has(Number(row.id)),
      comments: comments || [],
      views: row.views || 0,
      mine: mine,
      remote: true,
    };
    if (row.emoji) p.emoji = row.emoji;
    if (row.img) p.img = row.img;
    if (row.biz) p.biz = row.biz;
    if (row.contact) p.contact = row.contact;
    if (row.edited) p.edited = true;
    if (row.boost_until) p.boostUntil = t(row.boost_until);
    return p;
  }

  function toAppMeet(row, participants, comments) {
    var joined = participants.filter(function (x) { return x.meet_id === row.id; });
    return {
      id: Number(row.id),
      authorId: row.host_id,
      region: row.region,
      title: row.title,
      desc: row.descr || "",
      place: row.place || "",
      date: t(row.meet_at),
      max: row.max_people,
      joined: joined.length,
      isJoined: joined.some(function (x) { return x.user_id === S.uid; }),
      host: row.host_id === S.uid ? "익명(나)" : "익명",
      hostColor: row.host_color,
      mine: row.host_id === S.uid,
      comments: comments || [],
      remote: true,
    };
  }

  function toAppSpirit(row, reviews) {
    var s = {
      id: Number(row.id),
      authorId: row.author_id,
      kind: row.kind,
      emoji: row.emoji,
      name: row.name,
      abv: Number(row.abv),
      note: row.note || "",
      by: row.author_id === S.uid ? "익명(나)" : "익명",
      time: t(row.created_at),
      reviews: reviews || [],
      mine: row.author_id === S.uid,
      remote: true,
    };
    if (row.img) s.img = row.img;
    if (row.kind === "spirit") { s.cat = row.cat || "기타"; s.price = row.price || ""; }
    else { s.base = row.base || "기타"; s.ings = row.ings || ""; s.recipe = row.recipe || ""; }
    return s;
  }

  function toAppReview(row) {
    return {
      id: Number(row.id),
      authorId: row.author_id,
      stars: row.stars,
      text: row.text || "",
      color: row.color,
      img: row.img || undefined,
      time: t(row.created_at),
      mine: row.author_id === S.uid,
    };
  }

  /* ---------- 서버에서 가져오기 ---------- */
  async function pullPosts() {
    var lim = CFG.LIMIT_POSTS || 300;
    var res = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(lim);
    if (res.error) throw res.error;
    var rows = res.data || [];
    if (!rows.length) return [];

    var ids = rows.map(function (r) { return r.id; });
    var cRes = await sb.from("comments").select("*").in("post_id", ids).order("created_at");
    var lRes = await sb.from("likes").select("post_id").eq("user_id", S.uid);

    var byPost = {};
    (cRes.data || []).forEach(function (row) {
      (byPost[row.post_id] = byPost[row.post_id] || []).push(row);
    });
    var likedIds = new Set((lRes.data || []).map(function (r) { return Number(r.post_id); }));

    return rows.map(function (r) {
      var flat = byPost[r.id] || [];
      var tops = [], byId = {};
      flat.forEach(function (row) {
        var c = toAppComment(row);
        byId[c.id] = c;
        if (!row.parent_id) tops.push(c);
      });
      // 대댓글을 부모에 붙여요 (부모가 지워졌으면 최상위로 승격)
      flat.forEach(function (row) {
        if (!row.parent_id) return;
        var parent = byId[Number(row.parent_id)];
        if (parent) parent.replies.push(byId[Number(row.id)]);
        else tops.push(byId[Number(row.id)]);
      });
      return toAppPost(r, tops, likedIds);
    });
  }

  async function pullMeets() {
    var lim = CFG.LIMIT_MEETS || 100;
    var res = await sb.from("meets").select("*").order("meet_at", { ascending: true }).limit(lim);
    if (res.error) throw res.error;
    var rows = res.data || [];
    if (!rows.length) return [];

    var ids = rows.map(function (r) { return r.id; });
    var pRes = await sb.from("meet_participants").select("*").in("meet_id", ids);
    var cRes = await sb.from("meet_comments").select("*").in("meet_id", ids).order("created_at");

    var parts = pRes.data || [];
    var byMeet = {};
    (cRes.data || []).forEach(function (row) {
      (byMeet[row.meet_id] = byMeet[row.meet_id] || []).push({
        color: row.color, text: row.text, time: t(row.created_at),
        mine: row.author_id === S.uid, authorId: row.author_id, id: Number(row.id),
      });
    });
    return rows.map(function (r) { return toAppMeet(r, parts, byMeet[r.id] || []); });
  }

  async function pullSpirits() {
    var lim = CFG.LIMIT_SPIRITS || 300;
    var res = await sb.from("spirits").select("*").order("created_at", { ascending: false }).limit(lim);
    if (res.error) throw res.error;
    var rows = res.data || [];

    // 리뷰는 내장 도감 항목에도 달리므로 전체를 따로 받아요.
    var rRes = await sb.from("reviews").select("*").order("created_at", { ascending: false }).limit(2000);
    var bySpirit = {};
    (rRes.data || []).forEach(function (row) {
      (bySpirit[row.spirit_id] = bySpirit[row.spirit_id] || []).push(toAppReview(row));
    });

    return {
      spirits: rows.map(function (r) { return toAppSpirit(r, bySpirit[r.id] || []); }),
      reviewsBySpirit: bySpirit,
    };
  }

  async function pullProfile() {
    var res = await sb.from("profiles").select("*").eq("id", S.uid).maybeSingle();
    if (res.error || !res.data) return null;
    return {
      nick: res.data.nick,
      color: res.data.color,
      bannedUntil: res.data.banned_until ? t(res.data.banned_until) : 0,
      bizProfile: res.data.biz_name ? { name: res.data.biz_name, type: res.data.biz_type } : null,
    };
  }

  async function pullBlocks() {
    var res = await sb.from("blocks").select("blocked_id").eq("user_id", S.uid);
    if (res.error) return null;
    return (res.data || []).map(function (r) { return r.blocked_id; });
  }

  // 내가 관리자인지 서버에 물어봐요. admins 테이블은 앱에서 쓰기가 아예 막혀 있어
  // 이 값을 조작해도 서버가 실제 삭제를 거부합니다 (화면만 잠깐 바뀔 뿐).
  async function pullIsAdmin() {
    var res = await sb.from("admins").select("user_id").eq("user_id", S.uid).maybeSingle();
    if (res.error) return false;
    return !!res.data;
  }

  // 신고함 (관리자만 조회됩니다. 일반 사용자는 빈 배열)
  async function pullReports() {
    if (!S.isAdmin) return [];
    var res = await sb.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (res.error) return [];
    return (res.data || []).map(function (r) {
      return {
        id: r.id,
        type: r.target_type,
        targetId: r.target_id === null ? null : Number(r.target_id),
        targetUser: r.target_user,
        title: r.title || "",
        reason: r.reason,
        status: r.status,
        time: t(r.created_at),
      };
    });
  }

  /* ---------- 전체 새로고침 ---------- */
  var pulling = false;
  async function pullAll(reason) {
    if (!sb || !S.uid || pulling) return;
    pulling = true;
    try {
      S.isAdmin = await pullIsAdmin();
      var results = await Promise.allSettled([
        pullPosts(), pullMeets(), pullSpirits(), pullProfile(), pullBlocks(), pullReports(),
      ]);
      var data = { isAdmin: S.isAdmin };
      if (results[0].status === "fulfilled") data.posts = results[0].value;
      if (results[1].status === "fulfilled") data.meets = results[1].value;
      if (results[2].status === "fulfilled") {
        data.spirits = results[2].value.spirits;
        data.reviewsBySpirit = results[2].value.reviewsBySpirit;
      }
      if (results[3].status === "fulfilled" && results[3].value) data.profile = results[3].value;
      if (results[4].status === "fulfilled" && results[4].value) data.blocks = results[4].value;
      if (results[5].status === "fulfilled") data.reports = results[5].value;

      var failed = results.filter(function (r) { return r.status === "rejected"; });
      if (failed.length === results.length) { setStatus("offline"); return; }

      setStatus("online");
      onData(data, reason || "pull");
    } catch (e) {
      setStatus("offline", e && e.message);
    } finally {
      pulling = false;
    }
  }

  function schedulePull(reason) {
    clearTimeout(pullTimer);
    pullTimer = setTimeout(function () { pullAll(reason); }, 500);
  }

  /* ---------- 실시간 구독 ---------- */
  function subscribe() {
    var ch = sb.channel("bartalk-live");
    ["posts", "comments", "likes", "meets", "meet_participants", "meet_comments", "spirits", "reviews", "reports"]
      .forEach(function (table) {
        ch.on("postgres_changes", { event: "*", schema: "public", table: table }, function () {
          schedulePull("realtime");
        });
      });
    ch.subscribe(function (st) {
      if (st === "SUBSCRIBED") setStatus("online");
      else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") setStatus("offline");
    });
  }

  /* ---------- 초기화 ---------- */
  /* ---------- 인증 ----------
   * 로그인한 사용자만 앱을 쓸 수 있어요.
   * 로그인해야 정지·차단이 실제로 유지되고, 기기를 바꿔도 내 글이 내 것으로 남습니다.
   */
  var subscribed = false;
  var listenersBound = false;

  function pickIdentity(user) {
    if (!user) return null;
    var meta = user.user_metadata || {};
    var provider = (user.app_metadata && user.app_metadata.provider) || "email";
    return {
      id: user.id,
      email: user.email || null,
      provider: provider,
      // 소셜 계정 이름은 기본 닉네임 추천에만 쓰고, 게시판에는 노출하지 않아요.
      suggestedNick: (meta.name || meta.full_name || meta.nickname || meta.preferred_username || "")
        .toString().slice(0, 10),
    };
  }

  // 서버에서 실제로 켜진 로그인 방법을 받아와요.
  // 이걸 모르면 꺼진 버튼을 눌러 오류 페이지로 튕기게 됩니다.
  async function loadProviders() {
    try {
      var res = await fetch(CFG.SUPABASE_URL + "/auth/v1/settings", {
        headers: { apikey: CFG.SUPABASE_ANON_KEY },
      });
      if (!res.ok) return;
      var json = await res.json();
      S.providers = json.external || null;
    } catch (e) { /* 못 받아오면 버튼을 막지 않아요 (서버가 판단하게 둠) */ }
  }

  // 로그인 실패 후 되돌아왔을 때 주소에 남는 오류를 읽어요.
  function consumeAuthError() {
    var msg = null;
    try {
      var q = new URLSearchParams(location.search);
      var h = new URLSearchParams(location.hash.replace(/^#/, ""));
      msg = q.get("auth_error") ||
            q.get("error_description") || q.get("error") ||
            h.get("error_description") || h.get("error");
      if (msg) {
        history.replaceState(null, "", location.pathname);   // 주소를 깨끗하게
      }
    } catch (e) {}
    return msg;
  }

  // 네이버 로그인 함수가 돌려준 1회용 토큰으로 세션을 완성해요.
  // (구글·카카오는 supabase-js 가 알아서 처리하므로 이 과정이 없습니다)
  async function consumeTokenHash() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    var th = q.get("token_hash");
    if (!th || !sb) return false;
    var type = q.get("type") || "magiclink";
    try {
      var res = await sb.auth.verifyOtp({ token_hash: th, type: type });
      history.replaceState(null, "", location.pathname);
      if (res.error) {
        setStatus("signed-out", res.error.message);
        return false;
      }
      var user = res.data && res.data.user;
      if (user) { S.uid = user.id; S.identity = pickIdentity(user); }
      return !!user;
    } catch (e) {
      history.replaceState(null, "", location.pathname);
      return false;
    }
  }

  // 네이버 로그인이 서버에 설정돼 있는지 확인
  async function probeNaver() {
    try {
      var res = await fetch("/api/naver-login?probe=1");
      if (!res.ok) return false;
      var j = await res.json();
      return !!j.configured;
    } catch (e) { return false; }
  }

  async function afterSignedIn() {
    if (!S.uid) return;
    if (!listenersBound) {
      listenersBound = true;
      window.addEventListener("online", function () { flush(); pullAll("online"); });
      window.addEventListener("offline", function () { setStatus("offline"); });
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) { flush(); schedulePull("visible"); }
      });
    }
    if (!subscribed) { subscribed = true; subscribe(); }
    await flush();
    await pullAll("init");
  }

  async function init(hooks) {
    onData = (hooks && hooks.onData) || onData;
    onStatus = (hooks && hooks.onStatus) || onStatus;
    onAuth = (hooks && hooks.onAuth) || onAuth;
    loadQueue();

    if (!S.enabled) { setStatus("off"); return "off"; }
    setStatus("connecting");

    var mod;
    try {
      mod = await import(/* webpackIgnore: true */ SDK_URL);
    } catch (e) {
      setStatus("offline", "서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.");
      return "error";
    }

    try {
      sb = mod.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true, autoRefreshToken: true,
          detectSessionInUrl: true, flowType: "pkce",
          storageKey: "bartalk_auth",
        },
        realtime: { params: { eventsPerSecond: 3 } },
      });

      // 로그인/로그아웃/토큰갱신을 한곳에서 처리
      sb.auth.onAuthStateChange(function (event, session) {
        var user = session && session.user;
        if (event === "SIGNED_OUT" || !user) {
          S.uid = null; S.identity = null; S.isAdmin = false;
          subscribed = false;
          setStatus("signed-out");
          try { onAuth(null); } catch (e) {}
          return;
        }
        var wasSignedOut = !S.uid;
        S.uid = user.id;
        S.identity = pickIdentity(user);
        try { onAuth(S.identity); } catch (e) {}
        if (wasSignedOut) afterSignedIn();
      });

      await loadProviders();
      S.naverReady = await probeNaver();

      // 네이버에서 돌아온 경우 여기서 세션이 만들어져요.
      await consumeTokenHash();

      var sess = await sb.auth.getSession();
      var user = sess.data && sess.data.session && sess.data.session.user;
      if (!user) {
        setStatus("signed-out");
        return "signed-out";
      }
      S.uid = user.id;
      S.identity = pickIdentity(user);
    } catch (e) {
      setStatus("error", (e && e.message) || "서버 연결에 실패했어요.");
      return "error";
    }

    await afterSignedIn();
    return "signed-in";
  }

  /* ---------- 쓰기 API (app.js 가 호출) ---------- */
  function ready() { return !!(sb && S.uid); }

  var api = {
    get enabled() { return S.enabled; },
    get status() { return S.status; },
    get uid() { return S.uid; },
    get error() { return S.error; },
    get queued() { return queue.length; },
    get isAdmin() { return S.isAdmin; },
    get identity() { return S.identity; },
    get signedIn() { return !!S.uid; },
    get providers() { return S.providers; },
    get naverReady() { return S.naverReady; },
    // 서버가 목록을 안 주면 막지 않아요 (알 수 없음 = 시도해봄)
    providerReady: function (p) {
      if (p === "naver") return S.naverReady;
      return !S.providers || S.providers[p] !== false;
    },
    consumeAuthError: consumeAuthError,
    ready: ready,

    /* ---------- 로그인 ---------- */
    // 구글·카카오는 브라우저를 열어 인증 후 앱으로 돌아와요.
    async signInWith(provider) {
      if (!sb) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      // 켜지지 않은 제공자로 이동시키면 사용자가 서버의 JSON 오류 화면에 갇혀요.
      // 그래서 이동 전에 사용 가능 여부를 먼저 확인합니다.
      if (provider === "naver") {
        if (!S.naverReady) return { ok: false, error: "not-enabled", provider: provider };
        location.href = "/api/naver-login";
        return { ok: true };
      }
      if (S.providers && S.providers[provider] === false) {
        return { ok: false, error: "not-enabled", provider: provider };
      }
      try {
        var res = await sb.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: location.origin + location.pathname,
            queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
          },
        });
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true };   // 이 시점에 브라우저가 이동해요
      } catch (e) {
        return { ok: false, error: (e && e.message) || "로그인을 시작하지 못했어요." };
      }
    },

    // 비밀번호 없이 메일로 받은 링크로 로그인
    async signInWithEmail(email) {
      if (!sb) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
        return { ok: false, error: "이메일 형식이 올바르지 않아요." };
      }
      try {
        var res = await sb.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: location.origin + location.pathname },
        });
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "메일을 보내지 못했어요." };
      }
    },

    async signOut() {
      if (!sb) return;
      try { await sb.auth.signOut(); } catch (e) {}
      S.uid = null; S.identity = null; S.isAdmin = false;
      subscribed = false;
      setStatus("signed-out");
    },

    init: init,
    refresh: function (reason) { return pullAll(reason || "manual"); },
    uploadPhoto: uploadPhoto,

    async saveProfile(user) {
      if (!ready()) return;
      enqueue({
        table: "profiles", op: "upsert",
        row: {
          id: S.uid,
          nick: user.nick || "익명",
          color: user.color || 0,
          biz_name: user.bizProfile ? user.bizProfile.name : null,
          biz_type: user.bizProfile ? user.bizProfile.type : null,
        },
      });
    },

    async savePost(p) {
      if (!ready()) return;
      var img = await resolveImg(p);
      enqueue({
        table: "posts", op: "upsert",
        row: {
          id: p.id, author_id: S.uid, cat: p.cat, title: p.title, body: p.body || "",
          color: p.color, nick: p.nick || "익명", biz: p.biz || null, contact: p.contact || null,
          img: img, emoji: p.emoji || null, edited: !!p.edited,
          boost_until: p.boostUntil ? new Date(p.boostUntil).toISOString() : null,
          created_at: new Date(p.time).toISOString(),
        },
      });
    },

    deletePost(id) {
      if (!ready()) return;
      enqueue({ table: "posts", op: "delete", match: { id: id, author_id: S.uid } });
    },

    bumpViews(id, views) {
      if (!ready()) return;
      enqueue({ table: "posts", op: "update", row: { views: views }, match: { id: id } });
    },

    async saveComment(postId, c, parentId) {
      if (!ready()) return;
      var img = await resolveImg(c);
      enqueue({
        table: "comments", op: "upsert",
        row: {
          id: c.id, post_id: postId, parent_id: parentId || null, author_id: S.uid,
          color: c.color, text: c.text, img: img,
          created_at: new Date(c.time).toISOString(),
        },
      });
    },

    toggleLike(postId, liked) {
      if (!ready()) return;
      if (liked) enqueue({ table: "likes", op: "upsert", row: { post_id: postId, user_id: S.uid } });
      else enqueue({ table: "likes", op: "delete", match: { post_id: postId, user_id: S.uid } });
    },

    saveMeet(m) {
      if (!ready()) return;
      enqueue({
        table: "meets", op: "upsert",
        row: {
          id: m.id, host_id: S.uid, region: m.region, title: m.title, descr: m.desc || "",
          place: m.place || "", meet_at: new Date(m.date).toISOString(),
          max_people: m.max, host_color: m.hostColor,
        },
      });
      if (m.isJoined) api.joinMeet(m.id, true);
    },

    joinMeet(meetId, joined) {
      if (!ready()) return;
      if (joined) enqueue({ table: "meet_participants", op: "upsert", row: { meet_id: meetId, user_id: S.uid } });
      else enqueue({ table: "meet_participants", op: "delete", match: { meet_id: meetId, user_id: S.uid } });
    },

    saveMeetComment(meetId, c) {
      if (!ready()) return;
      enqueue({
        table: "meet_comments", op: "upsert",
        row: {
          id: c.id, meet_id: meetId, author_id: S.uid, color: c.color, text: c.text,
          created_at: new Date(c.time).toISOString(),
        },
      });
    },

    async saveSpirit(s) {
      if (!ready()) return;
      var img = await resolveImg(s);
      enqueue({
        table: "spirits", op: "upsert",
        row: {
          id: s.id, author_id: S.uid, kind: s.kind, name: s.name, emoji: s.emoji,
          abv: s.abv || 0, cat: s.cat || null, base: s.base || null, price: s.price || null,
          ings: s.ings || null, recipe: s.recipe || null, note: s.note || "", img: img,
          created_at: new Date(s.time).toISOString(),
        },
      });
    },

    async saveReview(spiritId, r) {
      if (!ready()) return;
      var img = await resolveImg(r);
      enqueue({
        table: "reviews", op: "upsert",
        row: {
          id: r.id, spirit_id: spiritId, author_id: S.uid, stars: r.stars,
          text: r.text || "", color: r.color, img: img,
          created_at: new Date(r.time).toISOString(),
        },
      });
    },

    saveReport(type, targetId, title, reason, targetUser) {
      if (!ready()) return;
      enqueue({
        table: "reports", op: "insert",
        row: {
          reporter_id: S.uid, target_type: type,
          target_id: typeof targetId === "number" ? targetId : null,
          target_user: targetUser || null, title: title || null, reason: reason,
        },
      });
    },

    // 차단 대상은 서버 사용자(uuid)일 때만 저장돼요.
    // 오프라인 시드 글의 가상 작성자는 기기 안에만 남습니다.
    setBlock(blockedId, on) {
      if (!ready()) return;
      if (typeof blockedId !== "string" || blockedId.indexOf("local:") === 0) return;
      if (on) enqueue({ table: "blocks", op: "upsert", row: { user_id: S.uid, blocked_id: blockedId } });
      else enqueue({ table: "blocks", op: "delete", match: { user_id: S.uid, blocked_id: blockedId } });
    },

    /* ---------- 관리자 조치 ----------
     * 일반 쓰기와 달리 큐에 넣지 않고 즉시 실행하고 결과를 돌려줘요.
     * 권한이 없으면 서버가 거부하는데, 그걸 조용히 재시도 큐에 쌓으면
     * 운영자는 "지웠다"고 착각하게 됩니다. 실패는 실패로 알려야 해요.
     */
    async adminDelete(kind, id, meta) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      var TABLE = {
        post: "posts", comment: "comments", spirit: "spirits",
        review: "reviews", meet: "meets", "meet-comment": "meet_comments",
      };
      var table = TABLE[kind];
      if (!table) return { ok: false, error: "알 수 없는 대상이에요." };
      try {
        var res = await sb.from(table).delete().eq("id", id).select("id");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) {
          return { ok: false, error: "권한이 없거나 이미 삭제된 항목이에요." };
        }
        await api.logAdmin("삭제", kind, id, (meta && meta.title) || "", (meta && meta.reason) || "", meta && meta.targetUser);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "삭제에 실패했어요." };
      }
    },

    // days: -1 영구정지 / 0 정지해제 / 그 외 일수
    async adminBan(targetUser, days, reason) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      if (!targetUser) return { ok: false, error: "작성자를 알 수 없는 글이에요." };
      var until = days === 0 ? null
        : days === -1 ? new Date(Date.now() + 100 * 365 * 86400e3).toISOString()
        : new Date(Date.now() + days * 86400e3).toISOString();
      try {
        var res = await sb.from("profiles").update({ banned_until: until }).eq("id", targetUser).select("id");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) return { ok: false, error: "권한이 없어요." };
        var label = days === 0 ? "정지 해제" : days === -1 ? "영구 정지" : days + "일 정지";
        await api.logAdmin(label, "user", null, "", reason || "", targetUser);
        return { ok: true, label: label };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "처리에 실패했어요." };
      }
    },

    async adminResolveReport(reportId, status) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.from("reports").update({ status: status }).eq("id", reportId).select("id");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) return { ok: false, error: "권한이 없어요." };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "처리에 실패했어요." };
      }
    },

    // 조치 기록. 실패해도 본 작업을 되돌리지는 않아요 (기록보다 조치가 우선).
    async logAdmin(action, targetType, targetId, title, reason, targetUser) {
      if (!ready() || !S.isAdmin) return;
      try {
        await sb.from("admin_actions").insert({
          admin_id: S.uid, action: action, target_type: targetType || null,
          target_id: typeof targetId === "number" ? targetId : null,
          target_user: targetUser || null, title: title || null, reason: reason || null,
        });
      } catch (e) {}
    },

    async adminLog(limit) {
      if (!ready() || !S.isAdmin) return [];
      var res = await sb.from("admin_actions").select("*")
        .order("created_at", { ascending: false }).limit(limit || 50);
      if (res.error) return [];
      return (res.data || []).map(function (r) {
        return {
          at: t(r.created_at), action: r.action, type: r.target_type,
          targetId: r.target_id, title: r.title, reason: r.reason,
        };
      });
    },
  };

  window.BarTalkSync = api;
})();
