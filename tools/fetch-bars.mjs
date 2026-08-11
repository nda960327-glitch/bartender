#!/usr/bin/env node
/* ============================================================
 *  실제 바 목록 받아오기 (카카오 로컬 API)
 *
 *  왜 이렇게 하나
 *    바 1000곳을 손으로 적을 수는 없고, 지어내면 실제 영업 중인 가게에
 *    엉뚱한 주소가 붙습니다. 손님이 남의 집으로 가요.
 *    그래서 상호·주소·좌표를 전부 카카오에서 받아옵니다.
 *
 *  준비
 *    1. https://developers.kakao.com > 내 애플리케이션 > 앱 만들기
 *    2. 앱 키 > REST API 키 복사
 *    3. .env.local 에 넣거나 환경변수로:
 *         KAKAO_REST_KEY=발급받은키
 *
 *  실행
 *    node tools/fetch-bars.mjs              전국
 *    node tools/fetch-bars.mjs --seoul      서울만 (빠르게 확인할 때)
 *    node tools/fetch-bars.mjs --limit 300  개수 제한
 *
 *  결과
 *    js/seed-bars.js 에 씁니다. index.html 이 이 파일을 읽어요.
 *    파일이 없으면 앱은 내장된 소수 목록으로 동작합니다.
 *
 *  ⚠️ 카카오 무료 쿼터는 하루 100,000건입니다. 전국 한 번 도는 데
 *     2,000건 남짓 쓰므로 넉넉합니다.
 * ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");

/* .env.local 에서 키를 읽습니다 (없으면 환경변수). */
function readKey() {
  if (process.env.KAKAO_REST_KEY) return process.env.KAKAO_REST_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const m = env.match(/^KAKAO_REST_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch (e) { /* 없으면 넘어갑니다 */ }
  return "";
}

/* 어디를 뒤질지.
   카카오 키워드 검색은 한 질의당 최대 45건(3페이지)이라, 지역을 잘게
   쪼개야 많이 모입니다. 바가 실제로 모여 있는 동네 위주로 골랐어요. */
const AREAS_SEOUL = [
  "강남", "신사", "청담", "논현", "역삼", "선릉", "삼성동", "서초", "방배",
  "이태원", "한남", "용산", "해방촌", "삼각지",
  "홍대", "합정", "연남", "망원", "상수", "당산",
  "종로", "익선동", "을지로", "충무로", "명동", "회현",
  "성수", "건대", "왕십리", "약수", "신당",
  "여의도", "영등포", "노량진", "목동",
  "잠실", "송파", "강동", "천호",
  "혜화", "대학로", "안국", "서촌", "북촌", "연희동", "서교동",
  "노원", "미아", "수유", "공덕", "마포",
];
const AREAS_OTHER = [
  "부산 서면", "부산 해운대", "부산 광안리", "부산 남포동", "부산 전포동",
  "대구 동성로", "대구 수성구", "대구 들안길",
  "인천 구월동", "인천 송도", "인천 부평",
  "광주 상무지구", "광주 충장로",
  "대전 둔산동", "대전 은행동",
  "울산 삼산동", "울산 성남동",
  "수원 인계동", "수원 광교", "성남 판교", "분당 정자동", "고양 일산",
  "용인 수지", "안양 평촌", "부천 중동", "의정부", "화성 동탄",
  "제주시", "서귀포", "강릉", "속초", "전주 객사", "청주 성안길",
  "천안 신부동", "포항", "창원 상남동", "김해", "여수",
];

const KINDS = [
  { q: "칵테일바", type: "칵테일바" },
  { q: "위스키바", type: "위스키바" },
  { q: "와인바", type: "와인바" },
  { q: "하이볼", type: "하이볼바" },
  { q: "전통주점", type: "전통주바" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 네이버 지역검색 (보조) ----------
 * 한 질의에 5건까지만 줍니다. 카카오만큼 많이 모을 수는 없지만,
 * 카카오가 놓친 곳을 줍고 같은 가게가 양쪽에 다 있으면 확인이 됩니다.
 *
 * 준비: https://developers.naver.com > 애플리케이션 등록 > "검색" API 추가
 *       .env.local 에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
 *
 * ⚠️ 로그인용으로 쓰는 앱과 별개입니다. 그 앱에 "검색" 이 안 켜져 있으면
 *    401 이 납니다. 없으면 그냥 건너뛰고 카카오 것만 씁니다.
 */
function naverKeys() {
  let id = process.env.NAVER_CLIENT_ID || "";
  let sec = process.env.NAVER_CLIENT_SECRET || "";
  if (!id || !sec) {
    try {
      const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
      const a = env.match(/^NAVER_CLIENT_ID\s*=\s*(.+)$/m);
      const b = env.match(/^NAVER_CLIENT_SECRET\s*=\s*(.+)$/m);
      if (a) id = a[1].trim().replace(/^["']|["']$/g, "");
      if (b) sec = b[1].trim().replace(/^["']|["']$/g, "");
    } catch (e) { /* 없으면 넘어갑니다 */ }
  }
  return id && sec ? { id, sec } : null;
}

const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "").trim();

/* 네이버는 좌표를 KATECH(TM128) 로 줍니다. 위경도로 바꿔야 해요. */
function tm128ToWgs84(x, y) {
  return { lng: Number(x) / 1e7, lat: Number(y) / 1e7 };
}

async function naverSearch(keys, query) {
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5");
  const r = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": keys.id,
      "X-Naver-Client-Secret": keys.sec,
    },
  });
  if (r.status === 401 || r.status === 403) throw new Error("naver-auth");
  if (r.status === 429) { await sleep(1200); return naverSearch(keys, query); }
  if (!r.ok) return { items: [] };
  return r.json();
}

async function search(key, query, page) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "15");
  url.searchParams.set("page", String(page));

  const r = await fetch(url, { headers: { Authorization: "KakaoAK " + key } });
  if (r.status === 401) throw new Error("KAKAO_REST_KEY 가 거부됐습니다. 키를 확인해주세요.");
  if (r.status === 429) { await sleep(1500); return search(key, query, page); }
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`카카오 ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

/* 카카오 카테고리에 "술집"이 들어간 것만 남깁니다.
   "칵테일바"로 검색해도 카페·음식점이 섞여 나와요. */
function looksLikeBar(doc) {
  const cat = String(doc.category_name || "");
  if (!/술집|바\(BAR\)|바$|이자카야|와인|칵테일/i.test(cat)) return false;
  // 프랜차이즈 포차·노래방은 뺍니다
  if (/노래|단란|유흥|룸살롱/.test(cat)) return false;
  // 호프·맥줏집은 바텐더가 일하는 곳이 아니라서 뺍니다 (사장님 요청)
  if (/호프|맥주/.test(cat)) return false;
  return true;
}

function typeFrom(doc, fallback) {
  const cat = String(doc.category_name || "");
  if (/와인/.test(cat)) return "와인바";
  if (/이자카야/.test(cat)) return "이자카야";
  if (/칵테일|바\(BAR\)/.test(cat)) return "칵테일바";
  return fallback;
}

const round2 = (n) => Math.round(Number(n) * 100) / 100;

async function main() {
  const key = readKey();
  if (!key) {
    console.error(`
KAKAO_REST_KEY 가 없습니다.

  1. https://developers.kakao.com 에서 앱을 만들고
  2. 앱 키 > REST API 키를 복사한 뒤
  3. .env.local 에 이렇게 넣어주세요:

     KAKAO_REST_KEY=여기에키

카카오 개발자 등록은 무료이고, 하루 10만 건까지 씁니다.
`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const seoulOnly = args.includes("--seoul");
  const li = args.indexOf("--limit");
  const limit = li >= 0 ? parseInt(args[li + 1], 10) || 0 : 0;

  const areas = seoulOnly ? AREAS_SEOUL : [...AREAS_SEOUL, ...AREAS_OTHER];
  const byId = new Map();
  let calls = 0;

  console.log(`지역 ${areas.length}곳 × 종류 ${KINDS.length}가지를 훑습니다…\n`);

  outer:
  for (const area of areas) {
    for (const kind of KINDS) {
      for (let page = 1; page <= 3; page++) {
        let j;
        try {
          j = await search(key, `${area} ${kind.q}`, page);
          calls++;
        } catch (e) {
          console.error("  ! " + e.message);
          if (/거부/.test(e.message)) process.exit(1);
          break;
        }
        const docs = (j.documents || []).filter(looksLikeBar);
        for (const d of docs) {
          if (byId.has(d.id)) continue;
          byId.set(d.id, {
            name: d.place_name,
            area: (d.road_address_name || d.address_name || "").split(" ").slice(0, 3).join(" "),
            addr: d.road_address_name || d.address_name || "",
            type: typeFrom(d, kind.type),
            lat: round2(d.y),
            lng: round2(d.x),
          });
        }
        if (j.meta && j.meta.is_end) break;
        await sleep(120);          // 카카오에 예의를 지킵니다
        if (limit && byId.size >= limit) break outer;
      }
    }
    process.stdout.write(`\r  ${area.padEnd(12)} 누적 ${byId.size}곳 (요청 ${calls})   `);
  }
  console.log("\n");

  /* ---------- 네이버로 보강 ---------- */
  const nk = naverKeys();
  if (!nk) {
    console.log("네이버 키가 없어 카카오 것만 씁니다. (.env.local 의 NAVER_CLIENT_ID/SECRET)\n");
  } else {
    // 이름+동네로 같은 가게인지 봅니다. 띄어쓰기·괄호는 무시해요.
    const norm = (s) => String(s || "").replace(/[\s()·・\-]/g, "").toLowerCase();
    const seen = new Set([...byId.values()].map((b) => norm(b.name) + "|" + norm(b.area.split(" ")[1] || "")));
    let added = 0, both = 0, naverCalls = 0;

    console.log("네이버로 보강하는 중…");
    try {
      for (const area of areas) {
        for (const kind of KINDS) {
          let j;
          try {
            j = await naverSearch(nk, `${area} ${kind.q}`);
            naverCalls++;
          } catch (e) {
            if (e.message === "naver-auth") {
              console.log("  네이버 인증 실패 — 그 앱에 '검색' API 가 켜져 있는지 보세요. 건너뜁니다.\n");
              throw e;
            }
            continue;
          }
          for (const it of (j.items || [])) {
            const name = stripTags(it.title);
            const addr = it.roadAddress || it.address || "";
            if (!name || !addr) continue;
            if (!/술집|바|와인|칵테일|이자카야/i.test(String(it.category || ""))) continue;
            if (/호프|맥주/.test(String(it.category || ""))) continue;   // 호프집은 제외

            const key = norm(name) + "|" + norm(addr.split(" ")[1] || "");
            if (seen.has(key)) { both++; continue; }
            seen.add(key);

            const c = tm128ToWgs84(it.mapx, it.mapy);
            if (!c.lat || !c.lng) continue;
            byId.set("nv:" + name + addr, {
              name,
              area: addr.split(" ").slice(0, 3).join(" "),
              addr,
              type: /와인/.test(it.category) ? "와인바"
                : /이자카야/.test(it.category) ? "이자카야" : kind.type,
              lat: round2(c.lat),
              lng: round2(c.lng),
            });
            added++;
          }
          await sleep(110);
        }
        process.stdout.write(`\r  ${area.padEnd(12)} 추가 ${added} · 양쪽 확인 ${both}   `);
      }
      console.log(`\n  네이버에서 ${added}곳 추가, ${both}곳은 카카오와 겹쳐 확인됐습니다. (요청 ${naverCalls})\n`);
    } catch (e) { /* 인증 실패면 위에서 안내하고 여기로 옵니다 */ }
  }

  /* 지역(시·도)을 주소 앞머리에서 뽑습니다. */
  const REGION = {
    서울: "서울", 부산: "부산", 대구: "대구", 인천: "인천", 광주: "광주",
    대전: "대전", 울산: "울산", 세종: "세종", 경기: "경기", 강원: "강원",
    충북: "충북", 충남: "충남", 전북: "전북", 전남: "전남",
    경북: "경북", 경남: "경남", 제주: "제주",
  };
  let rows = [...byId.values()].map((b, i) => {
    const head = b.addr.split(" ")[0] || "";
    const region = REGION[head] || REGION[head.slice(0, 2)] || "기타";
    return { id: 100000 + i, ...b, region, seed: true };
  });
  rows = rows.filter((b) => b.name && b.addr && b.lat && b.lng);
  rows.sort((a, b) => a.region.localeCompare(b.region, "ko") || a.name.localeCompare(b.name, "ko"));

  const out = `/* 실제 바 목록 — tools/fetch-bars.mjs 가 카카오 로컬 API 로 받아 만든 파일입니다.
 * 손으로 고치지 마세요. 다시 받으려면:  node tools/fetch-bars.mjs
 *
 * 받은 날짜: ${new Date().toISOString().slice(0, 10)}
 * 가게 수:   ${rows.length}
 *
 * 바는 자주 닫고 옮깁니다. 이 목록도 언젠가는 틀려요.
 * 앱은 상세 화면에 "방문 전에 확인해달라"고 안내합니다.
 */
(function () {
  "use strict";
  window.BARTALK_BARS = ${JSON.stringify(rows, null, 0).replace(/\},\{/g, "},\n    {").replace(/^\[/, "[\n    ").replace(/\]$/, "\n  ]")};
})();
`;

  const dest = path.join(ROOT, "js", "seed-bars.js");
  fs.writeFileSync(dest, out, "utf8");

  const byRegion = {};
  rows.forEach((r) => { byRegion[r.region] = (byRegion[r.region] || 0) + 1; });
  console.log(`${rows.length}곳을 js/seed-bars.js 에 썼습니다. (요청 ${calls}건)\n`);
  Object.entries(byRegion).sort((a, b) => b[1] - a[1])
    .forEach(([r, n]) => console.log(`  ${r.padEnd(6)} ${n}`));
  if (rows.length < 300) {
    console.log("\n생각보다 적다면 AREAS_SEOUL / AREAS_OTHER 에 동네를 더 넣어보세요.");
  }
}

main().catch((e) => {
  console.error("\n실패:", e.message);
  process.exit(1);
});
