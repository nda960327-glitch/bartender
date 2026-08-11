/* ============================================================
 *  AI 자동 댓글 (Vercel 서버리스 함수)
 *
 *  10분마다 불리는 것을 전제로 만들었습니다. 부를 때마다 하는 일:
 *
 *    1. auto_comment_pick()  — 지금 달아도 되는지 + 어느 글에 달지
 *                              (스위치·쉬는 시간·구간 상한·주사위 전부 DB 가 판단)
 *    2. AI 가 그 글을 읽고 댓글 한 줄을 씁니다
 *    3. auto_comment_publish() — 실제로 등록
 *
 *  1번이 빈손으로 돌아오면 2·3번은 아예 하지 않습니다. 그래서 자주 불러도
 *  안전하고, 모델 호출이 낭비되지도 않아요.
 *
 *  Vercel > Settings > Environment Variables:
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY   ← 이 함수 안에서만 쓰입니다
 *     CRON_SECRET                 ← publish.js 와 같은 값
 *
 *     그리고 아래 둘 중 아무거나 하나:
 *       OPENAI_API_KEY      (ChatGPT)   · 모델 기본값 gpt-4o
 *       ANTHROPIC_API_KEY   (Claude)    · 모델 기본값 claude-opus-5
 *
 *     둘 다 있으면 OPENAI 를 씁니다. 모델을 바꾸려면 AI_MODEL 을 넣으세요.
 *
 *  수동 테스트:
 *     curl -H "x-cron-key: $CRON_SECRET" https://barapp.kr/api/auto-comment
 * ============================================================ */

const crypto = require("crypto");

/* 길이가 달라도 타이밍 정보가 새지 않도록 해시로 맞춘 뒤 비교합니다. */
function secretMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  if (!given || !expected) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function presentedSecret(req) {
  const header = req.headers["x-cron-key"];
  if (typeof header === "string" && header) return header.trim();
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}

/* 관리자가 앱에서 직접 눌러볼 수 있게 합니다.
   크론 열쇠를 모르는 상태에서도 "지금 한 번 달아보기"가 되어야, 크론이
   문제인지 키가 문제인지 DB 가 문제인지를 따로 떼어 볼 수 있어요.

   로그인 토큰을 Supabase 에 직접 물어 확인하고, admins 표에 있는지까지
   봅니다. 둘 다 통과해야 진짜 관리자입니다. */
async function isAdminRequest(env, req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return false;
  const jwt = auth.slice(7).trim();
  if (!jwt || jwt.length < 40) return false;

  try {
    const who = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + jwt },
    });
    if (!who.ok) return false;
    const u = await who.json();
    if (!u || !u.id) return false;

    const rows = await sel(env, "admins?user_id=eq." + encodeURIComponent(u.id) + "&select=user_id");
    return Array.isArray(rows) && rows.length > 0;
  } catch (e) {
    return false;
  }
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

/* PostgREST 로 표를 그냥 읽습니다 (service_role 이라 RLS 를 지나갑니다). */
async function sel(env, path) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`supabase ${path} ${r.status}: ${text}`);
  return text ? JSON.parse(text) : [];
}

/* 미리보기용 대상 고르기.
   auto_comment_pick 은 스위치가 꺼져 있으면 아무것도 안 줍니다 — 당연히
   그래야 하고요. 그래서 미리보기는 상한·확률을 다 건너뛰고 최근 글 하나를
   직접 집어옵니다. 어차피 글로 남기지 않으니 안전해요. */
async function pickForDry(env) {
  const since = new Date(Date.now() - 72 * 3600e3).toISOString();
  const posts = await sel(env,
    `posts?select=id,title,body,cat,created_at&created_at=gte.${since}&order=created_at.desc&limit=20`);
  if (!posts.length) return null;

  const personas = await sel(env, "profiles?select=id,nick&is_official=is.true&limit=20");
  if (!personas.length) return null;

  const post = posts[Math.floor(Math.random() * posts.length)];
  const persona = personas[Math.floor(Math.random() * personas.length)];
  const comments = await sel(env,
    `comments?select=nick,text&post_id=eq.${post.id}&order=created_at.asc&limit=8`);

  return {
    post_id: post.id,
    post_title: post.title,
    post_body: String(post.body || "").slice(0, 1200),
    post_cat: post.cat,
    post_age_h: Math.round((Date.now() - Date.parse(post.created_at)) / 36e5 * 10) / 10,
    comments: comments.map((c) => ({ nick: c.nick, text: String(c.text || "").slice(0, 200) })),
    author_id: persona.id,
    author_nick: persona.nick,
  };
}

/* 바텐더가 실제로 쓰는 댓글의 조건을 그대로 적었습니다.
   "짧게 써라" 하나로는 부족해요 — 짧기만 하고 알맹이 없는 댓글이
   제일 티가 납니다. */
const SYSTEM = `너는 한국의 바텐더 커뮤니티 앱 "바텐톡"에서 활동하는 현직 바텐더다.
게시글 하나를 읽고, 거기에 달 댓글을 딱 하나 쓴다.

기본은 "댓글을 단다"이다. 커뮤니티에서 남의 글에 한마디 얹는 건 자연스러운
일이고, 완벽한 문장이 떠오르지 않아도 괜찮다.

댓글의 조건:
- 한국어. 반말과 존댓말 중 글의 분위기에 맞는 쪽을 고른다.
- 한두 문장. 길어도 60자 안쪽. 커뮤니티 댓글이지 답변서가 아니다.
- 글에 있는 것 하나를 집어서 반응한다. 술 이름이든 상황이든 감정이든
  단어 하나면 충분하다. 글이 짧으면 짧은 대로 짧게 반응하면 된다.
- "고생하셨어요", "화이팅" 처럼 어느 글에나 붙는 말만으로 끝내지 않는다.
  다만 그런 말에 글의 내용을 한 조각 붙이는 건 좋다.
- 현장 경험이 드러나면 좋다. 다만 지어낸 구체적 사실(특정 가게 이름,
  특정 인물, 가격, 날짜)은 쓰지 않는다.
- 조언을 할 거면 한 줄로. 훈계하지 않는다.
- 이모지는 안 쓰거나 하나까지.
- 다른 댓글이 이미 한 말을 되풀이하지 않는다.
- 해시태그, 광고, 추천 링크, 인사말("안녕하세요") 금지.

skip 은 거의 쓰지 않는다. 아래일 때만 true 로 한다.
- 글이 광고·도배·의미 없는 문자열이라 반응할 내용이 없을 때
- 사고·부고·심각한 피해처럼 가벼운 한마디가 실례가 될 때
- 의료·법률 판단이 필요해 함부로 답하면 안 될 때

"무슨 말을 써야 할지 잘 모르겠다"는 skip 의 이유가 아니다. 그럴 땐 글에서
눈에 띄는 한 부분을 골라 짧게 반응하면 된다.`;

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

/* ---------- 문구 만들기 ----------
 * 어느 쪽 키를 넣었든 돌아가게 했습니다. 키를 바꿔 끼우고 재배포만 하면
 * 나머지는 그대로예요. 돌려주는 값은 둘 다 { skip, comment } 로 같습니다.
 *
 * 돌려주는 값:
 *   { ok: true, out: {skip, comment} }
 *   { ok: false, reason: "..." }
 */
function whichProvider() {
  if ((process.env.OPENAI_API_KEY || "").trim()) return "openai";
  if ((process.env.ANTHROPIC_API_KEY || "").trim()) return "anthropic";
  return null;
}

async function writeComment(prompt) {
  const provider = whichProvider();
  if (provider === "openai") return writeWithOpenAI(prompt);
  if (provider === "anthropic") return writeWithClaude(prompt);
  return { ok: false, reason: "no_api_key" };
}

async function writeWithOpenAI(prompt) {
  const model = (process.env.AI_MODEL || "gpt-4o").trim();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY.trim(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      response_format: {
        type: "json_schema",
        json_schema: { name: "bartender_comment", strict: true, schema: SCHEMA },
      },
    }),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j && j.error && j.error.message) || ("HTTP " + r.status);
    console.error("[auto-comment] OpenAI 오류:", msg);
    // 키가 틀렸을 때가 제일 흔합니다. 로그에서 바로 알아보게 구분해둬요.
    return { ok: false, reason: r.status === 401 ? "bad_api_key" : "model_error" };
  }

  const choice = j.choices && j.choices[0];
  if (choice && choice.message && choice.message.refusal) {
    return { ok: false, reason: "refusal" };
  }
  const text = choice && choice.message && choice.message.content;
  try {
    return { ok: true, out: JSON.parse(text) };
  } catch (e) {
    console.error("[auto-comment] OpenAI 응답을 해석하지 못했습니다:", String(text).slice(0, 200));
    return { ok: false, reason: "bad_model_output" };
  }
}

async function writeWithClaude(prompt) {
  const Anthropic = require("@anthropic-ai/sdk");
  const model = (process.env.AI_MODEL || "claude-opus-5").trim();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });

  let message;
  try {
    message = await client.messages.create({
      model: model,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: {
        effort: "low",           // 댓글 한 줄에 깊은 사고는 필요 없습니다
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    });
  } catch (e) {
    console.error("[auto-comment] Claude 오류:", (e && e.message) || e);
    return { ok: false, reason: (e && e.status === 401) ? "bad_api_key" : "model_error" };
  }

  // 안전 분류기가 거절하면 이 글은 그냥 건너뜁니다.
  // 여기서는 거절이 곧 "이 글에는 달지 마라"라서 다른 모델로 우회할 이유가 없어요.
  if (message.stop_reason === "refusal") return { ok: false, reason: "refusal" };

  const block = message.content.find((b) => b.type === "text");
  try {
    return { ok: true, out: JSON.parse(block ? block.text : "") };
  } catch (e) {
    console.error("[auto-comment] Claude 응답을 해석하지 못했습니다:", block && block.text);
    return { ok: false, reason: "bad_model_output" };
  }
}

module.exports = async (req, res) => {
  const env = process.env;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET } = env;

  // 이 셋이 없으면 설정이 잘못된 겁니다. 크론 로그에 빨갛게 남아야 해요.
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRON_SECRET) {
    console.error("[auto-comment] 환경변수가 비었습니다.", {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_SERVICE_ROLE_KEY,
      secret: !!CRON_SECRET,
    });
    return send(res, 500, { ok: false, error: "server_not_configured" });
  }

  // 크론 열쇠가 맞거나, 앱에서 로그인한 관리자거나.
  let allowed = secretMatches(presentedSecret(req), CRON_SECRET);
  if (!allowed) allowed = await isAdminRequest(env, req);
  if (!allowed) {
    return send(res, 401, { ok: false, error: "unauthorized" });
  }

  /* API 키만 없는 건 "고장"이 아니라 "아직 안 켬"입니다.
     500 으로 떨어뜨리면 크론 로그가 빨개져서 배포가 망가진 것처럼 보여요.
     조용히 아무것도 안 하고 정상 응답합니다. */
  if (!whichProvider()) {
    console.log("[auto-comment] OPENAI_API_KEY / ANTHROPIC_API_KEY 둘 다 없어 넘어갑니다.");
    return send(res, 200, { ok: true, posted: false, reason: "no_api_key" });
  }

  /* ?dry=1 — 문구만 만들어 보고 등록하지 않습니다.
     켜기 전에 어떤 말투가 나오는지 확인하는 용도예요. */
  let dry = false;
  try {
    dry = new URL(req.url, "http://localhost").searchParams.get("dry") === "1";
  } catch (_) { /* 기본값 사용 */ }

  try {
    // 1. 지금 달아도 되나? 달면 어디에?
    let picked;
    if (dry) {
      picked = await pickForDry(env);
    } else {
      const rows = await rpc(env, "auto_comment_pick", {});
      picked = Array.isArray(rows) ? rows[0] : rows;
    }

    // 빈손이 정상입니다 — 꺼져 있거나, 쉬는 시간이거나, 상한을 채웠거나,
    // 주사위가 안 나왔거나, 달 만한 글이 없거나.
    if (!picked || !picked.post_id) {
      return send(res, 200, {
        ok: true, posted: false, dry,
        reason: dry ? "no_recent_post" : "no_target",
      });
    }

    // 2. 문구를 씁니다. (OPENAI / ANTHROPIC 중 넣어둔 키로)
    const written = await writeComment(buildPrompt(picked));
    if (!written.ok) {
      return send(res, 200, { ok: true, posted: false, dry, reason: written.reason });
    }
    const out = written.out;
    const body = String((out && out.comment) || "").trim();
    if (!out || out.skip || !body) {
      return send(res, 200, { ok: true, posted: false, dry, reason: "model_skipped" });
    }
    if (body.length > 300) {
      // 프롬프트에 60자라고 했는데 300자가 왔다면 뭔가 어긋난 겁니다.
      console.warn("[auto-comment] 너무 긴 댓글이라 버립니다:", body.length);
      return send(res, 200, { ok: true, posted: false, dry, reason: "too_long" });
    }

    // 미리보기는 여기서 끝. 글로 남기지 않습니다.
    if (dry) {
      return send(res, 200, {
        ok: true, posted: false, dry: true,
        would_comment: body,
        post_id: picked.post_id,
        post_title: picked.post_title,
        nick: picked.author_nick,
      });
    }

    // 3. 등록.
    const commentId = await rpc(env, "auto_comment_publish", {
      p_author: picked.author_id,
      p_post_id: picked.post_id,
      p_text: body,
    });

    if (!commentId) {
      // dedupe_key 가 걸렸습니다. 크론이 겹쳐 돌았을 때 정상 동작이에요.
      return send(res, 200, { ok: true, posted: false, reason: "duplicate" });
    }

    console.log(`[auto-comment] post#${picked.post_id} ← ${picked.author_nick}: ${body}`);
    return send(res, 200, {
      ok: true,
      posted: true,
      post_id: picked.post_id,
      comment_id: commentId,
      nick: picked.author_nick,
    });
  } catch (e) {
    console.error("[auto-comment] 예외", e);
    return send(res, 500, { ok: false, error: (e && e.message) || "unknown" });
  }
};
