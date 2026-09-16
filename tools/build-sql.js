/* 하우스 패스 업데이트 SQL 묶기
 *   node tools/build-sql.js  →  supabase/pass-update-all.sql
 *
 * pass.sql · pass-member.sql · pass-lifecycle.sql · phone.sql 을 이미 넣은 서버에
 * 그 뒤에 나온 파일을 "순서대로 한 번에" 넣게 합니다. 순서가 틀리면 함수가 옛 버전으로 덮여요.
 * 전부 한 트랜잭션이라 중간에 하나라도 실패하면 아무것도 바뀌지 않아요.
 */
const fs = require("fs");
const path = require("path");

const ORDER = [
  ["pass-refund.sql", "환불 계산기 설정 · pass_json(총 잔수)"],
  ["pass-owner.sql", "운영자 추가 (같은 닉네임 구분)"],
  ["pass-once.sql", "한 번만 결제 할증"],
  ["pass-capacity.sql", "상품별 정원 · 신청 규칙"],
  ["pass-goal.sql", "월 구독 매출 목표"],
  ["pass-dashboard-fix.sql", "지표 집계 오류 수정"],
  ["guard.sql", "방어선 — 요청 횟수 제한 · 칸 잠금 · 기록 · 장애 보상 · 수기 기록"],
  ["pass-offer.sql", "빈자리 알림 · 스캔 보너스"],
  ["pass-gift.sql", "잔 선물 링크"],
];

const dir = path.join(__dirname, "..", "supabase");
const parts = [
  "-- ============================================================",
  "--  하우스 패스 업데이트 한 번에 넣기 (자동 생성 — 직접 고치지 말고 tools/build-sql.js 로 다시 만드세요)",
  "--",
  "--  먼저 들어가 있어야 하는 것: pass.sql · pass-member.sql · pass-lifecycle.sql · phone.sql",
  "--  Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run.",
  "--  여러 번 돌려도 안전하고, 중간에 실패하면 전부 되돌려져요.",
  "--",
  "--  들어있는 것:",
  ...ORDER.map(([f, d], i) => `--   ${i + 1}. ${f.padEnd(24)} ${d}`),
  "-- ============================================================",
  "",
  "begin;",
  "",
];
for (const [f] of ORDER) {
  const body = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n").trim();
  if (/^\s*(begin|commit)\s*;/im.test(body)) throw new Error(f + " 안에 begin/commit 이 있어요. 빼고 다시 해주세요.");
  parts.push(`-- ##################### ${f} #####################`, body, "");
}
parts.push("commit;", "");
parts.push("-- 끝. 오류 없이 끝났다면 앱을 새로고침하세요.", "");
fs.writeFileSync(path.join(dir, "pass-update-all.sql"), parts.join("\n"));
console.log("supabase/pass-update-all.sql 만들었어요 (" + ORDER.length + "개 파일)");
