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
  };

  var sb = null;              // supabase client
  var onData = function () {};
  var onStatus = function () {};
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

  /* ---------- 전체 새로고침 ---------- */
  var pulling = false;
  async function pullAll(reason) {
    if (!sb || !S.uid || pulling) return;
    pulling = true;
    try {
      var results = await Promise.allSettled([
        pullPosts(), pullMeets(), pullSpirits(), pullProfile(), pullBlocks(),
      ]);
      var data = {};
      if (results[0].status === "fulfilled") data.posts = results[0].value;
      if (results[1].status === "fulfilled") data.meets = results[1].value;
      if (results[2].status === "fulfilled") {
        data.spirits = results[2].value.spirits;
        data.reviewsBySpirit = results[2].value.reviewsBySpirit;
      }
      if (results[3].status === "fulfilled" && results[3].value) data.profile = results[3].value;
      if (results[4].status === "fulfilled" && results[4].value) data.blocks = results[4].value;

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
    ["posts", "comments", "likes", "meets", "meet_participants", "meet_comments", "spirits", "reviews"]
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
  async function init(hooks) {
    onData = (hooks && hooks.onData) || onData;
    onStatus = (hooks && hooks.onStatus) || onStatus;
    loadQueue();

    if (!S.enabled) { setStatus("off"); return false; }
    setStatus("connecting");

    var mod;
    try {
      mod = await import(/* webpackIgnore: true */ SDK_URL);
    } catch (e) {
      setStatus("offline", "서버 라이브러리를 불러오지 못했어요.");
      return false;
    }

    try {
      sb = mod.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: "bartalk_auth" },
        realtime: { params: { eventsPerSecond: 3 } },
      });

      var sess = await sb.auth.getSession();
      var user = sess.data && sess.data.session && sess.data.session.user;
      if (!user) {
        var anon = await sb.auth.signInAnonymously();
        if (anon.error) throw anon.error;
        user = anon.data.user;
      }
      if (!user) throw new Error("로그인 정보를 받지 못했어요.");
      S.uid = user.id;
    } catch (e) {
      setStatus("error", (e && e.message) || "서버 연결에 실패했어요.");
      return false;
    }

    window.addEventListener("online", function () { flush(); pullAll("online"); });
    window.addEventListener("offline", function () { setStatus("offline"); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { flush(); schedulePull("visible"); }
    });

    subscribe();
    await flush();
    await pullAll("init");
    return true;
  }

  /* ---------- 쓰기 API (app.js 가 호출) ---------- */
  function ready() { return !!(sb && S.uid); }

  var api = {
    get enabled() { return S.enabled; },
    get status() { return S.status; },
    get uid() { return S.uid; },
    get error() { return S.error; },
    get queued() { return queue.length; },
    ready: ready,
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
  };

  window.BarTalkSync = api;
})();
