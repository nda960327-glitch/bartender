/* ============================================================
 *  1:1 채팅 푸시 발송 (Vercel 서버리스 함수)
 *
 *  앱이 꺼져 있어도 알림이 가게 하는 부분입니다.
 *  메시지를 보낸 사람의 브라우저가 이 함수를 부르면,
 *  같은 대화의 상대에게만 알림을 보냅니다.
 *
 *  ⚠️ 부르는 쪽을 믿지 않습니다.
 *     - 로그인 토큰을 Supabase 에 물어 진짜인지 확인하고
 *     - 그 사람이 정말 그 대화의 참여자인지 서버에서 다시 확인합니다.
 *     그래서 남의 대화에 알림을 꽂아 넣을 수 없어요.
 *
 *  ⚠️ 메시지 내용은 알림에 넣지 않습니다.
 *     푸시 본문은 구글·애플의 푸시 서버를 지나갑니다. 종단간은 아니에요.
 *     "새 메시지가 왔어요" 까지만 보내고, 내용은 앱에서 확인하게 합니다.
 *
 *  Vercel > Settings > Environment Variables
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY   ← 이 함수 안에서만 쓰입니다. 브라우저로 안 나갑니다.
 *     VAPID_PUBLIC_KEY
 *     VAPID_PRIVATE_KEY           ← 비밀
 *     VAPID_SUBJECT               ← 예: mailto:help@barapp.kr
 * ============================================================ */

const webpush = require("web-push");

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

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch (e) { return {}; }
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
    const cid = String(body.conversationId || "").replace(/[^0-9]/g, "");
    if (!cid) { res.status(400).json({ ok: false, error: "대화를 찾을 수 없어요." }); return; }

    const rows = await db("conversations?id=eq." + cid + "&select=id,user_a,user_b");
    const conv = rows && rows[0];
    if (!conv) { res.status(404).json({ ok: false, error: "대화를 찾을 수 없어요." }); return; }

    // 참여자가 아니면 여기서 끝납니다. 남의 대화에 알림을 꽂을 수 없어요.
    if (conv.user_a !== me && conv.user_b !== me) {
      res.status(403).json({ ok: false, error: "이 대화의 참여자가 아니에요." });
      return;
    }
    const peer = conv.user_a === me ? conv.user_b : conv.user_a;

    const subs = await db("push_subscriptions?user_id=eq." + peer + "&select=endpoint,p256dh,auth");
    if (!subs.length) { res.status(200).json({ ok: true, sent: 0, reason: "상대가 알림을 켜두지 않았어요." }); return; }

    // 내용은 싣지 않습니다 (위 주석 참고).
    const payload = JSON.stringify({
      title: "바텐톡",
      body: "새 메시지가 도착했어요.",
      tag: "chat-" + cid,
      cid: Number(cid),
    });

    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 }   // 하루 안에 폰이 켜지면 그때 받습니다
        );
        sent++;
      } catch (e) {
        // 404·410 = 그 기기의 주소가 죽었습니다 (앱 삭제·알림 차단)
        if (e && (e.statusCode === 404 || e.statusCode === 410)) await dropDeadSub(s.endpoint);
      }
    }));

    res.status(200).json({ ok: true, sent: sent });
  } catch (e) {
    res.status(200).json({ ok: false, error: (e && e.message) || "알림을 보내지 못했어요." });
  }
};
