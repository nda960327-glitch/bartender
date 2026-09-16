/* ============================================================
 *  서버 상태 확인 — GET /api/health
 *
 *  UptimeRobot · Better Stack 같은 무료 감시 서비스에 이 주소를 넣어두면
 *  서버나 데이터베이스가 멈췄을 때 바로 문자·메일이 옵니다.
 *  장애를 손님보다 먼저 알아야 공지하고 보상할 수 있어요.
 *
 *  응답: 200 { ok: true, db: "ok", ms } · 503 { ok: false, db: "down" }
 *  비밀 정보는 내보내지 않아요.
 * ============================================================ */
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const t0 = Date.now();
  const out = { ok: true, app: "bartalk", at: new Date().toISOString(), db: "skip" };
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(SUPABASE_URL + "/rest/v1/bar_pass_settings?select=bar_key&limit=1", {
        headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
        signal: ctl.signal,
      });
      clearTimeout(timer);
      out.db = r.ok ? "ok" : "error " + r.status;
      if (!r.ok) out.ok = false;
    } catch (e) {
      out.ok = false;
      out.db = "down";
    }
  }
  out.ms = Date.now() - t0;
  res.statusCode = out.ok ? 200 : 503;
  res.end(JSON.stringify(out));
};
