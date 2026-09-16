/* ============================================================
 *  빈자리 알림 (Vercel 서버리스 함수)
 *
 *  사장이 "오늘 자리 12개 남음 · 오늘 +1잔 · 원데이 9,000원" 을 누르면
 *    1) pass_seat_offers 에 한 줄 넣고 (supabase/pass-offer.sql)
 *    2) 이 가게 패스를 쓰는 회원 전원에게 푸시를 보냅니다.
 *
 *  로그인 토큰으로 본인을 확인하고, 그 사람이 정말 그 가게 운영자인지 서버에서 다시 봅니다.
 *  환경변수: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · VAPID_* (푸시)
 * ============================================================ */
const { sendTo, setupVapid } = require("./_push");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY } = process.env;
const q = encodeURIComponent;
const H = () => ({ apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json", Prefer: "return=representation" });
// 저장·수정은 JSON 헤더가 있어야 해요 (없으면 Supabase 가 거절하거나 빈 값을 돌려줘요)
async function db(path, init) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({ headers: H() }, init || {}));
  if (!r.ok) throw new Error("db " + r.status + " " + (await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

async function whoIs(token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + token } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch (e) { return {}; }
}
async function isOwner(uid, barKey) {
  const rows = await db("bar_owners?user_id=eq." + uid + "&bar_key=eq." + q(barKey) + "&select=bar_key");
  if (rows.length) return true;
  const adm = await db("admins?user_id=eq." + uid + "&select=user_id");
  return adm.length > 0;
}

/* 알림 보내기 */
async function offer(me, body) {
  const barKey = String(body.bar_key || "");
  if (!barKey) return { error: "가게가 빠졌어요." };
  if (!await isOwner(me.id, barKey)) return { error: "이 가게 운영자만 보낼 수 있어요." };
  const seats = Math.max(0, Math.min(500, Math.round(+body.seats_left || 0)));
  const bonus = Math.max(0, Math.min(5, Math.round(+body.bonus_drinks == null ? 1 : +body.bonus_drinks)));
  const oneday = body.oneday_price == null || body.oneday_price === "" ? null : Math.max(0, Math.round(+body.oneday_price || 0));
  const hours = Math.max(1, Math.min(12, +body.hours || 3));
  const st = (await db("bar_pass_settings?bar_key=eq." + q(barKey) + "&select=bar_name,enabled"))[0];
  const barName = (st && st.bar_name) || body.bar_name || "우리 가게";
  const expires = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  // 남발 방지 — 회원 폰에 알림이 너무 자주 가면 앱 알림을 꺼버려요
  const kstMidnight = new Date(Date.now() + 9 * 3600e3); kstMidnight.setUTCHours(0, 0, 0, 0);
  const since = new Date(kstMidnight.getTime() - 9 * 3600e3).toISOString();
  const todays = await db("pass_seat_offers?bar_key=eq." + q(barKey) + "&created_at=gte." + q(since) + "&select=created_at&order=created_at.desc");
  if (todays.length >= 4) return { error: "빈자리 알림은 하루 4번까지 보낼 수 있어요." };
  if (todays[0] && Date.now() - new Date(todays[0].created_at).getTime() < 10 * 60e3 && !body.silent) {
    return { error: "알림은 10분에 한 번만 보낼 수 있어요. 숫자만 바꾸려면 잠시 뒤에 다시 보내주세요." };
  }

  // 오늘 이미 살아 있는 알림은 닫고 새로 (숫자를 고쳐 다시 보내는 경우)
  await fetch(SUPABASE_URL + "/rest/v1/pass_seat_offers?bar_key=eq." + q(barKey) + "&expires_at=gt." + q(new Date().toISOString()), {
    method: "PATCH", headers: H(), body: JSON.stringify({ expires_at: new Date().toISOString() }),
  });
  const row = (await db("pass_seat_offers", { method: "POST", body: JSON.stringify({
    bar_key: barKey, bar_name: barName, seats_left: seats, bonus_drinks: bonus, oneday_price: oneday, expires_at: expires, created_by: me.id,
  }) }))[0];

  // 회원 전원에게 (팀원 포함) — 같은 사람은 한 번만
  let sent = 0, people = 0;
  if (!body.silent) {
    setupVapid();
    const members = await db("passes?bar_key=eq." + q(barKey) + "&status=in.(active,grace)&select=user_id");
    const ids = [...new Set(members.map((m) => m.user_id))];
    people = ids.length;
    const until = new Date(Date.now() + hours * 3600 * 1000 + 9 * 3600 * 1000).toISOString().slice(11, 16);
    const body2 = bonus ? `🪑 지금 자리 ${seats}개 · 오늘 오면 +${bonus}잔 (${until}까지)` : `🪑 지금 자리 ${seats}개 (${until}까지)`;
    for (const uid of ids) {
      try { sent += await sendTo(uid, { title: barName, body: body2, tag: "seat-offer", offer: barKey }); } catch (e) { /* 다음 사람 */ }
    }
  }
  return { ok: true, offer: row, people, sent };
}

/* 알림 닫기 */
async function close(me, body) {
  const barKey = String(body.bar_key || "");
  if (!barKey) return { error: "가게가 빠졌어요." };
  if (!await isOwner(me.id, barKey)) return { error: "이 가게 운영자만 닫을 수 있어요." };
  await fetch(SUPABASE_URL + "/rest/v1/pass_seat_offers?bar_key=eq." + q(barKey) + "&expires_at=gt." + q(new Date().toISOString()), {
    method: "PATCH", headers: H(), body: JSON.stringify({ expires_at: new Date().toISOString() }),
  });
  return { ok: true };
}

module.exports = async (req, res) => {
  const out = (status, payload) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(payload)); };
  if (req.method !== "POST") return out(405, { ok: false, error: "POST 만 받습니다." });
  if (!SUPABASE_URL || !SERVICE_KEY) return out(200, { ok: false, error: "서버 설정이 없어요." });
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return out(401, { ok: false, error: "로그인이 필요해요." });
  try {
    const me = await whoIs(token);
    if (!me) return out(401, { ok: false, error: "로그인을 확인할 수 없어요." });
    const body = await readJson(req);
    const fn = { offer, close }[body.action];
    if (!fn) return out(400, { ok: false, error: "알 수 없는 요청이에요." });
    const r = await fn(me, body);
    if (r.error) return out(200, { ok: false, error: r.error });
    return out(200, r);
  } catch (e) {
    return out(200, { ok: false, error: (e && e.message) || "처리하지 못했어요." });
  }
};
