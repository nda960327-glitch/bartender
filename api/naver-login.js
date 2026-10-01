/* ============================================================
 *  네이버 로그인 (Vercel 서버리스 함수)
 *
 *  Supabase 는 네이버를 기본 지원하지 않아서, 이 함수가 중간에서
 *  네이버 인증을 처리하고 Supabase 세션을 발급받아 앱으로 돌려보냅니다.
 *
 *  흐름
 *    1) 앱  →  /api/naver-login            : 네이버 동의 화면으로 보냄
 *    2) 네이버 → /api/naver-login?code=..  : 코드를 토큰으로 교환, 프로필 조회
 *    3) 이 함수가 Supabase 계정을 찾거나 만들고 1회용 로그인 토큰을 발급
 *    4) 앱으로 되돌려보내면 앱이 그 토큰으로 세션을 완성
 *
 *  ⚠️ SUPABASE_SERVICE_ROLE_KEY 는 이 함수 안에서만 쓰입니다.
 *     브라우저로는 절대 나가지 않습니다.
 *
 *  Vercel > Settings > Environment Variables 에 넣을 값:
 *     NAVER_CLIENT_ID
 *     NAVER_CLIENT_SECRET
 *     SUPABASE_URL                 (예: https://xxxx.supabase.co)
 *     SUPABASE_SERVICE_ROLE_KEY    (대시보드 > API Keys > service_role)
 * ============================================================ */

const crypto = require("crypto");

const NAVER_AUTH = "https://nid.naver.com/oauth2.0/authorize";
const NAVER_TOKEN = "https://nid.naver.com/oauth2.0/token";
const NAVER_ME = "https://openapi.naver.com/v1/nid/me";

const STATE_COOKIE = "bt_naver_state";

function siteOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function redirectToApp(res, origin, params) {
  const q = new URLSearchParams(params).toString();
  res.setHeader("Set-Cookie", `${STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  res.statusCode = 302;
  res.setHeader("Location", `${origin}/?${q}`);
  res.end();
}

/* state = 시각.난수.서명
 * 예전에는 쿠키에만 적어 두고 대조했는데, 휴대폰에서 네이버 앱으로 로그인하면
 * 돌아올 때 다른 브라우저가 열려 쿠키가 없고, 그러면 무조건 "만료됐어요"로 튕겼어요.
 * 서명이 맞고 15분 안이면 우리가 만든 요청이 맞으니 받아줍니다. */
const STATE_TTL = 15 * 60 * 1000;
function signState(secret, body) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex").slice(0, 32);
}
function makeState(secret) {
  const body = Date.now().toString(36) + "." + crypto.randomBytes(8).toString("hex");
  return body + "." + signState(secret, body);
}
function validState(secret, state) {
  const parts = String(state || "").split(".");
  if (parts.length !== 3) return false;
  const body = parts[0] + "." + parts[1];
  const sig = signState(secret, body);
  if (sig.length !== parts[2].length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(parts[2]))) return false;
  const age = Date.now() - parseInt(parts[0], 36);
  return age >= 0 && age < STATE_TTL;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const hit = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

module.exports = async (req, res) => {
  const origin = siteOrigin(req);
  const url = new URL(req.url, origin);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const naverError = url.searchParams.get("error");

  const {
    NAVER_CLIENT_ID, NAVER_CLIENT_SECRET,
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;

  const configured = !!(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

  // 앱이 시작할 때 "네이버 버튼을 보여줘도 되는지" 물어보는 용도.
  // 설정 전에 버튼을 누르게 두면 화면만 왔다갔다 하고 끝나요.
  if (url.searchParams.get("probe") === "1") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.end(JSON.stringify({ configured }));
  }

  if (!configured) {
    return redirectToApp(res, origin, {
      auth_error: "네이버 로그인이 아직 설정되지 않았어요. 다른 방법으로 로그인해주세요.",
    });
  }

  const callback = `${origin}/api/naver-login`;

  /* ---------- 1) 네이버 동의 화면으로 ---------- */
  if (!code && !naverError) {
    const st = makeState(NAVER_CLIENT_SECRET);
    // 같은 브라우저로 돌아오면 쿠키와도 대조합니다 (CSRF 방지)
    res.setHeader("Set-Cookie",
      `${STATE_COOKIE}=${st}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
    const q = new URLSearchParams({
      response_type: "code",
      client_id: NAVER_CLIENT_ID,
      redirect_uri: callback,
      state: st,
    });
    res.statusCode = 302;
    res.setHeader("Location", `${NAVER_AUTH}?${q}`);
    return res.end();
  }

  /* ---------- 사용자가 동의를 취소한 경우 ---------- */
  if (naverError) {
    return redirectToApp(res, origin, {
      auth_error: naverError === "access_denied"
        ? "네이버 로그인을 취소했어요."
        : "네이버 로그인에 실패했어요.",
    });
  }

  /* ---------- 2) 돌아온 요청 검증 ---------- */
  const saved = readCookie(req, STATE_COOKIE);
  if (!code || !validState(NAVER_CLIENT_SECRET, state) || (saved && saved !== state)) {
    return redirectToApp(res, origin, {
      auth_error: "로그인 요청이 만료됐어요. 다시 시도해주세요. (N1)",
    });
  }

  try {
    // 코드 → 액세스 토큰
    const tokenRes = await fetch(`${NAVER_TOKEN}?` + new URLSearchParams({
      grant_type: "authorization_code",
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code, state,
    }));
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error((token.error_description || "토큰 발급 실패") + " (N2)");

    // 프로필 조회
    const meRes = await fetch(NAVER_ME, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const me = await meRes.json();
    if (me.resultcode !== "00" || !me.response) throw new Error("프로필 조회 실패");

    const naverId = me.response.id;
    if (!naverId) throw new Error("프로필 조회 실패");
    // 이메일 제공에 동의하지 않았거나 네이버 앱 설정에 이메일 항목이 없어도 로그인은 되게 해요.
    // 그때는 네이버 회원번호로 만든 주소를 계정 이름표로 씁니다 (실제로 메일이 가는 주소는 아니에요).
    const email = (me.response.email || "").trim().toLowerCase()
      || `naver-${String(naverId).toLowerCase().replace(/[^a-z0-9_-]/g, "")}@naver.barapp.kr`;

    /* ---------- 3) Supabase 계정 찾기 또는 만들기 ---------- */
    const admin = (path, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const found = await admin(`/auth/v1/admin/users?filter=${encodeURIComponent(email)}`);
    const foundJson = found.ok ? await found.json() : { users: [] };
    const existing = (foundJson.users || []).find(
      (u) => (u.email || "").toLowerCase() === email);

    if (!existing) {
      const created = await admin("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          email_confirm: true,   // 네이버가 확인해준 주소라 다시 확인하지 않아요
          user_metadata: { provider: "naver", naver_id: naverId, name: me.response.nickname || "" },
        }),
      });
      if (!created.ok) {
        const err = await created.text();
        // 찾기에서 놓쳤을 뿐 이미 있는 계정이면 그대로 로그인으로 넘어갑니다
        if (!/already|registered|exists/i.test(err)) throw new Error("계정 생성 실패: " + err.slice(0, 120));
      }
    }

    // 1회용 로그인 토큰 발급 (메일은 보내지 않고 토큰만 받아옵니다)
    const linkRes = await admin("/auth/v1/admin/generate_link", {
      method: "POST",
      body: JSON.stringify({ type: "magiclink", email }),
    });
    if (!linkRes.ok) {
      const err = await linkRes.text();
      throw new Error("로그인 토큰 발급 실패: " + err.slice(0, 120));
    }
    const link = await linkRes.json();
    const hashed = link.hashed_token || (link.properties && link.properties.hashed_token);
    if (!hashed) throw new Error("로그인 토큰을 받지 못했어요.");

    /* ---------- 4) 앱으로 복귀 ---------- */
    return redirectToApp(res, origin, { token_hash: hashed, type: "magiclink" });
  } catch (e) {
    return redirectToApp(res, origin, {
      auth_error: "네이버 로그인 처리 중 문제가 생겼어요: " + ((e && e.message) || "알 수 없는 오류"),
    });
  }
};
