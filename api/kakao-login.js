/* ============================================================
 *  카카오 로그인 길잡이 (Vercel 서버리스 함수)
 *
 *  왜 필요한가
 *    Supabase 는 카카오에 항상 "이메일"까지 달라고 요청합니다.
 *    그런데 카카오는 비즈 앱이 아니면 이메일 동의항목을 켤 수 없어서,
 *    그대로 보내면 카카오가 KOE205 오류 화면을 띄워요.
 *
 *  하는 일
 *    1) 앱이 Supabase 가 만든 로그인 주소를 ?u= 로 넘겨줍니다
 *    2) 이 함수가 그 주소를 대신 열어, Supabase 가 돌려주는 "카카오로 가라"는 주소를 받아요
 *    3) 거기서 요청 항목(scope)을 닉네임·프로필 사진만 남기고 사용자를 카카오로 보냅니다
 *    이후 흐름(카카오 → Supabase → 앱)은 원래와 똑같습니다. 비밀 키는 전혀 쓰지 않아요.
 *
 *  나중에 카카오 콘솔에서 비즈 앱으로 바꾸고 이메일 동의항목을 켜면
 *  SCOPE 에 account_email 을 더하거나, 이 함수를 안 거치게 해도 됩니다.
 *
 *  Vercel 환경변수: SUPABASE_URL (네이버 로그인과 같은 값)
 * ============================================================ */

const SCOPE = "profile_nickname profile_image";
const KAKAO_HOST = "kauth.kakao.com";

function siteOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function backToApp(res, origin, message) {
  res.statusCode = 302;
  res.setHeader("Location", `${origin}/?${new URLSearchParams({ auth_error: message })}`);
  res.end();
}

module.exports = async (req, res) => {
  const origin = siteOrigin(req);
  const url = new URL(req.url, origin);
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");

  // 앱이 시작할 때 "이 길잡이를 쓸 수 있는지" 물어보는 용도
  if (url.searchParams.get("probe") === "1") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.end(JSON.stringify({ configured: !!base }));
  }

  if (!base) return backToApp(res, origin, "카카오 로그인이 아직 설정되지 않았어요. 다른 방법으로 로그인해주세요.");

  // 우리 Supabase 의 카카오 로그인 주소만 받습니다 (아무 주소나 대신 열어주면 안 되니까요)
  let target;
  try { target = new URL(url.searchParams.get("u") || ""); } catch (e) { target = null; }
  const ok = target
    && target.origin === new URL(base).origin
    && target.pathname === "/auth/v1/authorize"
    && target.searchParams.get("provider") === "kakao";
  if (!ok) return backToApp(res, origin, "카카오 로그인 주소가 올바르지 않아요. 다시 시도해주세요.");

  try {
    const r = await fetch(target.toString(), { redirect: "manual" });
    const loc = r.headers.get("location");
    const next = loc ? new URL(loc) : null;
    if (!next || next.host !== KAKAO_HOST) {
      return backToApp(res, origin, "카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    next.searchParams.set("scope", SCOPE);
    res.statusCode = 302;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Location", next.toString());
    res.end();
  } catch (e) {
    backToApp(res, origin, "카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
  }
};
