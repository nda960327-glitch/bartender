/* 심사용 계정 만들기 (토스페이먼츠 · 구글 플레이 · 앱스토어 심사자에게 주는 ID/PW)
 *
 *   node tools/make-review-account.mjs                 → review@barapp.kr
 *   node tools/make-review-account.mjs 다른@주소.com     → 그 주소로
 *
 * · .env.local 의 service_role 키로 Supabase 관리자 API를 불러 계정을 만들어요 (이미 있으면 비밀번호만 새로 정해요).
 * · 비밀번호는 무작위로 만들고 화면에 찍지 않아요. 프로젝트 루트의 _review-account.md 에만 적어요 (.gitignore 의 _* 규칙으로 커밋되지 않아요).
 * · 앱 로그인 화면의 "비밀번호가 있는 계정" 칸으로 들어가요. (js/sync.js signInWithPassword)
 * · 심사가 다 끝나면 Supabase > Authentication > Users 에서 이 계정을 지우거나, 이 스크립트를 다시 돌려 비밀번호를 바꾸세요.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const envFile = path.join(ROOT, ".env.local");
if (!fs.existsSync(envFile)) { console.error(".env.local 이 없어요. .env.example 을 복사해 service_role 키를 채우세요."); process.exit(1); }
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; })
);
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error(".env.local 에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요해요."); process.exit(1); }

const email = (process.argv[2] || "review@barapp.kr").trim().toLowerCase();
// 읽기 쉬운 무작위 비밀번호 14자 (헷갈리는 0/O/1/l 제외)
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const password = Array.from(crypto.randomBytes(14), (b) => ALPH[b % ALPH.length]).join("");

const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
async function api(method, p, body) {
  const r = await fetch(URL_ + "/auth/v1/admin/" + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}

let userId = null;
const made = await api("POST", "users", { email, password, email_confirm: true, user_metadata: { review_account: true, nick: "심사용" } });
if (made.ok) {
  userId = made.j.id;
} else if (/already|exists|registered/i.test(made.j.msg || made.j.message || made.j.error_description || "") || made.status === 422) {
  // 이미 있으면 찾아서 비밀번호만 새로
  const list = await api("GET", "users?page=1&per_page=1000");
  const u = (list.j.users || []).find((x) => (x.email || "").toLowerCase() === email);
  if (!u) { console.error("계정이 이미 있다는데 목록에서 못 찾았어요:", made.j); process.exit(1); }
  userId = u.id;
  const upd = await api("PUT", "users/" + userId, { password, email_confirm: true, user_metadata: { review_account: true, nick: "심사용" } });
  if (!upd.ok) { console.error("비밀번호 변경 실패:", upd.j); process.exit(1); }
} else {
  console.error("계정 만들기 실패:", made.status, made.j);
  process.exit(1);
}

const out = path.join(ROOT, "_review-account.md");
fs.writeFileSync(out, `# 심사용 계정 (커밋되지 않는 파일)

만든 날짜: ${new Date().toISOString().slice(0, 10)}
로그인 방법: barapp.kr → "이메일로 시작하기" → 이메일 입력 → "비밀번호가 있는 계정" → 비밀번호 입력 → 로그인

ID: ${email}
PW: ${password}
user id: ${userId}

심사가 끝나면 Supabase > Authentication > Users 에서 이 계정을 삭제하세요.
`, "utf8");
console.log(`심사용 계정 준비 완료 (${email}). ID/PW 는 _review-account.md 에 적어 뒀어요 — 메일에 붙여 넣은 뒤 파일은 지워도 돼요.`);
