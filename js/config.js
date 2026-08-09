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

  // 서버에서 가져올 최대 개수 (첫 로딩 속도와 관련)
  LIMIT_POSTS: 300,
  LIMIT_MEETS: 100,
  LIMIT_SPIRITS: 300,
};
