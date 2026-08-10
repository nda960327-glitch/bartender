/* ============================================================
 *  AI 자동 댓글 (Vercel 서버리스 함수)
 *
 *  10분마다 불리는 것을 전제로 만들었습니다. 부를 때마다 하는 일:
 *
 *    1. auto_comment_pick()  — 지금 달아도 되는지 + 어느 글에 달지
 *                              (스위치·쉬는 시간·구간 상한·주사위 전부 DB 가 판단)
 *    2. Claude 가 그 글을 읽고 댓글 한 줄을 씁니다
 *    3. auto_comment_publish() — 실제로 등록
 *
 *  1번이 빈손으로 돌아오면 2·3번은 아예 하지 않습니다. 그래서 자주 불러도
 *  안전하고, 모델 호출이 낭비되지도 않아요.
 *
 *  Vercel > Settings > Environment Variables:
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY   ← 이 함수 안에서만 쓰입니다
 *     CRON_SECRET                 ← publish.js 와 같은 값
 *     ANTHROPIC_API_KEY
 *
 *  수동 테스트:
 *     curl -H "x-cron-key: $CRON_SECRET" https://barapp.kr/api/auto-comment
 * ============================================================ */

const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-opus-5";

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

async function rpc(env, name, args) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(args || {}),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error(`supabase ${name} ${r.status}: ${text}`);
    err.status = r.status;
    throw err;
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch (_) {
    throw new Error(`supabase ${name} 응답을 해석하지 못했습니다: ${text}`);
  }
}

/* 바텐더가 실제로 쓰는 댓글의 조건을 그대로 적었습니다.
   "짧게 써라" 하나로는 부족해요 — 짧기만 하고 알맹이 없는 댓글이
   제일 티가 납니다. */
const SYSTEM = `너는 한국의 바텐더 커뮤니티 앱 "바텐톡"에서 활동하는 현직 바텐더다.
게시글 하나를 읽고, 거기에 달 댓글을 딱 하나 쓴다.

댓글의 조건:
- 한국어. 반말과 존댓말 중 글의 분위기에 맞는 쪽을 고른다.
- 한두 문장. 길어도 60자 안쪽. 커뮤니티 댓글이지 답변서가 아니다.
- 글에 실제로 있는 내용에 반응한다. 글쓴이가 쓴 술 이름, 상황, 감정 중
  하나를 집어서 말한다. 어느 글에나 붙는 말("고생하셨어요", "화이팅")만
  쓰면 안 된다.
- 현장 경험이 드러나면 좋다. 다만 지어낸 구체적 사실(특정 가게 이름,
  특정 인물, 가격, 날짜)은 쓰지 않는다.
- 조언을 할 거면 한 줄로. 훈계하지 않는다.
- 이모지는 안 쓰거나 하나까지.
- 다른 댓글이 이미 한 말을 되풀이하지 않는다.
- 해시태그, 광고, 추천 링크, 인사말("안녕하세요") 금지.

댓글로 쓸 말이 마땅치 않으면 skip 을 true 로 하고 comment 는 빈 문자열로 둔다.
어색한 댓글을 억지로 다는 것보다 안 다는 편이 낫다.`;

function buildPrompt(t) {
  const comments = Array.isArray(t.comments) ? t.comments : [];
  const lines = [
    `[카테고리] ${t.post_cat || "free"}`,
    `[올라온 지] ${t.post_age_h}시간 전`,
    `[제목] ${t.post_title || "(제목 없음)"}`,
    `[본문]`,
    t.post_body || "(본문 없음)",
  ];
  if (comments.length) {
    lines.push("", "[이미 달린 댓글]");
    comments.forEach((c) => lines.push(`- ${c.text}`));
  } else {
    lines.push("", "[이미 달린 댓글] 없음");
  }
  lines.push("", `너는 "${t.author_nick}" 라는 닉네임으로 댓글을 단다.`);
  return lines.join("\n");
}

const SCHEMA = {
  type: "object",
  properties: {
    skip: { type: "boolean", description: "댓글을 달지 않는 편이 나으면 true" },
    comment: { type: "string", description: "댓글 본문. skip 이 true 면 빈 문자열" },
  },
  required: ["skip", "comment"],
  additionalProperties: false,
};

module.exports = async (req, res) => {
  const env = process.env;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, ANTHROPIC_API_KEY } = env;

  // 이 셋이 없으면 설정이 잘못된 겁니다. 크론 로그에 빨갛게 남아야 해요.
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRON_SECRET) {
    console.error("[auto-comment] 환경변수가 비었습니다.", {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_SERVICE_ROLE_KEY,
      secret: !!CRON_SECRET,
    });
    return send(res, 500, { ok: false, error: "server_not_configured" });
  }

  if (!secretMatches(presentedSecret(req), CRON_SECRET)) {
    return send(res, 401, { ok: false, error: "unauthorized" });
  }

  /* API 키만 없는 건 "고장"이 아니라 "아직 안 켬"입니다.
     500 으로 떨어뜨리면 크론 로그가 빨개져서 배포가 망가진 것처럼 보여요.
     조용히 아무것도 안 하고 정상 응답합니다. */
  if (!ANTHROPIC_API_KEY) {
    console.log("[auto-comment] ANTHROPIC_API_KEY 가 없어 이번엔 넘어갑니다.");
    return send(res, 200, { ok: true, posted: false, reason: "no_api_key" });
  }

  try {
    // 1. 지금 달아도 되나? 달면 어디에?
    const rows = await rpc(env, "auto_comment_pick", {});
    const target = Array.isArray(rows) ? rows[0] : rows;

    // 빈손이 정상입니다 — 꺼져 있거나, 쉬는 시간이거나, 상한을 채웠거나,
    // 주사위가 안 나왔거나, 달 만한 글이 없거나.
    if (!target || !target.post_id) {
      return send(res, 200, { ok: true, posted: false, reason: "no_target" });
    }

    // 2. 문구를 씁니다.
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: {
        effort: "low",           // 댓글 한 줄에 깊은 사고는 필요 없습니다
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content: buildPrompt(target) }],
    });

    // 안전 분류기가 거절하면 이번 글은 그냥 건너뜁니다.
    // 이 기능에서는 거절이 곧 "이 글에는 달지 마라"라서, 다른 모델로
    // 우회할 이유가 없어요.
    if (message.stop_reason === "refusal") {
      console.warn("[auto-comment] 모델이 거절했습니다. post", target.post_id);
      return send(res, 200, { ok: true, posted: false, reason: "refusal" });
    }

    const block = message.content.find((b) => b.type === "text");
    let out = null;
    try {
      out = JSON.parse(block ? block.text : "");
    } catch (_) {
      console.error("[auto-comment] 응답을 해석하지 못했습니다:", block && block.text);
      return send(res, 200, { ok: true, posted: false, reason: "bad_model_output" });
    }

    const body = String((out && out.comment) || "").trim();
    if (!out || out.skip || !body) {
      return send(res, 200, { ok: true, posted: false, reason: "model_skipped" });
    }
    if (body.length > 300) {
      // 프롬프트에 60자라고 했는데 300자가 왔다면 뭔가 어긋난 겁니다.
      console.warn("[auto-comment] 너무 긴 댓글이라 버립니다:", body.length);
      return send(res, 200, { ok: true, posted: false, reason: "too_long" });
    }

    // 3. 등록.
    const commentId = await rpc(env, "auto_comment_publish", {
      p_author: target.author_id,
      p_post_id: target.post_id,
      p_text: body,
    });

    if (!commentId) {
      // dedupe_key 가 걸렸습니다. 크론이 겹쳐 돌았을 때 정상 동작이에요.
      return send(res, 200, { ok: true, posted: false, reason: "duplicate" });
    }

    console.log(`[auto-comment] post#${target.post_id} ← ${target.author_nick}: ${body}`);
    return send(res, 200, {
      ok: true,
      posted: true,
      post_id: target.post_id,
      comment_id: commentId,
      nick: target.author_nick,
    });
  } catch (e) {
    console.error("[auto-comment] 예외", e);
    return send(res, 500, { ok: false, error: (e && e.message) || "unknown" });
  }
};
