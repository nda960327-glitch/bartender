/* 푸시 발송 공통 조각 — pass-cron.js · pass-billing.js 가 씁니다.
 * (push-send.js 에 같은 코드가 있지만, 그 파일은 요청 처리기라 require 할 수 없어요.)
 * Vercel 은 api/ 안에서 _ 로 시작하는 파일을 함수로 노출하지 않습니다. */
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

async function db(path, init) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({
    headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
  }, init || {}));
  if (!r.ok) throw new Error("db " + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

async function sendTo(userId, payload) {
  if (!setupVapid()) return 0;
  const subs = await db("push_subscriptions?user_id=eq." + userId + "&select=endpoint,p256dh,auth");
  let sent = 0;
  const body = JSON.stringify(payload);
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24 });
      sent++;
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        await db("push_subscriptions?endpoint=eq." + encodeURIComponent(s.endpoint), { method: "DELETE" }).catch(() => {});
      }
    }
  }));
  return sent;
}

module.exports = { setupVapid, sendTo, db };
