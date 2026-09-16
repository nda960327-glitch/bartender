/* ============================================================
 *  바텐톡 서버 연결 설정
 *
 *  아래 두 값을 채우면 커뮤니티가 여러 기기에서 공유됩니다.
 *  비워두면 지금처럼 내 기기에만 저장되는 오프라인 모드로 동작해요.
 *
 *  값 찾는 곳:
 *    Supabase 대시보드 > Project Settings > API
 *      Project URL   →  SUPABASE_URL
 *      anon public   →  SUPABASE_ANON_KEY
 *
 *  ⚠️ anon key 는 공개되어도 되는 키입니다 (RLS 가 접근을 막아요).
 *     service_role 키는 절대 여기에 넣지 마세요.
 *
 *  준비 순서는 README.md 의 "Supabase 연결" 항목을 참고하세요.
 * ============================================================ */
window.BARTALK_CONFIG = {
  SUPABASE_URL: "https://dvharpjpemxpbrhhlolx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aGFycGpwZW14cGJyaGhsb2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMjE4ODUsImV4cCI6MjEwMTc5Nzg4NX0.HRkSGBh1I1Slo2S4sxannHLp1tlRIATr7JychadY94c",

  // 로그인 후 돌아올 운영 주소.
  // 평소엔 지금 보고 있는 주소를 그대로 쓰지만, 파일을 직접 열어 본 화면처럼
  // 주소를 만들 수 없는 경우에 이 값을 씁니다.
  // ⚠️ Supabase 대시보드 Authentication > URL Configuration 의
  //    Site URL 과 Redirect URLs 에도 같은 주소가 등록돼 있어야 링크가 여기로 옵니다.
  SITE_URL: "https://barapp.kr",

  // 바 상세에 지도를 띄우는 데 씁니다.
  // 카카오 개발자 > 내 애플리케이션 > 앱 키 > "JavaScript 키"
  //   ⚠️ 바 목록을 받아올 때 쓰는 REST API 키와 다른 값입니다.
  //   ⚠️ 같은 앱의 [플랫폼 > Web] 에 https://barapp.kr 을 등록해야 동작해요.
  // 비워두면 지도 자리에 안내만 뜨고 나머지는 그대로 동작합니다.
  KAKAO_JS_KEY: "443d5fab23ab4ed0cb7a8bd5a699a427",

  // 안드로이드 앱 내려받는 곳.
  // 비워두면 "앱으로 받기" 버튼이 아예 안 나옵니다.
  //   · 스토어 출시 후 → "https://play.google.com/store/apps/details?id=kr.barapp.bartalk"
  //   · 출시 전 APK 직접 배포 → "https://barapp.kr/app/bartalk.apk"
  APP_ANDROID_URL: "",

  // 하우스 패스를 앱 안에서 카드로 결제하게 하려면 (토스페이먼츠 정기결제)
  // 토스 개발자센터 > API 키 > "클라이언트 키" (test_ck_… 로 시작하면 테스트 모드)
  //   ⚠️ 비밀키(test_sk_…/live_sk_…)는 Vercel 환경변수 TOSS_SECRET_KEY 에만 넣습니다.
  // 비워두면 "가게에서 결제 → 운영자 승인" 방식만 보입니다.
  TOSS_CLIENT_KEY: "test_ck_vZnjEJeQVxzwMgXop7pz8PmOoBN0",

  // 이메일 로그인 봇 차단 (Cloudflare Turnstile) — "사이트 키"만 넣어요. 공개돼도 되는 값이에요.
  //   Cloudflare 대시보드 > Turnstile > 위젯 추가 (도메인 barapp.kr) → Site Key
  //   ⚠️ Secret Key 는 여기가 아니라 Supabase > Authentication > Attack Protection 에 넣습니다.
  //   ⚠️ 순서: 이 값을 넣고 배포한 "뒤에" Supabase 에서 캡차를 켜세요. 반대로 하면 이메일 로그인이 막혀요.
  // 비워두면 캡차 없이 동작합니다. (구글·카카오·네이버 로그인은 캡차와 상관없어요)
  TURNSTILE_SITE_KEY: "0x4AAAAAAE4sKDe14rlhhyaq",

  // 서버에서 가져올 최대 개수 (첫 로딩 속도와 관련)
  LIMIT_POSTS: 300,
  LIMIT_MEETS: 100,
  LIMIT_SPIRITS: 300,
};
