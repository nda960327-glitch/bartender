/* ============================================================
 *  하우스 패스 — 앱 안 카드 결제 (토스페이먼츠 정기결제)
 *
 *  흐름
 *    앱: 토스 SDK requestBillingAuth → 카드 인증 → authKey 를 들고 돌아옴
 *    앱 → 여기 action=issue : 빌링키 발급 + 첫 달 결제 + 패스 활성화
 *    앱 → action=card       : 등록된 카드 라벨 보기
 *    앱 → action=renew      : 자동 갱신 켜기/끄기
 *    앱 → action=remove     : 카드 삭제 (자동 갱신도 꺼짐)
 *
 *  손님 로그인(Supabase JWT)으로 본인임을 확인하고, 빌링키·비밀키는 서버에만 둡니다.
 *  환경변수: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · TOSS_SECRET_KEY
 * ============================================================ */
const toss = require("./_toss");
const { sendTo, setupVapid } = require("./_push");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY } = process.env;
const H = () => ({ apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json", Prefer: "return=representation" });

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
function kstToday(offset) {
  return new Date(Date.now() + 9 * 3600 * 1000 + (offset || 0) * 86400 * 1000).toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const q = encodeURIComponent;

/* 카드 등록 + 첫 결제 + 패스 발급 */
async function issue(me, body) {
  const { authKey, customerKey, planId } = body;
  if (!authKey || !customerKey || !planId) return { error: "결제 정보가 빠졌어요." };
  if (customerKey !== me.id) return { error: "본인 카드만 등록할 수 있어요." };

  const plan = (await db("pass_plans?id=eq." + q(planId) + "&active=is.true&select=*"))[0];
  if (!plan) return { error: "지금 판매 중인 상품이 아니에요." };
  const st = (await db("bar_pass_settings?bar_key=eq." + q(plan.bar_key) + "&select=*"))[0];
  if (!st || !st.enabled) return { error: "이 가게는 아직 패스를 받지 않아요." };
  const dup = await db("passes?user_id=eq." + me.id + "&bar_key=eq." + q(plan.bar_key) + "&status=in.(active,grace)&select=id");
  if (dup.length) return { error: "이 가게에 이미 쓰고 있는 패스가 있어요." };

  const k = await toss.issue(authKey, customerKey);
  if (!k.ok) return { error: "카드 등록 실패: " + k.error };
  await db("pass_billing?on_conflict=user_id,bar_key", { method: "POST", headers: Object.assign(H(), { Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({ user_id: me.id, bar_key: plan.bar_key, customer_key: customerKey, billing_key: k.billingKey, card_label: k.cardLabel }) });

  const orderId = toss.orderId("new");
  const pay = await toss.charge(k.billingKey, { customerKey, amount: plan.price, orderId, orderName: `${st.bar_name} ${plan.name}` });
  if (!pay.ok) {
    await db("pass_payments", { method: "POST", body: JSON.stringify({ user_id: me.id, bar_key: plan.bar_key, order_id: orderId, amount: plan.price, status: "failed", fail_reason: pay.error }) });
    return { error: "결제 실패: " + pay.error };
  }

  // 신청 중이던 게 있으면 그걸 활성화, 없으면 새로 만듭니다 (service role 은 신청 고정 트리거를 안 탑니다)
  const start = kstToday(0), end = addDays(start, plan.duration_days - 1);
  const fields = {
    bar_key: plan.bar_key, bar_name: st.bar_name, plan_id: plan.id, plan_name: plan.name, user_id: me.id,
    status: "active", kind: plan.kind, days: plan.days, drinks_per_day: plan.drinks_per_day, monthly_cap: plan.monthly_cap,
    team_size: plan.team_size, duration_days: plan.duration_days, price: plan.price,
    starts_at: start, ends_at: end, paid_via: "toss", auto_renew: !!body.autoRenew && plan.kind !== "oneday",
    approved_at: new Date().toISOString(),
  };
  // 회원 이름·번호 (pass-member.sql 이 있는 서버만). 숫자만 남기고, 없으면 빼서 보냅니다.
  const mName = String(body.memberName || "").trim().slice(0, 20);
  const mPhone = String(body.memberPhone || "").replace(/\D/g, "");
  if (mPhone) { fields.member_name = mName; fields.member_phone = mPhone; }
  const pending = (await db("passes?user_id=eq." + me.id + "&bar_key=eq." + q(plan.bar_key) + "&status=eq.requested&select=id"))[0];
  const pass = pending
    ? (await db("passes?id=eq." + pending.id, { method: "PATCH", body: JSON.stringify(fields) }))[0]
    : (await db("passes", { method: "POST", body: JSON.stringify(fields) }))[0];

  await db("pass_payments", { method: "POST", body: JSON.stringify({
    pass_id: pass.id, user_id: me.id, bar_key: plan.bar_key, order_id: orderId, amount: plan.price,
    status: "paid", receipt_url: pay.receiptUrl || null, paid_at: new Date().toISOString(),
  }) });

  // 운영자에게 알림
  const owners = await db("bar_owners?bar_key=eq." + q(plan.bar_key) + "&select=user_id");
  const prof = (await db("profiles?id=eq." + me.id + "&select=nick"))[0];
  await Promise.all(owners.map((o) => sendTo(o.user_id, { title: st.bar_name || "하우스 패스", body: `🎫 ${(prof && prof.nick) || "손님"}님이 ${plan.name}을 카드로 결제했어요 (${plan.price.toLocaleString("ko-KR")}원).`, tag: "pass-paid" }).catch(() => 0)));

  return { ok: true, pass, receiptUrl: pay.receiptUrl || null, cardLabel: k.cardLabel };
}

async function card(me, body) {
  const row = (await db("pass_billing?user_id=eq." + me.id + "&bar_key=eq." + q(body.barKey || "") + "&select=card_label,created_at"))[0];
  return { ok: true, card: row ? row.card_label : null };
}

async function renew(me, body) {
  const p = (await db("passes?id=eq." + q(body.passId) + "&user_id=eq." + me.id + "&select=id,bar_key,kind,team_id"))[0];
  if (!p) return { error: "내 패스가 아니에요." };
  if (p.team_id || p.kind === "oneday") return { error: "이 패스는 자동 갱신을 켤 수 없어요." };
  if (body.on) {
    const bill = (await db("pass_billing?user_id=eq." + me.id + "&bar_key=eq." + q(p.bar_key) + "&select=card_label"))[0];
    if (!bill) return { error: "등록된 카드가 없어요. 카드로 결제한 패스만 자동 갱신할 수 있어요." };
  }
  await db("passes?id=eq." + p.id, { method: "PATCH", body: JSON.stringify({ auto_renew: !!body.on, paid_via: "toss", next_retry_at: null, renew_attempts: 0 }) });
  return { ok: true, auto_renew: !!body.on };
}

async function remove(me, body) {
  await db("pass_billing?user_id=eq." + me.id + "&bar_key=eq." + q(body.barKey || ""), { method: "DELETE" });
  await db("passes?user_id=eq." + me.id + "&bar_key=eq." + q(body.barKey || "") + "&auto_renew=is.true", { method: "PATCH", body: JSON.stringify({ auto_renew: false }) });
  return { ok: true };
}

module.exports = async (req, res) => {
  const out = (status, payload) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(payload)); };
  if (req.method !== "POST") return out(405, { ok: false, error: "POST 만 받습니다." });
  if (!SUPABASE_URL || !SERVICE_KEY) return out(200, { ok: false, error: "서버 설정이 없어요." });
  if (!toss.enabled()) return out(200, { ok: false, error: "앱 안 결제가 아직 열리지 않았어요. 가게에서 결제해 주세요." });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return out(401, { ok: false, error: "로그인이 필요해요." });
  try {
    const me = await whoIs(token);
    if (!me) return out(401, { ok: false, error: "로그인을 확인할 수 없어요." });
    setupVapid();
    const body = await readJson(req);
    const fn = { issue, card, renew, remove }[body.action];
    if (!fn) return out(400, { ok: false, error: "알 수 없는 요청이에요." });
    const r = await fn(me, body);
    if (r.error) return out(200, { ok: false, error: r.error });
    return out(200, r);
  } catch (e) {
    return out(200, { ok: false, error: (e && e.message) || "처리하지 못했어요." });
  }
};
