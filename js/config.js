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
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // 서버에서 가져올 최대 개수 (첫 로딩 속도와 관련)
  LIMIT_POSTS: 300,
  LIMIT_MEETS: 100,
  LIMIT_SPIRITS: 300,
};
