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
  var onPatch = function () {};
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

  function toAppComment(row, likedIds) {
    var c = {
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
      likes: row.like_count || 0,
      likedByMe: !!(likedIds && likedIds.has(Number(row.id))),
    };
    // 공식(운영) 계정 댓글만 이름이 보입니다. 나머지는 계속 익명이에요.
    // 이 값들은 서버 트리거가 찍기 때문에 앱에서 위조할 수 없습니다.
    if (row.official) {
      c.official = true;
      c.officialLabel = row.official_label || "공식";
      c.officialNick = row.official_nick || "운영";
    }
    return c;
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
    // 공식(운영) 계정 표시. 서버 트리거가 찍는 값이라 앱에서 못 만듭니다.
    if (row.official) {
      p.official = true;
      p.officialLabel = row.official_label || "공식";
    }
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

  /* ---------- 1:1 채팅 ---------- */
  // 두 사람당 대화방 하나. 누가 먼저 말을 걸어도 같은 방을 씁니다.
  function pairOf(peerId) {
    return S.uid < peerId ? [S.uid, peerId] : [peerId, S.uid];
  }

  function toAppConversation(row) {
    var iAmA = row.user_a === S.uid;
    return {
      id: Number(row.id),
      peerId: iAmA ? row.user_b : row.user_a,
      color: iAmA ? row.b_color : row.a_color,
      ctx: row.ctx || "1:1 대화",
      time: t(row.last_at),
      msgs: [],
      remote: true,
    };
  }

  function toAppMessage(row) {
    return {
      id: Number(row.id),
      me: row.sender === S.uid,
      text: row.text,
      time: t(row.created_at),
      remote: true,
    };
  }

  async function pullChats() {
    var res = await sb.from("conversations").select("*")
      .or("user_a.eq." + S.uid + ",user_b.eq." + S.uid)
      .order("last_at", { ascending: false }).limit(100);
    if (res.error) throw res.error;
    var rows = res.data || [];
    if (!rows.length) return [];

    var ids = rows.map(function (r) { return r.id; });
    var mRes = await sb.from("messages").select("*")
      .in("conversation_id", ids).order("created_at").limit(2000);
    var rRes = await sb.from("conversation_reads").select("*").eq("user_id", S.uid);

    var byConv = {};
    (mRes.data || []).forEach(function (m) {
      (byConv[m.conversation_id] = byConv[m.conversation_id] || []).push(toAppMessage(m));
    });
    var readAt = {};
    (rRes.data || []).forEach(function (r) { readAt[r.conversation_id] = t(r.last_read_at); });

    return rows.map(function (r) {
      var c = toAppConversation(r);
      c.msgs = byConv[r.id] || [];
      var seen = readAt[r.id] || 0;
      c.unread = c.msgs.filter(function (m) { return !m.me && m.time > seen; }).length;
      return c;
    });
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
    // 내가 하트를 누른 댓글. 댓글이 없으면 물어보지 않아요.
    var cids = (cRes.data || []).map(function (r) { return r.id; });
    var clRes = cids.length
      ? await sb.from("comment_likes").select("comment_id").eq("user_id", S.uid).in("comment_id", cids)
      : { data: [] };
    var likedComments = new Set((clRes.data || []).map(function (r) { return Number(r.comment_id); }));

    var byPost = {};
    (cRes.data || []).forEach(function (row) {
      (byPost[row.post_id] = byPost[row.post_id] || []).push(row);
    });
    var likedIds = new Set((lRes.data || []).map(function (r) { return Number(r.post_id); }));

    return rows.map(function (r) {
      var flat = byPost[r.id] || [];
      var tops = [], byId = {};
      flat.forEach(function (row) {
        var c = toAppComment(row, likedComments);
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

  // 앱에 내장된 도감을 운영자가 고친 내용.
  // 파일을 바꾸는 대신 "고친 부분"만 받아서 화면에 얹습니다.
  async function pullOverrides() {
    var res = await sb.from("content_overrides").select("*");
    if (res.error) return null;   // 표가 아직 없으면 무시 (overrides.sql 미실행)
    var map = {};
    (res.data || []).forEach(function (r) {
      map[r.kind + ":" + r.ref_id] = {
        patch: r.patch || {},
        hidden: !!r.hidden,
        at: t(r.updated_at),
      };
    });
    return map;
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

  /* ---------- 상대에게 알림 보내기 ----------
   * 알림을 실제로 쏘는 것은 서버 함수입니다. 여기서는 부탁만 해요.
   * 발송 서버는 이 토큰으로 "정말 그 대화의 참여자인지" 다시 확인합니다.
   */
  async function notifyPeer(conversationId) {
    try {
      var s = await sb.auth.getSession();
      var token = s && s.data && s.data.session && s.data.session.access_token;
      if (!token) return;
      await fetch("/api/push-send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ conversationId: conversationId }),
      });
    } catch (e) { /* 알림이 안 가도 메시지는 갑니다 */ }
  }

  /* ---------- 화면에 필요한 것만 새로고침 ----------
   * 실시간은 끊길 수 있습니다. 재접속·화면 복귀 때 전체를 맞추긴 하지만,
   * 그 사이 탭만 오가는 동안에는 예전 목록이 그대로 남아 있었어요.
   *
   * 그렇다고 탭마다 전체를 받으면 한 번 옮길 때마다 8번씩 조회하게 됩니다.
   * 그래서 그 화면이 실제로 쓰는 것만 골라 한두 번만 조회해요.
   */
  var PULLERS = {
    posts:   function () { return pullPosts().then(function (v) { return { posts: v }; }); },
    meets:   function () { return pullMeets().then(function (v) { return { meets: v }; }); },
    spirits: function () { return pullSpirits().then(function (v) {
      return { spirits: v.spirits, reviewsBySpirit: v.reviewsBySpirit };
    }); },
    chats:   function () { return pullChats().then(function (v) { return { chats: v }; }); },
    reports: function () { return pullReports().then(function (v) { return { reports: v }; }); },
  };

  var VIEW_NEEDS = {
    home: ["posts"], community: ["posts"], myposts: ["posts"], post: ["posts"],
    dogam: ["spirits"], spirit: ["spirits"],
    meet: ["meets"], "meet-detail": ["meets"],
    chat: ["chats"],
    admin: ["posts", "reports"],
  };

  var lastPull = {};      // 무엇을 언제 받았는지
  var inFlight = {};      // 같은 조회가 겹치지 않게
  var MIN_GAP = 2500;     // 탭을 빠르게 오갈 때 조회가 쏟아지지 않도록

  async function pullSome(keys, reason) {
    if (!sb || !S.uid || !keys || !keys.length) return;
    var now = Date.now();
    var need = keys.filter(function (k) {
      return PULLERS[k] && !inFlight[k] && now - (lastPull[k] || 0) > MIN_GAP;
    });
    if (!need.length) return;
    need.forEach(function (k) { inFlight[k] = true; });

    var res = await Promise.allSettled(need.map(function (k) { return PULLERS[k](); }));
    var data = {};
    res.forEach(function (r, i) {
      inFlight[need[i]] = false;
      // 실패하면 받은 시각을 남기지 않아요. 다음에 다시 받게 하려는 것입니다.
      if (r.status !== "fulfilled") return;
      lastPull[need[i]] = Date.now();
      Object.keys(r.value).forEach(function (k) { data[k] = r.value[k]; });
    });
    if (!Object.keys(data).length) return;
    setStatus("online");
    onData(data, reason || "view");
  }

  /* ---------- 전체 새로고침 ---------- */
  var pulling = false;
  async function pullAll(reason) {
    if (!sb || !S.uid || pulling) return;
    pulling = true;
    try {
      S.isAdmin = await pullIsAdmin();
      var results = await Promise.allSettled([
        pullPosts(), pullMeets(), pullSpirits(), pullProfile(), pullBlocks(), pullReports(), pullChats(), pullOverrides(),
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
      if (results[6].status === "fulfilled") data.chats = results[6].value;
      if (results[7].status === "fulfilled" && results[7].value) data.overrides = results[7].value;

      var failed = results.filter(function (r) { return r.status === "rejected"; });
      if (failed.length === results.length) { setStatus("offline"); return; }

      setStatus("online");
      var at = Date.now();
      Object.keys(PULLERS).forEach(function (k) { lastPull[k] = at; });
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

  /* ---------- 실시간 구독 (증분) ----------
   * 예전에는 누가 글 하나만 써도 접속 중인 모두가 전체를 다시 받았어요.
   * 동시 접속이 늘면 글 하나에 수백 번의 대량 조회가 터집니다.
   * 이제는 바뀐 행만 받아서 그 부분만 고칩니다.
   *
   * 다만 실시간은 놓칠 수 있으므로(재접속·일시적 끊김),
   * 화면 복귀·재연결 시에는 여전히 전체를 한 번 맞춰요.
   */
  var TABLE_KIND = {
    posts: "post", comments: "comment", likes: "like",
    meets: "meet", meet_participants: "meetJoin", meet_comments: "meetComment",
    spirits: "spirit", reviews: "review", comment_likes: "commentLike",
    conversations: "conversation", messages: "message",
    content_overrides: "override",
  };

  function emitPatch(kind, op, item, extra) {
    try { onPatch(Object.assign({ kind: kind, op: op, item: item }, extra || {})); }
    catch (e) {}
  }

  function handleChange(table, payload) {
    var kind = TABLE_KIND[table];
    var ev = payload.eventType || payload.event;
    var row = payload.new && Object.keys(payload.new).length ? payload.new : null;
    var old = payload.old && Object.keys(payload.old).length ? payload.old : null;

    // 신고는 목록을 통째로 다시 받는 편이 단순하고, 운영자에게만 옵니다.
    if (table === "reports" || table === "content_overrides") { schedulePull(table); return; }

    if (ev === "DELETE") {
      var delId = old && old.id;
      if (table === "likes" && old) {
        emitPatch("like", "delete", { postId: Number(old.post_id), userId: old.user_id });
      } else if (table === "comment_likes") {
        emitPatch("commentLike", "delete", { commentId: Number(old.comment_id), userId: old.user_id });
      } else if (table === "meet_participants" && old) {
        emitPatch("meetJoin", "delete", { meetId: Number(old.meet_id), userId: old.user_id });
      } else if (delId != null) {
        emitPatch(kind, "delete", { id: Number(delId), postId: old.post_id ? Number(old.post_id) : undefined,
          meetId: old.meet_id ? Number(old.meet_id) : undefined,
          spiritId: old.spirit_id ? Number(old.spirit_id) : undefined,
          conversationId: old.conversation_id ? Number(old.conversation_id) : undefined });
      }
      return;
    }

    if (!row) return;
    switch (table) {
      case "posts":
        emitPatch("post", "upsert", toAppPost(row, null, new Set()));
        break;
      case "comments":
        emitPatch("comment", "upsert", toAppComment(row),
          { postId: Number(row.post_id), parentId: row.parent_id ? Number(row.parent_id) : null });
        break;
      case "likes":
        emitPatch("like", "upsert", { postId: Number(row.post_id), userId: row.user_id });
        break;
      case "comment_likes":
        emitPatch("commentLike", "upsert", { commentId: Number(row.comment_id), userId: row.user_id });
        break;
      case "meets":
        emitPatch("meet", "upsert", toAppMeet(row, [], null));
        break;
      case "meet_participants":
        emitPatch("meetJoin", "upsert", { meetId: Number(row.meet_id), userId: row.user_id });
        break;
      case "meet_comments":
        emitPatch("meetComment", "upsert", {
          id: Number(row.id), color: row.color, text: row.text, time: t(row.created_at),
          mine: row.author_id === S.uid, authorId: row.author_id, remote: true,
        }, { meetId: Number(row.meet_id) });
        break;
      case "spirits":
        emitPatch("spirit", "upsert", toAppSpirit(row, null));
        break;
      case "reviews":
        emitPatch("review", "upsert", toAppReview(row), { spiritId: Number(row.spirit_id) });
        break;
      case "conversations":
        emitPatch("conversation", "upsert", toAppConversation(row));
        break;
      case "messages":
        emitPatch("message", "upsert", toAppMessage(row), { conversationId: Number(row.conversation_id) });
        break;
    }
  }

  function subscribe() {
    var ch = sb.channel("bartalk-live");
    Object.keys(TABLE_KIND).concat("reports").forEach(function (table) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: table }, function (payload) {
        try { handleChange(table, payload); }
        catch (e) { schedulePull("realtime-fallback"); }   // 못 알아들으면 전체 동기화로 대체
      });
    });
    ch.subscribe(function (st) {
      if (st === "SUBSCRIBED") {
        setStatus("online");
        // 끊겨 있는 동안 놓친 변경을 한 번 맞춰요.
        if (missedWhileOffline) { missedWhileOffline = false; schedulePull("resubscribe"); }
      } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") {
        missedWhileOffline = true;
        setStatus("offline");
      }
    });
  }
  var missedWhileOffline = false;

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

  // 로그인 후 돌아올 주소.
  //
  // 그냥 location.origin 을 쓰면 안 됩니다. 파일을 직접 열어 본 화면(file://)에서는
  // origin 이 문자열 "null" 이라, 메일에 "null/index.html" 같은 주소가 박혀서 나가요.
  // 그 링크를 폰에서 누르면 "null 에 접근할 수 없습니다" 가 뜹니다.
  // 그래서 http(s) 로 열렸을 때만 현재 주소를 쓰고, 아니면 설정에 적힌 운영 주소로 보냅니다.
  // 둘 다 없으면 아예 넘기지 않아요 — 그럼 Supabase 가 Site URL 로 보냅니다.
  function redirectUrl() {
    var p = location.protocol;
    if ((p === "http:" || p === "https:") && location.origin && location.origin !== "null") {
      return location.origin + location.pathname;
    }
    var site = CFG.SITE_URL || "";
    return /^https?:\/\//.test(site) ? site : undefined;
  }

  // 로그인 링크를 타고 왔는데 세션이 안 생겼을 때, 왜 그런지 알려줍니다.
  // 주소에 흔적이 남아 있어서 구분할 수 있어요.
  //  · ?code=…            → 예전 pkce 방식 링크. 요청한 브라우저가 아니면 실패합니다.
  //  · #access_token=…    → 토큰은 왔는데 세션 저장에 실패 (시크릿 모드·저장소 차단 등)
  // 흔적은 지웁니다. 안 지우면 새로고침할 때마다 같은 실패를 반복해요.
  function staleLinkMessage() {
    var msg = null;
    try {
      var q = new URLSearchParams(location.search);
      var h = location.hash || "";
      if (q.get("code")) {
        msg = "로그인 링크가 만료됐거나 다른 브라우저에서 열렸어요. " +
              "메일을 다시 받아, 링크를 길게 눌러 기본 브라우저로 열어주세요.";
      } else if (h.indexOf("access_token=") >= 0) {
        msg = "로그인 정보를 저장하지 못했어요. 시크릿 모드가 아닌 창에서 다시 시도해주세요.";
      }
      if (msg) history.replaceState(null, "", location.pathname);
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
    onPatch = (hooks && hooks.onPatch) || onPatch;
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
          detectSessionInUrl: true,
          // pkce 가 아니라 implicit 입니다. 이유가 있어요.
          //
          // pkce 는 메일을 "요청한 브라우저"의 localStorage 에 code_verifier 를 저장해두고,
          // 링크를 눌렀을 때 그 값으로 코드를 교환합니다. 그런데 사람들은 메일을
          // 카카오·네이버·지메일 앱에서 열고, 그 인앱 브라우저는 저장소가 따로예요.
          // 그래서 verifier 를 못 찾고 조용히 실패합니다. 화면엔 아무 말도 안 뜨고
          // 로그인 화면만 다시 보이죠. PC 에서 요청하고 폰에서 여는 경우도 마찬가지고요.
          //
          // implicit 는 링크 자체에 토큰이 담겨 오므로 어느 브라우저에서 열어도 됩니다.
          flowType: "implicit",
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
        // 로그인 링크를 눌러서 왔는데 세션이 안 생긴 경우입니다.
        // 그냥 두면 로그인 화면만 다시 떠서 "왜 안 되지" 하게 되므로 이유를 알려줘요.
        setStatus("signed-out", staleLinkMessage());
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
            redirectTo: redirectUrl(),
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
      // 파일을 직접 열어 본 화면에서는 돌아올 주소를 만들 수가 없어요.
      // 그대로 보내면 못 쓰는 링크가 메일로 나가므로 여기서 막습니다.
      var back = redirectUrl();
      if (!back) {
        return { ok: false, error: "이 화면에서는 이메일 로그인을 쓸 수 없어요. 주소창에 주소를 입력해 접속한 뒤 다시 시도해주세요." };
      }
      try {
        var res = await sb.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: back },
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
    // 그 화면이 쓰는 것만 다시 받아요 (탭 전환 때 호출)
    refreshView: function (view) { return pullSome(VIEW_NEEDS[view] || [], "view:" + view); },
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

    /* ---------- 1:1 채팅 ---------- */
    // 상대와의 대화방을 찾거나 만들어요. 두 사람당 하나만 생깁니다.
    async openConversation(peerId, ctx, myColor, peerColor) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      if (!peerId || peerId === S.uid) return { ok: false, error: "대화 상대를 찾을 수 없어요." };
      var pair = pairOf(peerId);
      var iAmA = pair[0] === S.uid;
      try {
        var found = await sb.from("conversations").select("*")
          .eq("user_a", pair[0]).eq("user_b", pair[1]).maybeSingle();
        if (found.data) return { ok: true, conversation: toAppConversation(found.data) };

        var row = {
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          user_a: pair[0], user_b: pair[1], ctx: ctx || "1:1 대화",
          a_color: iAmA ? (myColor || 2) : (peerColor || 2),
          b_color: iAmA ? (peerColor || 2) : (myColor || 2),
        };
        var ins = await sb.from("conversations").insert(row).select("*").single();
        if (ins.error) {
          // 상대가 같은 순간에 먼저 만들었을 수 있어요.
          var again = await sb.from("conversations").select("*")
            .eq("user_a", pair[0]).eq("user_b", pair[1]).maybeSingle();
          if (again.data) return { ok: true, conversation: toAppConversation(again.data) };
          return { ok: false, error: ins.error.message };
        }
        return { ok: true, conversation: toAppConversation(ins.data) };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "대화를 시작하지 못했어요." };
      }
    },

    sendMessage(conversationId, msg) {
      if (!ready()) return;
      enqueue({
        table: "messages", op: "upsert",
        row: {
          id: msg.id, conversation_id: conversationId, sender: S.uid,
          text: msg.text, created_at: new Date(msg.time).toISOString(),
        },
      });
      // 상대 폰이 꺼져 있어도 알림이 가도록 발송을 부탁합니다.
      // 실패해도 메시지 자체는 이미 전송 대기열에 들어가 있어요.
      notifyPeer(conversationId);
    },

    /* ---------- 알림 구독 ----------
     * 브라우저가 기기마다 발급한 "우편함 주소"를 서버에 맡깁니다.
     * 이 주소가 있어야 앱이 꺼져 있을 때도 알림을 보낼 수 있어요.
     */
    async savePushSub(sub) {
      if (!ready() || !sub) return false;
      var j = sub.toJSON ? sub.toJSON() : sub;
      if (!j.keys || !j.keys.p256dh || !j.keys.auth) return false;
      try {
        var r = await sb.from("push_subscriptions").upsert({
          endpoint: j.endpoint,
          user_id: S.uid,
          p256dh: j.keys.p256dh,
          auth: j.keys.auth,
          ua: (navigator.userAgent || "").slice(0, 200),
        }, { onConflict: "endpoint" });
        return !r.error;
      } catch (e) { return false; }
    },

    async removePushSub(endpoint) {
      if (!ready() || !endpoint) return;
      try { await sb.from("push_subscriptions").delete().eq("endpoint", endpoint); } catch (e) {}
    },

    toggleCommentLike(commentId, on) {
      if (!ready()) return;
      if (on) enqueue({ table: "comment_likes", op: "upsert", row: { comment_id: commentId, user_id: S.uid } });
      else enqueue({ table: "comment_likes", op: "delete", match: { comment_id: commentId, user_id: S.uid } });
    },

    // 내가 쓴 것만 지울 수 있어요 (서버 정책이 한 번 더 막습니다).
    deleteComment(id) {
      if (!ready()) return;
      enqueue({ table: "comments", op: "delete", match: { id: id, author_id: S.uid } });
    },

    deleteMeetComment(id) {
      if (!ready()) return;
      enqueue({ table: "meet_comments", op: "delete", match: { id: id, author_id: S.uid } });
    },

    deleteReview(id) {
      if (!ready()) return;
      enqueue({ table: "reviews", op: "delete", match: { id: id, author_id: S.uid } });
    },

    markRead(conversationId) {
      if (!ready()) return;
      enqueue({
        table: "conversation_reads", op: "upsert",
        row: { conversation_id: conversationId, user_id: S.uid, last_read_at: new Date().toISOString() },
      });
    },

    /* ---------- 내장 콘텐츠 수정 (운영자) ---------- */
    // patch 에 담은 항목만 덮어씁니다. 예: { abv: 43, note: "..." }
    async saveOverride(kind, refId, patch, hidden) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      if (!S.isAdmin) return { ok: false, error: "운영자만 수정할 수 있어요." };
      try {
        var res = await sb.from("content_overrides").upsert({
          kind: kind, ref_id: refId, patch: patch || {},
          hidden: !!hidden, updated_by: S.uid, updated_at: new Date().toISOString(),
        }).select("ref_id");
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "저장에 실패했어요." };
      }
    },

    // 덮어쓰기를 지워 원래 내장 내용으로 되돌립니다.
    async clearOverride(kind, refId) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      if (!S.isAdmin) return { ok: false, error: "운영자만 수정할 수 있어요." };
      try {
        var res = await sb.from("content_overrides").delete()
          .eq("kind", kind).eq("ref_id", refId);
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "되돌리기에 실패했어요." };
      }
    },

    /* ---------- 관리자 통계 ---------- */
    async adminStats() {
      if (!ready() || !S.isAdmin) return null;
      var res = await sb.rpc("admin_stats");
      if (res.error || !res.data) return null;
      return res.data;
    },

    async adminUsers(q, limit) {
      if (!ready() || !S.isAdmin) return [];
      var res = await sb.rpc("admin_users", { q: q || "", lim: limit || 100 });
      if (res.error) return [];
      return (res.data || []).map(function (r) {
        return {
          id: r.id, nick: r.nick || "익명", color: r.color,
          bannedUntil: r.banned_until ? t(r.banned_until) : 0,
          joined: t(r.created_at),
          posts: Number(r.posts) || 0,
          comments: Number(r.comments) || 0,
          reported: Number(r.reported) || 0,
        };
      });
    },

    /* ---------- 관리자 콘텐츠 목록 ----------
     * 대시보드 숫자를 눌렀을 때 여는 관리 화면의 원본이에요.
     * 로컬 캐시가 아니라 서버를 직접 읽습니다. 운영자는 "내 기기에 받아둔 것"이
     * 아니라 "지금 서버에 실제로 있는 것"을 봐야 하니까요.
     */
    async adminList(kind, opts) {
      if (!ready() || !S.isAdmin) return [];
      opts = opts || {};
      var lim = Math.min(opts.limit || 200, 500);
      // 이 값은 PostgREST 필터 문자열에 그대로 들어갑니다.
      // 쉼표·괄호가 섞이면 필터가 통째로 깨지므로 구분자를 미리 지워요.
      var q = String(opts.q || "").replace(/[,()%*\\"']/g, " ").trim();

      var SPECS = {
        post: {
          table: "posts", author: "author_id", order: "created_at", search: ["title", "body"],
          cols: "id,title,body,cat,nick,color,author_id,created_at,like_count,comment_count,views",
        },
        comment: {
          table: "comments", author: "author_id", order: "created_at", search: ["text"],
          cols: "id,text,color,post_id,parent_id,author_id,created_at",
        },
        spirit: {
          table: "spirits", author: "author_id", order: "created_at", search: ["name", "note"],
          cols: "id,name,kind,emoji,abv,cat,base,price,ings,note,author_id,created_at",
        },
        meet: {
          table: "meets", author: "host_id", order: "meet_at", asc: true, search: ["title", "place"],
          cols: "id,title,descr,region,place,meet_at,max_people,host_color,host_id,created_at",
        },
        review: {
          table: "reviews", author: "author_id", order: "created_at", search: ["text"],
          cols: "id,spirit_id,stars,text,color,author_id,created_at",
        },
      };
      var s = SPECS[kind];
      if (!s) return [];

      try {
        var sel = sb.from(s.table).select(s.cols);
        if (opts.author) sel = sel.eq(s.author, opts.author);
        if (q) {
          sel = sel.or(s.search.map(function (c) { return c + ".ilike.%" + q + "%"; }).join(","));
        }
        var res = await sel.order(s.order, { ascending: !!s.asc }).limit(lim);
        if (res.error) return [];
        var rows = res.data || [];
        if (!rows.length) return [];

        // 작성자 닉네임·정지 여부는 profiles 에만 있어서 한 번 더 받아옵니다.
        var ids = [];
        rows.forEach(function (r) {
          var a = r[s.author];
          if (a && ids.indexOf(a) < 0) ids.push(a);
        });
        var profs = {};
        if (ids.length) {
          var pRes = await sb.from("profiles").select("id,nick,color,banned_until").in("id", ids);
          (pRes.data || []).forEach(function (p) { profs[p.id] = p; });
        }

        // 댓글은 "어느 글에 달린 댓글인지"가 없으면 판단이 안 돼요.
        var postTitles = {};
        if (kind === "comment") {
          var pids = [];
          rows.forEach(function (r) { if (pids.indexOf(r.post_id) < 0) pids.push(r.post_id); });
          if (pids.length) {
            var tRes = await sb.from("posts").select("id,title").in("id", pids);
            (tRes.data || []).forEach(function (p) { postTitles[p.id] = p.title; });
          }
        }

        return rows.map(function (r) {
          var a = r[s.author] || null;
          var prof = profs[a] || {};
          return {
            kind: kind,
            id: Number(r.id),
            authorId: a,
            authorNick: prof.nick || "알 수 없음",
            authorColor: typeof prof.color === "number" ? prof.color
              : typeof r.color === "number" ? r.color : 2,
            authorBanned: prof.banned_until ? t(prof.banned_until) : 0,
            at: t(r.created_at),
            postTitle: kind === "comment" ? (postTitles[r.post_id] || "") : "",
            row: r,
          };
        });
      } catch (e) {
        return [];
      }
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

    /* ---------- 봇(공식 계정) 관리 ----------
     * 전부 관리자만 쓸 수 있어요. 권한 판정은 서버가 합니다.
     * 앱에서 status 를 '발행됨' 으로 직접 바꾸거나 작성 계정을 갈아끼우는 건
     * 서버 트리거가 되돌립니다. */

    // 봇 화면 첫 진입에 필요한 것들을 한 번에 가져와요.
    async botLoad() {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var sRes = await sb.from("content_settings").select("*").eq("id", 1).maybeSingle();
        if (sRes.error) throw sRes.error;
        if (!sRes.data) {
          return { ok: false, error: "supabase/official.sql 을 아직 실행하지 않았어요." };
        }

        var pRes = await sb.from("profiles")
          .select("id,nick,color,official_label")
          .eq("is_official", true).order("nick");
        if (pRes.error) throw pRes.error;

        var qRes = await sb.from("content_queue")
          .select("id,status,kind,author_id,title,text,publish_after,published_at,published_id,note,last_error")
          .order("publish_after", { ascending: true })
          .limit(1000);
        if (qRes.error) throw qRes.error;

        return { ok: true, settings: sRes.data, personas: pRes.data || [], queue: qRes.data || [] };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "봇 정보를 불러오지 못했어요." };
      }
    },

    async botSaveSettings(patch) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.from("content_settings").update(patch).eq("id", 1).select("*");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) return { ok: false, error: "권한이 없어요." };
        if (typeof patch.enabled === "boolean") {
          await api.logAdmin(patch.enabled ? "봇 자동발행 켜기" : "봇 자동발행 끄기", "user", null, "", "");
        }
        return { ok: true, settings: res.data[0] };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "저장에 실패했어요." };
      }
    },

    // status: 'approved'(예약) / 'rejected'(버림) / 'draft'(되돌리기)
    async botSetStatus(id, status, publishAfter) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var patch = { status: status };
        if (publishAfter) patch.publish_after = new Date(publishAfter).toISOString();
        if (status !== "failed") { patch.attempts = 0; patch.last_error = null; }
        var res = await sb.from("content_queue").update(patch).eq("id", id).select("*");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) {
          return { ok: false, error: "권한이 없거나 이미 발행된 글이에요." };
        }
        return { ok: true, row: res.data[0] };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "처리에 실패했어요." };
      }
    },

    async botEdit(id, fields) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.from("content_queue").update(fields).eq("id", id).select("*");
        if (res.error) return { ok: false, error: res.error.message };
        if (!res.data || !res.data.length) return { ok: false, error: "권한이 없거나 이미 발행된 글이에요." };
        return { ok: true, row: res.data[0] };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "수정에 실패했어요." };
      }
    },

    // 예약 시각을 기다리지 않고 지금 내보냅니다.
    async botPublishNow(queueId) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.rpc("admin_publish_now", { p_queue_id: queueId });
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true, id: res.data };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "발행에 실패했어요." };
      }
    },

    // 봇 계정으로 글쓰기. at 이 미래면 그 시각에 예약돼요.
    async botPostAs(authorId, p) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.rpc("admin_post_as", {
          p_author: authorId,
          p_title: p.title,
          p_body: p.body || "",
          p_cat: p.cat || "free",
          p_emoji: p.emoji || null,
          p_at: p.at ? new Date(p.at).toISOString() : null,
        });
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true, result: res.data || {} };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "작성에 실패했어요." };
      }
    },

    // 봇 계정으로 댓글 달기. 이건 항상 즉시 등록됩니다.
    async botCommentAs(authorId, postId, text, parentId) {
      if (!ready()) return { ok: false, error: "서버에 연결되어 있지 않아요." };
      try {
        var res = await sb.rpc("admin_comment_as", {
          p_author: authorId,
          p_post_id: postId,
          p_text: text,
          p_parent: parentId || null,
        });
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true, id: res.data };
      } catch (e) {
        return { ok: false, error: (e && e.message) || "작성에 실패했어요." };
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
