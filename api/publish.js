/* ============================================================
 *  예약 콘텐츠 발행 (Vercel 서버리스 함수)
 *
 *  하는 일은 딱 하나입니다. Supabase 의 publish_due_content() 를 부릅니다.
 *  "지금 발행해도 되는지"는 전부 DB 함수가 판단해요 (조용한 시간·하루 상한·
 *  최소 간격·전체 스위치). 그래서 이 함수를 자주 불러도 안전합니다.
 *
 *  ⚠️ SUPABASE_SERVICE_ROLE_KEY 는 이 함수 안에서만 쓰입니다.
 *     브라우저로는 절대 나가지 않습니다.
 *
 *  Vercel > Settings > Environment Variables 에 넣을 값:
 *     SUPABASE_URL                 (예: https://xxxx.supabase.co)
 *     SUPABASE_SERVICE_ROLE_KEY    (대시보드 > API Keys > service_role)
 *     CRON_SECRET                  (아무 긴 랜덤 문자열. 아래 명령으로 생성)
 *
 *       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 *  부르는 방법 (둘 중 아무거나)
 *     Authorization: Bearer <CRON_SECRET>     ← Vercel Cron 이 자동으로 보냄
 *     x-cron-key: <CRON_SECRET>               ← 외부 크론(GitHub Actions 등)용
 *
 *  수동 테스트:
 *     curl -H "x-cron-key: $CRON_SECRET" https://barapp.kr/api/publish
 * ============================================================ */

const crypto = require("crypto");

const MAX_LIMIT = 5;

/* 길이가 달라도 타이밍 정보가 새지 않도록 해시로 맞춘 뒤 비교합니다. */
function secretMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  if (!given || !expected) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function presentedSecret(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const header = req.headers["x-cron-key"];
  if (typeof header === "string" && header) return header.trim();
  return "";
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRON_SECRET) {
    console.error("[publish] 환경변수가 비었습니다.", {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_SERVICE_ROLE_KEY,
      secret: !!CRON_SECRET,
    });
    return send(res, 500, { ok: false, error: "server_not_configured" });
  }

  if (!secretMatches(presentedSecret(req), CRON_SECRET)) {
    // 어떤 값이 틀렸는지는 알려주지 않습니다.
    return send(res, 401, { ok: false, error: "unauthorized" });
  }

  let limit = 1;
  try {
    const url = new URL(req.url, "http://localhost");
    const raw = parseInt(url.searchParams.get("limit") || "1", 10);
    if (Number.isFinite(raw)) limit = Math.min(Math.max(raw, 1), MAX_LIMIT);
  } catch (_) {
    /* 기본값 사용 */
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/publish_due_content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_limit: limit }),
    });

    const text = await r.text();

    if (!r.ok) {
      console.error("[publish] Supabase 오류", r.status, text);
      return send(res, 502, { ok: false, error: "supabase_error", status: r.status, detail: text });
    }

    let rows = [];
    try {
      rows = JSON.parse(text);
    } catch (_) {
      console.error("[publish] 응답을 해석하지 못했습니다:", text);
      return send(res, 502, { ok: false, error: "bad_response" });
    }
    if (!Array.isArray(rows)) rows = [];

    const published = rows.filter((x) => x && x.result === "published");
    const failed = rows.filter((x) => x && x.result !== "published");

    // 빈 응답이 정상입니다. 조용한 시간이거나, 간격이 안 됐거나, 큐가 비었거나.
    if (published.length) {
      console.log("[publish] 발행", published.map((x) => `${x.kind}#${x.published_id}`).join(", "));
    }
    if (failed.length) {
      console.error("[publish] 실패", JSON.stringify(failed));
    }

    return send(res, 200, {
      ok: true,
      published: published.length,
      failed: failed.length,
      rows,
    });
  } catch (e) {
    console.error("[publish] 예외", e);
    return send(res, 500, { ok: false, error: (e && e.message) || "unknown" });
  }
};
