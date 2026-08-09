/* ============================================================
 *  앱에 내장된 도감 569종을 Node 에서 읽어옵니다.
 *
 *  도감은 두 군데에 나뉘어 있어요.
 *    js/app.js            — id, 이름, 이모지, 도수, 가격 (569개)
 *    js/whisky-deep.js    — 노즈/팔레트/피니시/스토리/팁   (413개)
 *    js/cocktail-deep.js  — 스펙/만드는 법/실수/변형        (156개)
 *
 *  deep 파일은 window 에 값을 넣는 IIFE 라서 그냥 실행하면 됩니다.
 *  app.js 는 DOM 을 건드리므로 통째로는 못 돌려요. 그래서 도감을 만드는
 *  부분(배열 리터럴 · push 블록 · 벌크 등록 블록)만 잘라내서 실행합니다.
 *
 *  정규식으로 문자열을 긁지 않고 "진짜 실행" 하는 이유는, 데이터가 바뀌어도
 *  따라오게 하기 위해서예요. 잘라내기에 실패하면 조용히 넘어가지 않고
 *  바로 예외를 던집니다.
 * ============================================================ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/* 여는 괄호 위치에서 짝이 맞는 닫는 괄호 '다음' 인덱스를 돌려줍니다.
   문자열·템플릿·주석 안의 괄호는 세지 않아요. */
function matchFrom(src, open) {
  const PAIR = { "[": "]", "(": ")", "{": "}" };
  const close = PAIR[src[open]];
  if (!close) throw new Error(`여는 괄호가 아닙니다: ${JSON.stringify(src[open])}`);

  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];

    if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      if (nl < 0) break;
      i = nl;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) throw new Error("닫히지 않은 블록 주석");
      i = end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") i++;
        i++;
      }
      continue;
    }

    if (c === src[open]) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("짝이 맞는 괄호를 찾지 못했습니다");
}

function sliceStatement(src, startIdx, openChar) {
  const open = src.indexOf(openChar, startIdx);
  if (open < 0) throw new Error("여는 괄호를 찾지 못했습니다");
  return src.slice(startIdx, matchFrom(src, open));
}

/* app.js 에서 도감을 만드는 코드 조각만 모읍니다. */
function extractSeedChunks(src) {
  const chunks = [];

  // 1) SP / CT 헬퍼
  for (const re of [/const SP = \([^)]*\) =>/, /const CT = \([^)]*\) =>/]) {
    const m = re.exec(src);
    if (!m) throw new Error(`app.js 에서 헬퍼 정의를 찾지 못했습니다: ${re}`);
    // 본문이 `({ ... })` 형태라서 화살표 뒤 첫 여는 괄호의 짝까지가 정의입니다.
    const bodyOpen = src.indexOf("(", m.index + m[0].length);
    chunks.push(src.slice(m.index, matchFrom(src, bodyOpen)) + ";");
  }

  // 2) const SEED_SPIRITS = [ ... ];
  {
    const i = src.indexOf("const SEED_SPIRITS = [");
    if (i < 0) throw new Error("app.js 에서 SEED_SPIRITS 배열을 찾지 못했습니다");
    chunks.push(sliceStatement(src, i, "[") + ";");
  }

  // 3) SEED_SPIRITS.push( ... );  — 줄 맨 앞에서 시작하는 것만 (화살표 함수 본문 제외)
  {
    const re = /^[ \t]*SEED_SPIRITS\.push\(/gm;
    let m;
    let found = 0;
    while ((m = re.exec(src))) {
      const open = m.index + m[0].length - 1;
      const end = matchFrom(src, open);
      chunks.push(src.slice(m.index, end) + ";");
      re.lastIndex = end;
      found++;
    }
    if (!found) throw new Error("app.js 에서 SEED_SPIRITS.push 블록을 찾지 못했습니다");
  }

  // 4) 벌크 등록 블록:  let wid = 2000;  const W = ...;  [ ... ].forEach(...)
  {
    const i = src.indexOf("let wid = ");
    if (i < 0) throw new Error("app.js 에서 벌크 등록 블록(wid)을 찾지 못했습니다");
    const arrOpen = src.indexOf("\n  [", i);
    if (arrOpen < 0) throw new Error("벌크 등록 배열을 찾지 못했습니다");
    const arrEnd = matchFrom(src, src.indexOf("[", arrOpen));
    const semi = src.indexOf(";", arrEnd);
    chunks.push(src.slice(i, semi + 1));
  }

  return chunks;
}

/**
 * 도감 전체를 읽어옵니다.
 * @param {string} root 저장소 루트 경로
 * @returns {{items: Array, byId: Map, stats: object}}
 */
export function loadCatalog(root) {
  const appSrc = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

  // --- deep 데이터 (window 에 그대로 실행) ---
  const deepCtx = vm.createContext({ window: {} });
  for (const f of ["whisky-deep.js", "cocktail-deep.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "js", f), "utf8"), deepCtx, { filename: f });
  }
  const WHISKY = deepCtx.window.WHISKY_DEEP || {};
  const COCKTAIL = deepCtx.window.COCKTAIL_DEEP || {};

  // --- 도감 목록 ---
  const seedCtx = vm.createContext({
    now: Date.now(),
    D: 86400000,
    H: 3600000,
    M: 60000,
    SEED_SPIRITS: null,
    __out: null,
  });
  const code = extractSeedChunks(appSrc).join("\n") + "\n__out = SEED_SPIRITS;";
  vm.runInContext(code, seedCtx, { filename: "app.js(seed)" });

  const raw = seedCtx.__out;
  if (!Array.isArray(raw) || raw.length < 100) {
    throw new Error(`도감을 제대로 읽지 못했습니다 (${raw ? raw.length : 0}개). app.js 구조가 바뀌었을 수 있어요.`);
  }

  const items = raw
    .filter((x) => x && x.id && x.name)
    .map((x) => {
      const deep = x.kind === "cocktail" ? COCKTAIL[x.id] : WHISKY[x.id];
      return {
        id: x.id,
        kind: x.kind,
        name: String(x.name).trim(),
        emoji: x.emoji || (x.kind === "cocktail" ? "🍸" : "🥃"),
        cat: x.cat || null,
        base: x.base || null,
        abv: typeof x.abv === "number" ? x.abv : null,
        price: x.price || null,
        note: x.note || "",
        ings: x.ings || null,
        recipe: x.recipe || null,
        deep: deep || null,
      };
    });

  const byId = new Map(items.map((x) => [x.id, x]));

  return {
    items,
    byId,
    stats: {
      total: items.length,
      spirits: items.filter((x) => x.kind === "spirit").length,
      cocktails: items.filter((x) => x.kind === "cocktail").length,
      withDeep: items.filter((x) => x.deep).length,
    },
  };
}
