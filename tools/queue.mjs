#!/usr/bin/env node
/* ============================================================
 *  바텐톡 콘텐츠 큐 관리 도구
 *
 *  흐름은 이렇습니다.
 *    seed    도감에서 초안을 만들어 큐에 넣습니다 (status = draft)
 *    list    초안 목록을 봅니다
 *    show    한 건을 통째로 읽어봅니다        ← 여기서 사람이 검토
 *    approve 마음에 드는 것만 승인 + 예약     ← 승인한 것만 나갑니다
 *    plan    앞으로 언제 뭐가 나가는지 확인
 *    run     지금 발행 가능한 게 있으면 하나 발행 (테스트용)
 *
 *  준비물: .env.example 을 .env.local 로 복사하고 값 채우기
 *
 *  사용 예)
 *    node tools/queue.mjs personas
 *    node tools/queue.mjs seed --limit 100
 *    node tools/queue.mjs list
 *    node tools/queue.mjs show 12
 *    node tools/queue.mjs approve 12 15 18 --per-day 3
 *    node tools/queue.mjs plan
 * ============================================================ */

import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

import { loadCatalog } from "./lib/catalog.mjs";
import { buildDrafts, TEMPLATE_KEYS } from "./lib/drafts.mjs";
import { loadEnv, createClient } from "./lib/supa.mjs";
import { makeSchedule, fmtKst } from "./lib/schedule.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ============================================================
 *  인자 파싱
 * ============================================================ */

function parseArgs(argv) {
  const cmd = argv[0] || "help";
  const flags = {};
  const positional = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq > 0) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        flags[a.slice(2)] = argv[++i];
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { cmd, flags, positional };
}

const num = (v, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
};

/* ============================================================
 *  공통
 * ============================================================ */

function connect() {
  const env = loadEnv(ROOT);
  return { env, sb: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) };
}

async function getSettings(sb) {
  const rows = await sb.select("content_settings", "select=*&id=eq.1");
  if (!rows || !rows.length) {
    throw new Error("content_settings 가 없습니다. supabase/official.sql 을 먼저 실행하세요.");
  }
  return rows[0];
}

async function getPersonas(sb) {
  const rows = await sb.select(
    "profiles",
    "select=id,nick,color,official_label&is_official=is.true&order=nick.asc"
  );
  if (!rows || !rows.length) {
    throw new Error(
      "공식 계정이 하나도 없습니다.\n" +
      "  Supabase SQL Editor 에서 먼저 지정하세요:\n" +
      "    update profiles set is_official = true, nick = '바텐톡 위스키', official_label = '공식'\n" +
      "     where id = '계정-uuid';\n" +
      "  계정 목록은  node tools/queue.mjs accounts  로 볼 수 있어요."
    );
  }
  return rows;
}

/** 담당이 있으면 담당에게, 없으면 순서대로 배정합니다. */
function assignAuthors(drafts, personas) {
  const label = (p) => `${p.nick || ""} ${p.official_label || ""}`;
  const whisky = personas.filter((p) => /위스키|몰트|whisky|whiskey/i.test(label(p)));
  const cocktail = personas.filter((p) => /칵테일|바텐딩|cocktail/i.test(label(p)));

  let i = 0;
  return drafts.map((d) => {
    const pref = d.itemKind === "cocktail" ? cocktail : whisky;
    const pool = pref.length ? pref : personas;
    return { ...d, author_id: pool[i++ % pool.length].id };
  });
}

// --yes 를 주면 물어보지 않고 진행합니다 (스크립트나 자동화용).
let AUTO_YES = false;

async function confirm(question) {
  if (AUTO_YES) {
    console.log(`${question} → --yes`);
    return true;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question(`${question} (y/N) `, res));
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

const STATUS_LABEL = {
  draft: "초안", approved: "예약됨", published: "발행됨",
  rejected: "버림", failed: "실패",
};

/* ============================================================
 *  명령
 * ============================================================ */

const commands = {};

commands.help = () => {
  console.log(`
바텐톡 콘텐츠 큐

  node tools/queue.mjs <명령> [옵션]

명령
  accounts                       계정 목록 (공식으로 지정할 후보 찾기)
  personas                       공식 계정 목록
  catalog                        내장 도감 통계 확인
  seed                           도감에서 초안 생성 → 큐에 넣기
      --limit 100                  개수 (기본 50)
      --kind spirit|cocktail|all   종류 (기본 all)
      --only bottle,recipe         특정 템플릿만  (${TEMPLATE_KEYS.join(", ")})
      --dry                        DB 에 넣지 않고 미리보기
  list                           큐 목록
      --status draft|approved|published|rejected|failed
      --limit 40
  show <id...>                   본문 전체 보기
  approve <id...> | --all        승인 + 예약
      --per-day 3                  하루 몇 건 (기본: 설정값)
      --from 2026-08-11            언제부터 (기본: 지금)
      --dry                        예약 시각만 미리보기
  reject <id...>                 버리기
  plan --days 14                 앞으로 나갈 일정
  run --limit 1                  지금 발행 (크론이 하는 일과 동일)
  settings                       발행 설정 보기/바꾸기
      --on / --off                 자동 발행 켜기 / 끄기
      --daily-cap 4  --min-gap 90  --quiet 2-9
  stats                          상태별 개수
`);
};

commands.catalog = async () => {
  const cat = loadCatalog(ROOT);
  console.log(`도감 ${cat.stats.total}종 · 술 ${cat.stats.spirits} · 칵테일 ${cat.stats.cocktails} · 상세데이터 ${cat.stats.withDeep}`);
};

commands.accounts = async () => {
  const { sb } = connect();
  const rows = await sb.select(
    "profiles",
    "select=id,nick,color,is_official,official_label,created_at&order=created_at.asc&limit=50"
  );
  // 실제로 쓰이는 계정인지 알아야 고를 수 있어요. 글·댓글 수를 한 번에 세어옵니다.
  const tally = (list, key) => {
    const m = new Map();
    for (const x of list || []) m.set(x[key], (m.get(x[key]) || 0) + 1);
    return m;
  };
  const posts = tally(await sb.select("posts", "select=author_id&limit=5000"), "author_id");
  const comments = tally(await sb.select("comments", "select=author_id&limit=5000"), "author_id");

  console.log(`계정 ${rows.length}개    (글 / 댓글)\n`);
  for (const r of rows) {
    const mark = r.is_official
      ? `[공식${r.official_label && r.official_label !== "공식" ? ":" + r.official_label : ""}]`
      : "        ";
    const p = posts.get(r.id) || 0;
    const c = comments.get(r.id) || 0;
    const use = p + c === 0 ? "비어 있음 — 공식 계정으로 쓰기 좋음" : `글 ${p} · 댓글 ${c}`;
    console.log(`${mark} ${r.id}  ${(r.nick || "익명").padEnd(8)}  ${use}`);
    console.log(`${" ".repeat(9)}가입 ${fmtKst(r.created_at)}`);
  }
  console.log(`
── 고르는 기준 ──────────────────────────────
  · "비어 있음" 인 계정 중에서 2~3개만 고르세요.
  · 본인이 실제로 쓰는 계정(글·댓글이 있는 것)은 건드리지 마세요.
    공식으로 바꾸면 그 계정이 쓴 예전 글에도 전부 뱃지가 소급 적용됩니다.

공식으로 지정하려면 Supabase SQL Editor 에서:
  update profiles set is_official = true, nick = '바텐톡 위스키', official_label = '공식'
   where id = '위 uuid 중 하나';`);
};

commands.personas = async () => {
  const { sb } = connect();
  const rows = await getPersonas(sb);
  console.log(`공식 계정 ${rows.length}개\n`);
  for (const r of rows) {
    const posts = await sb.count("posts", `author_id=eq.${r.id}`);
    console.log(`  ${r.nick}  [${r.official_label || "공식"}]  글 ${posts}개   ${r.id}`);
  }
};

commands.seed = async (flags) => {
  const { sb } = connect();
  const limit = num(flags.limit, 50);
  const kind = flags.kind || "all";
  const only = flags.only ? String(flags.only).split(",").map((s) => s.trim()) : null;

  if (!["all", "spirit", "cocktail"].includes(kind)) {
    throw new Error(`--kind 는 all / spirit / cocktail 중 하나여야 합니다.`);
  }
  if (only) {
    const bad = only.filter((k) => !TEMPLATE_KEYS.includes(k));
    if (bad.length) throw new Error(`모르는 템플릿: ${bad.join(", ")}\n  가능한 값: ${TEMPLATE_KEYS.join(", ")}`);
  }

  const personas = await getPersonas(sb);
  const cat = loadCatalog(ROOT);
  console.log(`도감 ${cat.stats.total}종 읽음 · 공식 계정 ${personas.length}개`);

  // 이미 큐에 있는 소재는 다시 만들지 않습니다
  const existing = await sb.select("content_queue", "select=dedupe_key&dedupe_key=not.is.null&limit=10000");
  const exclude = new Set((existing || []).map((r) => r.dedupe_key));
  if (exclude.size) console.log(`이미 큐에 있는 소재 ${exclude.size}건은 건너뜁니다.`);

  const drafts = assignAuthors(buildDrafts(cat, { limit, kind, exclude, only }), personas);
  if (!drafts.length) {
    console.log("새로 만들 초안이 없습니다. (--kind 나 --only 를 바꿔보세요)");
    return;
  }

  const byTpl = {};
  for (const d of drafts) byTpl[d.template] = (byTpl[d.template] || 0) + 1;
  console.log(`\n초안 ${drafts.length}건 생성`);
  console.log("  " + Object.entries(byTpl).map(([k, v]) => `${k} ${v}`).join(" · "));

  if (flags.dry) {
    console.log("\n--- 미리보기 (앞 3건) ---");
    for (const d of drafts.slice(0, 3)) {
      console.log(`\n[${d.template}] ${d.title}\n${"-".repeat(50)}\n${d.body}\n`);
    }
    console.log(`\n--dry 라서 DB 에 넣지 않았습니다.`);
    return;
  }

  const rows = drafts.map((d) => ({
    kind: "post",
    status: "draft",
    author_id: d.author_id,
    cat: "free",
    title: d.title,
    body: d.body,
    emoji: d.emoji,
    source: d.source,
    dedupe_key: d.dedupe_key,
    note: `${d.template} · ${d.itemName}`,
  }));

  // 한 번에 다 보내면 요청이 커지니 나눠서 넣습니다
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const res = await sb.insertIgnore("content_queue", chunk, "dedupe_key");
    inserted += Array.isArray(res) ? res.length : 0;
  }

  console.log(`\n큐에 ${inserted}건 넣었습니다. (status = draft)`);
  console.log(`다음: node tools/queue.mjs list   →   show <id>   →   approve <id...>`);
};

commands.list = async (flags) => {
  const { sb } = connect();
  const status = flags.status || "draft";
  const limit = num(flags.limit, 40);
  const rows = await sb.select(
    "content_queue",
    `select=id,status,kind,title,note,publish_after,published_at&status=eq.${status}` +
    `&order=${status === "approved" ? "publish_after.asc" : "id.asc"}&limit=${limit}`
  );

  const total = await sb.count("content_queue", `status=eq.${status}`);
  console.log(`${STATUS_LABEL[status] || status} ${total}건 (${rows.length}건 표시)\n`);
  for (const r of rows) {
    const when = r.status === "approved" ? `  ⏰ ${fmtKst(r.publish_after)}`
      : r.status === "published" ? `  ✓ ${fmtKst(r.published_at)}`
      : "";
    console.log(`  ${String(r.id).padStart(4)}  ${r.title}${when}`);
    if (r.note) console.log(`        ${r.note}`);
  }
  if (!rows.length) console.log("  (없음)");
};

commands.show = async (_flags, ids) => {
  if (!ids.length) throw new Error("id 를 지정하세요. 예: node tools/queue.mjs show 12");
  const { sb } = connect();
  const rows = await sb.select("content_queue", `select=*&id=in.(${ids.join(",")})`);
  for (const r of rows) {
    console.log("\n" + "=".repeat(60));
    console.log(`#${r.id}  [${STATUS_LABEL[r.status] || r.status}]  ${r.note || ""}`);
    console.log(`소재: ${r.source || "-"}   작성 계정: ${r.author_id}`);
    if (r.status === "approved") console.log(`예약: ${fmtKst(r.publish_after)}`);
    if (r.last_error) console.log(`⚠ 최근 오류: ${r.last_error}`);
    console.log("=".repeat(60));
    console.log(`${r.emoji || ""} ${r.title}\n`);
    console.log(r.body || r.text || "");
  }
  if (!rows.length) console.log("해당 id 가 없습니다.");
};

commands.approve = async (flags, ids) => {
  const { sb } = connect();
  const cfg = await getSettings(sb);

  let targets;
  if (flags.all) {
    targets = await sb.select("content_queue", "select=id,title&status=eq.draft&order=id.asc&limit=1000");
  } else {
    if (!ids.length) throw new Error("id 를 지정하거나 --all 을 쓰세요.");
    targets = await sb.select("content_queue", `select=id,title,status&id=in.(${ids.join(",")})`);
    const notDraft = targets.filter((t) => t.status !== "draft");
    if (notDraft.length) {
      console.log(`⚠ 초안이 아닌 건은 건너뜁니다: ${notDraft.map((t) => t.id).join(", ")}`);
      targets = targets.filter((t) => t.status === "draft");
    }
  }
  if (!targets.length) {
    console.log("승인할 초안이 없습니다.");
    return;
  }

  const perDay = num(flags["per-day"], cfg.daily_cap);
  const minGap = num(flags["min-gap"], cfg.min_gap_min);
  const from = flags.from ? new Date(`${flags.from}T00:00:00+09:00`) : new Date();
  if (Number.isNaN(from.getTime())) throw new Error(`--from 날짜를 이해하지 못했습니다: ${flags.from}`);

  if (perDay > cfg.daily_cap) {
    console.log(`⚠ --per-day ${perDay} 가 설정된 하루 상한(${cfg.daily_cap})보다 큽니다.`);
    console.log(`  넘치는 글은 다음 날로 밀립니다. 상한을 올리려면:  node tools/queue.mjs settings --daily-cap ${perDay}`);
  }

  const booked = await sb.select(
    "content_queue",
    "select=publish_after&status=eq.approved&order=publish_after.asc&limit=1000"
  );

  const slots = makeSchedule(targets.length, {
    perDay,
    minGapMin: minGap,
    quietFrom: cfg.quiet_from,
    quietTo: cfg.quiet_to,
    startAfter: from,
    existing: (booked || []).map((b) => b.publish_after),
  });

  if (slots.length < targets.length) {
    console.log(`⚠ 자리를 ${slots.length}개만 잡았습니다. 앞 ${slots.length}건만 예약합니다.`);
    targets = targets.slice(0, slots.length);
  }

  console.log(`\n예약 계획 (하루 ${perDay}건 · 최소 간격 ${minGap}분 · 조용한 시간 ${cfg.quiet_from}~${cfg.quiet_to}시)\n`);
  targets.forEach((t, i) => {
    console.log(`  ${fmtKst(slots[i])}   #${t.id}  ${t.title}`);
  });

  if (flags.dry) {
    console.log("\n--dry 라서 저장하지 않았습니다.");
    return;
  }
  if (!(await confirm(`\n${targets.length}건을 승인하고 위 시각에 예약할까요?`))) {
    console.log("취소했습니다.");
    return;
  }

  for (let i = 0; i < targets.length; i++) {
    await sb.update("content_queue", `id=eq.${targets[i].id}`, {
      status: "approved",
      publish_after: slots[i].toISOString(),
      attempts: 0,
      last_error: null,
    });
  }

  console.log(`\n${targets.length}건 예약 완료.`);
  if (!cfg.enabled) {
    console.log(`\n⚠ 자동 발행이 아직 꺼져 있습니다. 준비되면:`);
    console.log(`   node tools/queue.mjs settings --on`);
  }
};

commands.reject = async (_flags, ids) => {
  if (!ids.length) throw new Error("id 를 지정하세요.");
  const { sb } = connect();
  const res = await sb.update("content_queue", `id=in.(${ids.join(",")})&status=neq.published`, {
    status: "rejected",
  });
  console.log(`${(res || []).length}건 버렸습니다.`);
};

commands.plan = async (flags) => {
  const { sb } = connect();
  const days = num(flags.days, 14);
  const until = new Date(Date.now() + days * 86400000).toISOString();
  const rows = await sb.select(
    "content_queue",
    `select=id,title,publish_after,note&status=eq.approved&publish_after=lte.${until}&order=publish_after.asc&limit=500`
  );
  const cfg = await getSettings(sb);

  console.log(`앞으로 ${days}일 일정 — 자동 발행 ${cfg.enabled ? "켜짐 ✅" : "꺼짐 ⛔"}\n`);
  let lastDay = "";
  for (const r of rows) {
    const stamp = fmtKst(r.publish_after);
    const day = stamp.slice(0, 10);
    if (day !== lastDay) {
      console.log(`\n  ${day}`);
      lastDay = day;
    }
    console.log(`    ${stamp.slice(11)}  #${r.id}  ${r.title}`);
  }
  if (!rows.length) console.log("  (예약된 글이 없습니다)");

  const rest = await sb.count("content_queue", `status=eq.approved&publish_after=gt.${until}`);
  if (rest) console.log(`\n  ... 그 이후로 ${rest}건 더 있습니다.`);
};

commands.run = async (flags) => {
  const { sb } = connect();
  const limit = num(flags.limit, 1);
  const rows = await sb.rpc("publish_due_content", { p_limit: limit });
  if (!rows || !rows.length) {
    const cfg = await getSettings(sb);
    console.log("발행된 글이 없습니다. 아래 중 하나입니다:");
    console.log(`  · 자동 발행 스위치: ${cfg.enabled ? "켜짐" : "⛔ 꺼짐  (settings --on)"}`);
    console.log(`  · 지금이 조용한 시간(${cfg.quiet_from}~${cfg.quiet_to}시)인지`);
    console.log(`  · 직전 발행 후 ${cfg.min_gap_min}분이 안 지났는지`);
    console.log(`  · 오늘 상한 ${cfg.daily_cap}건을 채웠는지`);
    console.log(`  · 예약 시각이 된 글이 아직 없는지  (plan 으로 확인)`);
    return;
  }
  for (const r of rows) {
    console.log(`#${r.queue_id}  ${r.kind}  →  ${r.result}${r.published_id ? `  (id ${r.published_id})` : ""}`);
  }
};

commands.settings = async (flags) => {
  const { sb } = connect();
  const patch = {};

  if (flags.on) patch.enabled = true;
  if (flags.off) patch.enabled = false;
  if (flags["daily-cap"] != null && flags["daily-cap"] !== true) patch.daily_cap = num(flags["daily-cap"], 4);
  if (flags["min-gap"] != null && flags["min-gap"] !== true) patch.min_gap_min = num(flags["min-gap"], 90);
  if (flags.quiet && flags.quiet !== true) {
    const m = String(flags.quiet).match(/^(\d{1,2})-(\d{1,2})$/);
    if (!m) throw new Error("--quiet 는 2-9 처럼 써주세요 (새벽 2시부터 9시까지 쉼).");
    patch.quiet_from = num(m[1], 2);
    patch.quiet_to = num(m[2], 9);
  }

  if (Object.keys(patch).length) {
    if (patch.enabled === true) {
      const pending = await sb.count("content_queue", "status=eq.approved");
      console.log(`예약된 글 ${pending}건이 이제부터 자동으로 나갑니다.`);
      if (!(await confirm("자동 발행을 켤까요?"))) {
        console.log("취소했습니다.");
        return;
      }
    }
    await sb.update("content_settings", "id=eq.1", patch);
  }

  const cfg = await getSettings(sb);
  console.log(`
발행 설정
  자동 발행     ${cfg.enabled ? "켜짐 ✅" : "꺼짐 ⛔"}
  기준 시간대   ${cfg.tz}
  하루 최대     ${cfg.daily_cap}건
  조용한 시간   ${cfg.quiet_from}시 ~ ${cfg.quiet_to}시 (이 사이엔 발행 안 함)
  최소 간격     ${cfg.min_gap_min}분
`);
};

commands.stats = async () => {
  const { sb } = connect();
  console.log("큐 상태\n");
  for (const s of ["draft", "approved", "published", "rejected", "failed"]) {
    const n = await sb.count("content_queue", `status=eq.${s}`);
    console.log(`  ${(STATUS_LABEL[s] || s).padEnd(6)} ${String(n).padStart(5)}`);
  }
  const failed = await sb.select("content_queue", "select=id,last_error&status=eq.failed&limit=5");
  if (failed && failed.length) {
    console.log("\n실패한 건:");
    for (const f of failed) console.log(`  #${f.id}  ${f.last_error}`);
  }
};

/* ============================================================
 *  실행
 * ============================================================ */

const { cmd, flags, positional } = parseArgs(process.argv.slice(2));
AUTO_YES = !!(flags.yes || flags.y);
const handler = commands[cmd];

// process.exit() 를 바로 부르면 윈도우에서 libuv 가 핸들 정리 중에 죽으면서
// "Assertion failed: ... src\win\async.c" 같은 게 에러 뒤에 붙습니다.
// exitCode 만 세워두고 자연스럽게 끝내면 그 잡음이 사라져요.
if (!handler) {
  console.error(`모르는 명령: ${cmd}\n`);
  commands.help();
  process.exitCode = 1;
} else {
  try {
    await handler(flags, positional);
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exitCode = 1;
  }
}
