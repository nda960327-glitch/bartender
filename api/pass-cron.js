/* ============================================================
 *  하우스 패스 — 하루 한 번 도는 정리 작업
 *
 *  1) 기간이 끝난 패스를 '만료'로 바꿉니다 (자동 갱신이 아닌 것)
 *  2) 3일 뒤 끝나는 패스의 손님에게 알림을 보냅니다
 *  3) 자동 갱신 패스는 토스 빌링키로 다시 결제합니다
 *  4) 정리 — 72시간 넘은 미결제 신청 취소, 기한 지난 선물 만료, 오래된 요청 기록 삭제
 *     실패하면 D+1 · D+3 · D+5 에 다시 시도하고, 그동안은 '유예' 상태로 계속 쓸 수 있어요.
 *     세 번 다 실패하면 만료 처리 + 알림.
 *
 *  호출: .github/workflows/pass-cron.yml 이 매일 아침 x-cron-key 로 두드립니다.
 *  환경변수: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · CRON_SECRET
 *            TOSS_SECRET_KEY (정기결제를 쓸 때만) · VAPID_* (알림을 쓸 때만)
 * ============================================================ */
const crypto = require("crypto");
const { sendTo, setupVapid } = require("./_push");
const toss = require("./_toss");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, CRON_SECRET } = process.env;
const RETRY_DAYS = [1, 2, 2];   // 실패 후 1일 → 다시 2일 → 다시 2일 (D+1, D+3, D+5)

function secretMatches(given, expected) {
  if (!given || !expected) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}
function presentedSecret(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const h = req.headers["x-cron-key"];
  return typeof h === "string" ? h.trim() : "";
}
function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

const H = () => ({ apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "Content-Type": "application/json" });
async function db(path, init) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({ headers: Object.assign(H(), { Prefer: "return=representation" }) }, init || {}));
  if (!r.ok) throw new Error("db " + r.status + " " + path + " " + (await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}
const patch = (id, body) => db("passes?id=eq." + id, { method: "PATCH", body: JSON.stringify(body) });

/* 한국 날짜 (서버는 UTC 라서 직접 맞춥니다) */
function kstDate(offsetDays) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + (offsetDays || 0) * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function expireEnded(today, out) {
  const rows = await db("passes?status=in.(active,grace)&ends_at=lt." + today + "&auto_renew=is.false&select=id,user_id,bar_name,plan_name,team_id");
  for (const p of rows) {
    await patch(p.id, { status: "expired" });
    out.expired++;
    if (!p.team_id) {
      await sendTo(p.user_id, { title: p.bar_name || "하우스 패스", body: `🎫 ${p.plan_name} 패스 기간이 끝났어요. 가게에서 다시 신청할 수 있어요.`, tag: "pass-expired" }).catch(() => {});
    }
  }
}

async function notifyEndingSoon(today, out) {
  const target = kstDate(3);
  const rows = await db("passes?status=eq.active&auto_renew=is.false&team_id=is.null&expiry_notified_at=is.null&ends_at=eq." + target + "&select=id,user_id,bar_name,plan_name,ends_at");
  for (const p of rows) {
    const n = await sendTo(p.user_id, { title: p.bar_name || "하우스 패스", body: `🎫 ${p.plan_name} 패스가 3일 뒤(${p.ends_at.slice(5).replace("-", ".")}) 끝나요. 가게에서 연장해 주세요.`, tag: "pass-ending" }).catch(() => 0);
    await patch(p.id, { expiry_notified_at: new Date().toISOString() });
    out.notified += n ? 1 : 0;
  }
}

async function renewDue(today, out) {
  if (!toss.enabled()) return;
  const now = new Date().toISOString();
  // 끝난 날이 지났고(ends_at < today), 재시도 시각이 됐거나 첫 시도인 자동 갱신 패스
  const rows = await db("passes?status=in.(active,grace)&auto_renew=is.true&paid_via=eq.toss&team_id=is.null&ends_at=lt." + today +
    "&or=(next_retry_at.is.null,next_retry_at.lte." + encodeURIComponent(now) + ")&select=*");
  for (const p of rows) {
    const bill = (await db("pass_billing?user_id=eq." + p.user_id + "&bar_key=eq." + encodeURIComponent(p.bar_key) + "&select=customer_key,billing_key"))[0];
    if (!bill) { await patch(p.id, { auto_renew: false, last_payment_error: "등록된 카드가 없어요." }); continue; }
    const orderId = toss.orderId(p.id);
    const r = await toss.charge(bill.billing_key, {
      customerKey: bill.customer_key, amount: p.price, orderId,
      orderName: `${p.bar_name} ${p.plan_name} (자동 갱신)`,
    });
    if (r.ok) {
      const start = addDays(p.ends_at, 1);
      await patch(p.id, {
        status: "active", starts_at: start, ends_at: addDays(start, p.duration_days - 1),
        renew_attempts: 0, next_retry_at: null, last_payment_error: null, expiry_notified_at: null,
      });
      await db("pass_payments", { method: "POST", body: JSON.stringify({
        pass_id: p.id, user_id: p.user_id, bar_key: p.bar_key, order_id: orderId, amount: p.price,
        status: "paid", receipt_url: r.receiptUrl || null, paid_at: new Date().toISOString(),
      }) });
      // 팀원 패스도 같이 연장
      if (p.kind === "team") await db("passes?team_id=eq." + p.id + "&status=in.(active,grace)", { method: "PATCH", body: JSON.stringify({ ends_at: addDays(start, p.duration_days - 1) }) });
      await sendTo(p.user_id, { title: p.bar_name, body: `🎫 ${p.plan_name} 패스가 자동으로 연장됐어요 (${p.price.toLocaleString("ko-KR")}원).`, tag: "pass-renewed" }).catch(() => {});
      out.renewed++;
    } else {
      const attempts = (p.renew_attempts || 0) + 1;
      await db("pass_payments", { method: "POST", body: JSON.stringify({
        pass_id: p.id, user_id: p.user_id, bar_key: p.bar_key, order_id: orderId, amount: p.price,
        status: "failed", fail_reason: r.error || "결제 실패",
      }) });
      if (attempts >= RETRY_DAYS.length) {
        await patch(p.id, { status: "expired", renew_attempts: attempts, next_retry_at: null, last_payment_error: r.error || "결제 실패" });
        await sendTo(p.user_id, { title: p.bar_name, body: `🎫 카드 결제가 계속 실패해서 ${p.plan_name} 패스가 끝났어요. 가게에서 다시 신청해 주세요.`, tag: "pass-failed" }).catch(() => {});
        out.failed++;
      } else {
        const next = new Date(Date.now() + RETRY_DAYS[attempts] * 86400 * 1000).toISOString();
        await patch(p.id, { status: "grace", renew_attempts: attempts, next_retry_at: next, last_payment_error: r.error || "결제 실패" });
        await sendTo(p.user_id, { title: p.bar_name, body: `🎫 패스 자동 결제가 실패했어요 (${r.error || "카드 오류"}). 며칠 뒤 다시 시도하고, 그동안은 그대로 쓸 수 있어요.`, tag: "pass-retry" }).catch(() => {});
        out.retrying++;
      }
    }
  }
}

/* 4) 정리 — 72시간 넘은 미결제 신청 취소 · 기한 지난 선물 · 오래된 요청 기록 (supabase/guard.sql) */
async function housekeeping(today, out) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/pass_housekeeping", { method: "POST", headers: H(), body: "{}" });
  if (r.status === 404) { out.housekeeping = "guard.sql 미설치"; return; }
  if (!r.ok) throw new Error("housekeeping " + r.status + " " + (await r.text()).slice(0, 200));
  out.housekeeping = await r.json();
}

module.exports = async (req, res) => {
  if (!SUPABASE_URL || !SERVICE_KEY || !CRON_SECRET) return send(res, 500, { ok: false, error: "server_not_configured" });
  if (!secretMatches(presentedSecret(req), CRON_SECRET)) return send(res, 401, { ok: false, error: "unauthorized" });
  setupVapid();
  const out = { ok: true, today: kstDate(0), expired: 0, notified: 0, renewed: 0, retrying: 0, failed: 0, errors: [] };
  for (const step of [renewDue, expireEnded, notifyEndingSoon, housekeeping]) {
    try { await step(out.today, out); } catch (e) { out.errors.push(step.name + ": " + (e && e.message)); }
  }
  return send(res, 200, out);
};
