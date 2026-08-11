/* ============================================================
 *  알림 발송 (Vercel 서버리스 함수)
 *
 *  앱이 꺼져 있어도 알림이 가게 하는 부분입니다.
 *    · 1:1 채팅 메시지  → 상대에게
 *    · 내 글의 댓글     → 글쓴이에게
 *    · 내 댓글의 답글   → 그 댓글을 쓴 사람에게
 *
 *  ⚠️ 부르는 쪽을 믿지 않습니다.
 *     로그인 토큰을 Supabase 에 물어 진짜인지 확인하고,
 *     "정말 그 대화의 참여자인지" · "정말 그 댓글을 쓴 사람인지"를
 *     서버에서 다시 확인합니다. 그래서 남에게 알림을 꽂아 넣거나
 *     쓰지도 않은 댓글로 알림을 쏠 수 없어요.
 *
 *  ⚠️ 내용은 알림에 넣지 않습니다.
 *     푸시 본문은 구글·애플의 푸시 서버를 지나갑니다. 종단간이 아니에요.
 *     "무엇이 왔다"까지만 보내고, 내용은 앱에서 확인하게 합니다.
 *
 *  Vercel > Settings > Environment Variables
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY   ← 이 함수 안에서만 쓰입니다. 브라우저로 안 나갑니다.
 *     VAPID_PUBLIC_KEY
 *     VAPID_PRIVATE_KEY           ← 비밀
 *     VAPID_SUBJECT               ← 예: mailto:help@barapp.kr
 * ============================================================ */

const webpush = require("web-push");
const fcm = require("./_fcm.js");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:help@barapp.kr";

let vapidReady = false;
function setupVapid() {
  if (vapidReady) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidReady = true;
  return true;
}

/* Supabase REST 를 service_role 로 부릅니다 (RLS 를 지나갑니다). */
async function db(path) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
  });
  if (!r.ok) throw new Error("db " + r.status);
  return r.json();
}

/* 보낸 사람이 진짜 그 사람인지 확인합니다. 토큰은 우리가 만들지 않으므로
   Supabase 에 직접 물어보는 것이 가장 확실해요. */
async function whoIs(token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + token },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u.id : null;
}

async function dropDeadSub(endpoint) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/push_subscriptions?endpoint=eq." + encodeURIComponent(endpoint), {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
    });
  } catch (e) { /* 정리 실패는 다음 발송 때 다시 시도됩니다 */ }
}

async function dropFcmToken(token) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/fcm_tokens?token=eq." + encodeURIComponent(token), {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
    });
  } catch (e) { /* 정리 실패는 다음 발송 때 다시 시도됩니다 */ }
}

/* 안드로이드 앱으로 보냅니다. fcm.sql 을 안 넣었으면 조용히 0 을 돌려줘요. */
async function sendFcm(userId, payload) {
  if (!fcm.enabled()) return 0;
  let rows = [];
  try {
    rows = await db("fcm_tokens?user_id=eq." + userId + "&select=token");
  } catch (e) { return 0; }
  if (!rows.length) return 0;

  let sent = 0;
  await Promise.all(rows.map(async (row) => {
    const r = await fcm.sendOne(row.token, payload);
    if (r === "ok") sent++;
    else if (r === "dead") await dropFcmToken(row.token);
  }));
  return sent;
}

/* 한 사람의 모든 기기로 보냅니다 (웹 + 앱). */
async function sendTo(userId, payload) {
  const appSent = await sendFcm(userId, payload);
  const subs = await db("push_subscriptions?user_id=eq." + userId + "&select=endpoint,p256dh,auth");
  if (!subs.length) return appSent;
  let sent = appSent;
  const body = JSON.stringify(payload);
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        { TTL: 60 * 60 * 24 }   // 하루 안에 폰이 켜지면 그때 받습니다
      );
      sent++;
    } catch (e) {
      // 404·410 = 그 기기의 주소가 죽었습니다 (앱 삭제·알림 차단)
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await dropDeadSub(s.endpoint);
    }
  }));
  return sent;
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch (e) { return {}; }
}

const digits = (v) => String(v == null ? "" : v).replace(/[^0-9]/g, "");

/* 알림에 보여줄 한 줄. 줄바꿈을 없애고 짧게 자릅니다.
   길면 안드로이드가 알아서 자르지만, 그 전에 우리가 자르는 편이 깔끔해요. */
function oneLine(text, max) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/* ---------- 1:1 채팅 ---------- */
async function planChat(me, body) {
  const cid = digits(body.conversationId);
  if (!cid) return { error: "대화를 찾을 수 없어요.", code: 400 };

  const rows = await db("conversations?id=eq." + cid + "&select=id,user_a,user_b");
  const conv = rows && rows[0];
  if (!conv) return { error: "대화를 찾을 수 없어요.", code: 404 };

  // 참여자가 아니면 여기서 끝납니다.
  if (conv.user_a !== me && conv.user_b !== me) {
    return { error: "이 대화의 참여자가 아니에요.", code: 403 };
  }
  const peer = conv.user_a === me ? conv.user_b : conv.user_a;

  /* 알림에 첫마디를 보여줍니다. 연달아 보내면 알림창에서 뭐라고 했는지
     보이지 않으면 결국 앱을 열어봐야 하니까요.
     내용은 앱이 보낸 값이 아니라 서버가 원본에서 읽습니다 — 그래야
     남의 대화에 아무 문장이나 띄우는 일이 불가능해요. */
  let preview = "";
  const mid = digits(body.messageId);
  if (mid) {
    const msgs = await db("messages?id=eq." + mid + "&select=text,sender,conversation_id");
    const m = msgs && msgs[0];
    if (m && m.sender === me && String(m.conversation_id) === cid) preview = oneLine(m.text, 60);
  }

  return {
    targets: [{
      user: peer,
      payload: {
        title: "술방울",
        body: preview || "새 메시지가 도착했어요.",
        tag: "chat-" + cid,
        cid: Number(cid),
      },
    }],
  };
}

/* ---------- 댓글 · 답글 ---------- */
async function planComment(me, body) {
  const commentId = digits(body.commentId);
  if (!commentId) return { error: "댓글을 찾을 수 없어요.", code: 400 };

  // 정말 그 사람이 쓴 댓글인지 확인합니다.
  // 이걸 안 하면 아무나 "댓글 달았다"고 우겨서 알림을 쏠 수 있어요.
  const rows = await db(
    "comments?id=eq." + commentId + "&select=id,post_id,parent_id,author_id"
  );
  const c = rows && rows[0];
  if (!c) return { error: "댓글을 찾을 수 없어요.", code: 404 };
  if (c.author_id !== me) return { error: "본인이 쓴 댓글이 아니에요.", code: 403 };

  const posts = await db("posts?id=eq." + c.post_id + "&select=id,author_id,title");
  const post = posts && posts[0];
  if (!post) return { error: "글을 찾을 수 없어요.", code: 404 };

  const targets = [];
  const seen = new Set([me]);   // 내가 쓴 글에 내가 댓글 달면 알림 없어요

  // 답글이면 그 댓글을 쓴 사람에게 먼저
  if (c.parent_id) {
    const parents = await db("comments?id=eq." + c.parent_id + "&select=author_id");
    const pa = parents && parents[0] && parents[0].author_id;
    if (pa && !seen.has(pa)) {
      seen.add(pa);
      targets.push({
        user: pa,
        payload: { title: "바텐톡", body: "내 댓글에 답글이 달렸어요.", tag: "post-" + post.id, postId: Number(post.id) },
      });
    }
  }

  if (post.author_id && !seen.has(post.author_id)) {
    seen.add(post.author_id);
    targets.push({
      user: post.author_id,
      payload: { title: "바텐톡", body: "내 글에 댓글이 달렸어요.", tag: "post-" + post.id, postId: Number(post.id) },
    });
  }

  return { targets: targets };
}

/* ---------- 공감 (글) ----------
   "정말 눌렀는지"를 서버에서 확인합니다. likes 행이 실제로 있어야 해요.
   그래서 누르지도 않은 공감으로 남의 폰을 울릴 수 없습니다. */
async function planLike(me, body) {
  const postId = digits(body.postId);
  if (!postId) return { error: "글을 찾을 수 없어요.", code: 400 };

  const likes = await db("likes?post_id=eq." + postId + "&user_id=eq." + me + "&select=post_id");
  if (!likes.length) return { error: "공감 기록이 없어요.", code: 403 };

  const posts = await db("posts?id=eq." + postId + "&select=id,author_id");
  const post = posts && posts[0];
  if (!post || !post.author_id || post.author_id === me) return { targets: [] };

  return {
    targets: [{
      user: post.author_id,
      payload: { title: "바텐톡", body: "내 글에 공감이 눌렸어요.", tag: "post-" + postId, postId: Number(postId) },
    }],
  };
}

/* ---------- 공감 (댓글) ---------- */
async function planCommentLike(me, body) {
  const commentId = digits(body.commentId);
  if (!commentId) return { error: "댓글을 찾을 수 없어요.", code: 400 };

  const likes = await db("comment_likes?comment_id=eq." + commentId + "&user_id=eq." + me + "&select=comment_id");
  if (!likes.length) return { error: "공감 기록이 없어요.", code: 403 };

  const comments = await db("comments?id=eq." + commentId + "&select=id,author_id,post_id");
  const c = comments && comments[0];
  if (!c || !c.author_id || c.author_id === me) return { targets: [] };

  return {
    targets: [{
      user: c.author_id,
      payload: { title: "바텐톡", body: "내 댓글에 공감이 눌렸어요.", tag: "post-" + c.post_id, postId: Number(c.post_id) },
    }],
  };
}

/* ---------- 모임 참여 신청 ---------- */
async function planMeetJoin(me, body) {
  const meetId = digits(body.meetId);
  if (!meetId) return { error: "모임을 찾을 수 없어요.", code: 400 };

  const joins = await db("meet_participants?meet_id=eq." + meetId + "&user_id=eq." + me + "&select=meet_id");
  if (!joins.length) return { error: "참여 기록이 없어요.", code: 403 };

  const meets = await db("meets?id=eq." + meetId + "&select=id,host_id");
  const m = meets && meets[0];
  if (!m || !m.host_id || m.host_id === me) return { targets: [] };

  return {
    targets: [{
      user: m.host_id,
      payload: { title: "바텐톡", body: "내 모임에 참여 신청이 들어왔어요.", tag: "meet-" + meetId, meetId: Number(meetId) },
    }],
  };
}

/* ---------- 신고 → 운영자 전원 ----------
   신고 글에는 클라이언트가 id 를 붙이지 않아 번호로 짚을 수 없습니다.
   대신 "방금(5분 안) 내가 낸 신고가 실제로 있는지"를 확인해요.
   신고 한 건 없이 운영자 폰만 울리는 장난을 막습니다. */
async function planReport(me) {
  const recent = await db(
    "reports?reporter_id=eq." + me + "&order=created_at.desc&limit=1&select=created_at"
  );
  const last = recent && recent[0];
  if (!last || Date.now() - new Date(last.created_at).getTime() > 5 * 60 * 1000) {
    return { error: "신고 기록이 없어요.", code: 403 };
  }

  const admins = await db("admins?select=user_id");
  return {
    targets: admins
      .filter((a) => a.user_id && a.user_id !== me)
      .map((a) => ({
        user: a.user_id,
        payload: { title: "바텐톡 운영", body: "🚨 새 신고가 접수됐어요.", tag: "report", admin: true },
      })),
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST 만 받습니다." }); return; }
  if (!SUPABASE_URL || !SERVICE_KEY) { res.status(200).json({ ok: false, error: "서버 설정 없음" }); return; }
  if (!setupVapid()) { res.status(200).json({ ok: false, error: "푸시 키 없음" }); return; }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ ok: false, error: "로그인이 필요해요." }); return; }

  try {
    const me = await whoIs(token);
    if (!me) { res.status(401).json({ ok: false, error: "로그인을 확인할 수 없어요." }); return; }

    const body = await readJson(req);
    // type 이 없으면 예전 앱이 보낸 채팅 요청입니다.
    const type = body.type || "chat";

    let plan;
    if (type === "chat") plan = await planChat(me, body);
    else if (type === "comment") plan = await planComment(me, body);
    else if (type === "like") plan = await planLike(me, body);
    else if (type === "commentLike") plan = await planCommentLike(me, body);
    else if (type === "meetJoin") plan = await planMeetJoin(me, body);
    else if (type === "report") plan = await planReport(me);
    else { res.status(400).json({ ok: false, error: "알 수 없는 알림 종류예요." }); return; }

    if (plan.error) { res.status(plan.code || 400).json({ ok: false, error: plan.error }); return; }
    if (!plan.targets.length) { res.status(200).json({ ok: true, sent: 0 }); return; }

    const counts = await Promise.all(plan.targets.map((t) => sendTo(t.user, t.payload)));
    res.status(200).json({ ok: true, sent: counts.reduce((a, b) => a + b, 0) });
  } catch (e) {
    res.status(200).json({ ok: false, error: (e && e.message) || "알림을 보내지 못했어요." });
  }
};
