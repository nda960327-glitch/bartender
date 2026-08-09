/* ============================================================
 *  푸시 공개키 알려주기 (Vercel 서버리스 함수)
 *
 *  브라우저가 알림을 구독하려면 서버의 공개키가 필요합니다.
 *  공개키는 숨길 값이 아니지만, 파일에 박아두면 키를 바꿀 때마다
 *  앱을 다시 배포해야 해요. 그래서 여기서 알려줍니다.
 *
 *  Vercel > Settings > Environment Variables
 *     VAPID_PUBLIC_KEY     ← 이 함수가 쓰는 값 (공개)
 *     VAPID_PRIVATE_KEY    ← push-send.js 만 씀 (비밀. 절대 클라이언트로 보내지 않음)
 *
 *  키 만드는 법 (한 번만):
 *     npx web-push generate-vapid-keys
 * ============================================================ */

module.exports = (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || "";
  // 키가 아직 없으면 앱이 "알림 준비 중"으로 조용히 넘어가게 합니다.
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ key: key || null, ready: !!key });
};
