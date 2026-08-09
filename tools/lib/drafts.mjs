/* ============================================================
 *  도감 데이터 → 게시글 초안
 *
 *  전부 앱에 이미 들어있는 내용을 재구성한 것입니다. 지어내는 값이 없어요.
 *  그래서 사실 확인이 따로 필요 없고, 도감을 고치면 초안도 같이 좋아집니다.
 *
 *  같은 (항목 × 템플릿) 조합은 항상 같은 글이 나옵니다 (dedupe_key 로 중복 차단).
 * ============================================================ */

const TITLE_MAX = 190;   // DB 제한 200
const BODY_MAX = 4800;   // DB 제한 5000

/* ---------- 문자열 도구 ---------- */

const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

function clampTitle(s) {
  const t = clean(s);
  return t.length <= TITLE_MAX ? t : t.slice(0, TITLE_MAX - 1) + "…";
}

/** 문장 경계에서 자릅니다. 말이 뚝 끊기지 않게. */
function clampBody(s) {
  const t = String(s || "").trim();
  if (t.length <= BODY_MAX) return t;
  const cut = t.slice(0, BODY_MAX);
  const at = Math.max(cut.lastIndexOf(".\n"), cut.lastIndexOf(". "), cut.lastIndexOf("다.\n"), cut.lastIndexOf("요.\n"));
  return (at > BODY_MAX * 0.6 ? cut.slice(0, at + 1) : cut).trim() + "\n\n(계속)";
}

const sections = (...parts) => parts.filter((p) => p && String(p).trim()).join("\n\n");

function block(heading, content) {
  const c = String(content == null ? "" : content).trim();
  return c ? `── ${heading}\n${c}` : null;
}

const bullets = (arr, n) =>
  (Array.isArray(arr) ? arr : []).slice(0, n || 99).map((x) => `· ${clean(x)}`).join("\n");

const numbered = (arr, n) =>
  (Array.isArray(arr) ? arr : []).slice(0, n || 99).map((x, i) => `${i + 1}. ${clean(x)}`).join("\n");

const pairs = (arr, n) =>
  (Array.isArray(arr) ? arr : []).slice(0, n || 99)
    .filter((x) => x && x.n)
    .map((x) => `· ${clean(x.n)} — ${clean(x.d)}`)
    .join("\n");

/** 여러 줄짜리 재료 문자열을 불릿으로. */
const asLines = (s) =>
  String(s || "").split("\n").map((x) => x.trim()).filter(Boolean).map((x) => `· ${x}`).join("\n");

/** 첫 문장만. */
function firstSentence(s) {
  const t = clean(s);
  const m = t.match(/^(.{15,140}?[.!?요다])\s/);
  return m ? m[1] : t.slice(0, 120);
}

/** id 를 씨앗으로 고정 선택 — 같은 초안은 항상 같은 문장으로 끝납니다. */
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

/* ---------- 공통 조각 ---------- */

function specLine(item) {
  const d = item.deep || {};
  const bits = [d.type, d.region, d.age && `숙성 ${d.age}`, item.abv && `${item.abv}%`, item.price && `가격대 ${item.price}`];
  return bullets(bits.filter(Boolean));
}

const ASK_SPIRIT = [
  "여러분 바에서는 이 병 어떻게 나가나요? 손님 반응 궁금합니다.",
  "이 병 재고 두고 계신 분들, 회전 어떤지 궁금해요.",
  "다르게 설명하시는 분 있으면 댓글로 알려주세요.",
  "혹시 더 좋은 대체 보틀 아시는 분 계신가요?",
];

const ASK_COCKTAIL = [
  "여러분은 어떤 비율로 만드시나요?",
  "가게마다 스펙이 다를 텐데, 다르게 하시는 분 댓글 부탁드려요.",
  "이 메뉴 주문 얼마나 들어오는지 궁금합니다.",
  "더 나은 방법 아시는 분 있으면 알려주세요.",
];

/* ============================================================
 *  템플릿
 *  applies(item) → 이 항목에 이 템플릿을 쓸 수 있는지
 *  build(item)   → { title, body }
 * ============================================================ */

const TEMPLATES = [
  /* ---------- 위스키 · 증류주 ---------- */
  {
    key: "bottle",
    kind: "spirit",
    label: "오늘의 한 병",
    applies: (i) => i.deep && i.deep.nose && i.deep.palate,
    build: (i) => {
      const d = i.deep;
      return {
        title: `오늘의 한 병 · ${i.name}`,
        body: sections(
          clean(d.tagline),
          block("기본", specLine(i)),
          block("향", d.nose),
          block("맛", d.palate),
          block("피니시", d.finish),
          block("이렇게 드세요", [d.best && clean(d.best), d.tips && d.tips[0] && clean(d.tips[0])].filter(Boolean).join("\n")),
          block("어울리는 안주", d.pairing),
          pick(ASK_SPIRIT, i.id),
        ),
      };
    },
  },
  {
    key: "serve",
    kind: "spirit",
    label: "손님 응대",
    applies: (i) => i.deep && i.deep.serve,
    build: (i) => {
      const d = i.deep;
      return {
        title: `손님이 ${i.name} 물어볼 때 · 이렇게 설명하세요`,
        body: sections(
          clean(d.serve),
          block("한 줄 요약", d.tagline),
          block("기본", specLine(i)),
          "여러분은 이 병 어떻게 설명하세요? 더 잘 먹히는 멘트 있으면 공유 부탁드려요.",
        ),
      };
    },
  },
  {
    key: "compare",
    kind: "spirit",
    label: "비슷한 병 비교",
    applies: (i) => i.deep && Array.isArray(i.deep.similar) && i.deep.similar.length >= 2,
    build: (i) => {
      const d = i.deep;
      const n = Math.min(d.similar.length, 4);
      return {
        title: `${i.name} 고민된다면 · 비슷한 ${n}병 비교`,
        body: sections(
          clean(d.tagline),
          block(i.name, sections(specLine(i), firstSentence(d.nose))),
          block(`같이 놓고 볼 만한 ${n}병`, pairs(d.similar, n)),
          d.best ? block("참고", `추천 음용법 — ${clean(d.best)}`) : null,
          "취향 물어보고 권하실 때 참고하세요. 다른 대안 있으면 댓글 환영합니다.",
        ),
      };
    },
  },
  {
    key: "highball",
    kind: "spirit",
    label: "칵테일 활용",
    applies: (i) => i.deep && i.deep.cocktail,
    build: (i) => {
      const d = i.deep;
      return {
        title: `${i.name}, 하이볼이나 칵테일에 써도 될까`,
        body: sections(
          clean(d.cocktail),
          block("추천 음용법", d.best),
          block("참고", specLine(i)),
          d.filter ? block("스펙 메모", clean(d.filter)) : null,
          pick(ASK_SPIRIT, i.id + 1),
        ),
      };
    },
  },
  {
    key: "tips",
    kind: "spirit",
    label: "마시는 법",
    applies: (i) => i.deep && Array.isArray(i.deep.tips) && i.deep.tips.length >= 3,
    build: (i) => {
      const d = i.deep;
      const n = Math.min(d.tips.length, 5);
      return {
        title: `${i.name} 제대로 마시는 법 ${n}가지`,
        body: sections(
          clean(d.tagline),
          numbered(d.tips, n),
          block("기본", specLine(i)),
          pick(ASK_SPIRIT, i.id + 2),
        ),
      };
    },
  },
  {
    key: "story",
    kind: "spirit",
    label: "이야기",
    applies: (i) => i.deep && i.deep.story && i.deep.story.length > 250,
    build: (i) => {
      const d = i.deep;
      return {
        title: `${i.name} 뒤에 있는 이야기`,
        body: sections(
          String(d.story).trim(),
          block("그래서 지금 맛은", sections(clean(d.tagline), firstSentence(d.palate))),
          block("기본", specLine(i)),
        ),
      };
    },
  },

  /* ---------- 칵테일 ---------- */
  {
    key: "recipe",
    kind: "cocktail",
    label: "레시피 카드",
    applies: (i) => i.deep && Array.isArray(i.deep.steps) && i.deep.steps.length >= 2,
    build: (i) => {
      const d = i.deep;
      const s = d.spec || {};
      return {
        title: `레시피 · ${i.name}`,
        body: sections(
          clean(d.tagline),
          block("스펙", asLines(i.ings) || null),
          block("만드는 법", numbered(d.steps, 8)),
          block("세팅", bullets([
            s.glass && `글라스 — ${clean(s.glass)}`,
            s.ice && `얼음 — ${clean(s.ice)}`,
            s.method && `기법 — ${clean(s.method)}`,
            s.garnish && `가니시 — ${clean(s.garnish)}`,
            s.pro && clean(s.pro),
          ].filter(Boolean))),
          block("팁", bullets(d.tips, 3)),
          pick(ASK_COCKTAIL, i.id),
        ),
      };
    },
  },
  {
    key: "mistakes",
    kind: "cocktail",
    label: "자주 하는 실수",
    applies: (i) => i.deep && Array.isArray(i.deep.mistakes) && i.deep.mistakes.length >= 3,
    build: (i) => {
      const d = i.deep;
      const s = d.spec || {};
      const n = Math.min(d.mistakes.length, 5);
      return {
        title: `${i.name} 만들 때 제일 많이 하는 실수 ${n}가지`,
        body: sections(
          clean(d.tagline),
          numbered(d.mistakes, n),
          block("기준은 이겁니다", bullets([
            s.method && `기법 — ${clean(s.method)}`,
            s.ice && `얼음 — ${clean(s.ice)}`,
            s.glass && `글라스 — ${clean(s.glass)}`,
          ].filter(Boolean))),
          pick(ASK_COCKTAIL, i.id + 1),
        ),
      };
    },
  },
  {
    key: "variations",
    kind: "cocktail",
    label: "변형",
    applies: (i) => i.deep && Array.isArray(i.deep.variations) && i.deep.variations.length >= 2,
    build: (i) => {
      const d = i.deep;
      const n = Math.min(d.variations.length, 5);
      return {
        title: `${i.name} 변형 ${n}가지 · 메뉴 하나 더 올린다면`,
        body: sections(
          clean(d.tagline),
          block(`${i.name}에서 갈라지는 ${n}가지`, pairs(d.variations, n)),
          block("기본 스펙", asLines(i.ings) || null),
          "실제로 메뉴에 올려보신 분 계신가요? 반응 궁금합니다.",
        ),
      };
    },
  },
  {
    key: "origin",
    kind: "cocktail",
    label: "유래",
    applies: (i) => i.deep && i.deep.story && i.deep.story.length > 250,
    build: (i) => {
      const d = i.deep;
      return {
        title: `${i.name}는 어디서 온 술인가`,
        body: sections(
          bullets([d.origin && `유래 — ${clean(d.origin)}`, d.family && `계열 — ${clean(d.family)}`].filter(Boolean)),
          String(d.story).trim(),
          block("지금 맛은", d.flavor ? firstSentence(d.flavor) : clean(d.tagline)),
        ),
      };
    },
  },
  {
    key: "order",
    kind: "cocktail",
    label: "주문 응대",
    applies: (i) => i.deep && i.deep.serve,
    build: (i) => {
      const d = i.deep;
      return {
        title: `${i.name} 주문받았을 때 · 손님한테 뭘 물어볼까`,
        body: sections(
          clean(d.serve),
          block("맛 설명이 필요하면", d.flavor),
          block("어울리는 안주", d.pairing),
          pick(ASK_COCKTAIL, i.id + 2),
        ),
      };
    },
  },
];

export const TEMPLATE_KEYS = TEMPLATES.map((t) => t.key);

/* ============================================================
 *  초안 만들기
 * ============================================================ */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {object} catalog loadCatalog() 결과
 * @param {object} opts
 *   limit    만들 개수
 *   kind     'all' | 'spirit' | 'cocktail'
 *   exclude  이미 큐에 있는 dedupe_key Set
 *   only     특정 템플릿 키만 (배열)
 * @returns {Array<{dedupe_key, source, title, body, emoji, template, itemId, itemName}>}
 */
export function buildDrafts(catalog, opts = {}) {
  const limit = opts.limit || 100;
  const kind = opts.kind || "all";
  const exclude = opts.exclude || new Set();
  const only = opts.only && opts.only.length ? new Set(opts.only) : null;

  const templates = TEMPLATES.filter((t) => (!only || only.has(t.key)) && (kind === "all" || t.kind === kind));
  if (!templates.length) return [];

  // 항목을 섞고, 항목마다 서로 다른 템플릿을 돌려가며 배정합니다.
  // 이렇게 하면 같은 술이 연달아 나오지도, 같은 형식이 몰리지도 않아요.
  const items = shuffle(catalog.items.filter((i) => i.deep && (kind === "all" || i.kind === kind)));
  const out = [];
  const seen = new Set(exclude);

  for (let pass = 0; pass < templates.length && out.length < limit; pass++) {
    for (let n = 0; n < items.length && out.length < limit; n++) {
      const item = items[n];
      const usable = templates.filter((t) => t.kind === item.kind && t.applies(item));
      if (!usable.length) continue;

      const tpl = usable[(n + pass) % usable.length];
      const dedupeKey = `${tpl.key}:${item.kind}:${item.id}`;
      if (seen.has(dedupeKey)) continue;

      let built;
      try {
        built = tpl.build(item);
      } catch (e) {
        continue; // 데이터가 비어 템플릿이 못 만들어지면 조용히 건너뜁니다
      }
      const title = clampTitle(built.title);
      const body = clampBody(built.body);
      if (!title || body.length < 120) continue;   // 너무 빈약한 글은 버립니다

      seen.add(dedupeKey);
      out.push({
        dedupe_key: dedupeKey,
        source: `${item.kind === "cocktail" ? "cocktail" : "whisky"}:${item.id}`,
        template: tpl.key,
        itemId: item.id,
        itemName: item.name,
        itemKind: item.kind,
        title,
        body,
        emoji: item.emoji,
      });
    }
  }

  return out;
}
