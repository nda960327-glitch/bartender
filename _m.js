/* 바텐톡 캐릭터 — 바텡 & 술꼬 v5 (치이카와 st)
 *
 * v4에서 바뀐 점 — 전부 "더 아기처럼" 만드는 조정입니다.
 *  1. 눈 사이를 42 → 32 로 좁히고 아래로 내림. 이마가 넓게 비어야 아기 얼굴이 됩니다.
 *  2. 눈 자체는 더 작게, 반짝이도 하나만.
 *  3. 선을 3.4 → 3.0 으로. 가늘수록 여려 보입니다.
 *  4. 머리는 살짝 납작한 타원. 몸은 더 좁고 짧게. 팔다리는 더 작게.
 *  5. 색은 채도를 한 단계 더 내려서 흐릿하게.
 */
(function () {
  "use strict";

  const L = "#6b5d54";                    // 선 — v4보다 한 톤 밝게
  const S = `stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S2 = `stroke="${L}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  const EYE = "#544940";
  const CHEEK = "#ffb8bf";
  const MOUTH = "#96706c";

  /* ---------- 얼굴 부품 ----------
     눈 사이 32, 볼은 눈 바로 옆. 이 간격이 치이카와 느낌의 전부입니다. */
  const EL = 104, ER = 136;              // 눈 x
  const BL = 84, BR = 156;               // 볼 x

  const eyeDot = (x, y) =>
    `<ellipse cx="${x}" cy="${y}" rx="7" ry="8.5" fill="${EYE}"/>` +
    `<circle cx="${x + 2.4}" cy="${y - 2.8}" r="2.4" fill="#fff"/>`;
  const eyes = (y) => eyeDot(EL, y) + eyeDot(ER, y);
  const eyesArc = (y) =>
    `<path d="M${EL - 8} ${y + 3}q8-8 16 0" ${S} fill="none"/>` +
    `<path d="M${ER - 8} ${y + 3}q8-8 16 0" ${S} fill="none"/>`;
  const eyesDroop = (y) =>
    `<path d="M${EL - 8} ${y}q8 8 16 0" ${S} fill="none"/>` +
    `<path d="M${ER - 8} ${y}q8 8 16 0" ${S} fill="none"/>`;
  const eyesHeart = (y) =>
    [EL, ER].map((x) =>
      `<path d="M${x} ${y - 3}c-3.5-5-12-2.5-12 3.5 0 6 8.5 9.5 12 14 3.5-4.5 12-8 12-14 0-6-8.5-8.5-12-3.5z" fill="#ff7d92"/>` +
      `<circle cx="${x + 3.5}" cy="${y}" r="2.1" fill="#fff" opacity=".9"/>`).join("");

  const cheeks = (y) =>
    `<ellipse cx="${BL}" cy="${y}" rx="12" ry="6.5" fill="${CHEEK}"/>` +
    `<ellipse cx="${BR}" cy="${y}" rx="12" ry="6.5" fill="${CHEEK}"/>`;

  // 입은 아주 작게. 치이카와 입은 눈 사이 폭을 절대 안 넘습니다.
  const mW = (y) => `<path d="M114 ${y}q3 4.5 6 0q3 4.5 6 0" ${S2} fill="none"/>`;
  const mSmile = (y) => `<path d="M114 ${y}q6 6 12 0" ${S2} fill="none"/>`;
  const mOpen = (y) => `<path d="M113 ${y}q7 11 14 0z" fill="${MOUTH}" ${S2}/>`;
  const mO = (y) => `<ellipse cx="120" cy="${y}" rx="4.5" ry="5.5" fill="${MOUTH}" ${S2}/>`;
  const mWave = (y) => `<path d="M111 ${y}q4.5-4 9 0t9 0" ${S2} fill="none"/>`;

  /* ============================================================
     바텡 — 크림 말랑이 바텐더
     ============================================================ */
  const CREAM = "#fffaf1";
  const VEST = "#5c5766";
  const TIE = "#e87f74";
  const PEEL = "#f7cd5c";

  // 머리는 살짝 납작하게. 정원보다 눌린 게 더 귀엽습니다.
  const B_HEAD = `<ellipse cx="120" cy="88" rx="58" ry="55" fill="${CREAM}" ${S}/>`;
  const B_TORSO = `<path d="M120 130c-19 0-32 14-35 32-2 10 5 18 15 18h40c10 0 17-8 15-18-3-18-16-32-35-32z" fill="${CREAM}" ${S}/>`;
  const B_VEST = `<path d="M120 130c-19 0-32 14-35 32-2 10 5 18 15 18h8l12-26 12 26h8c10 0 17-8 15-18-3-18-16-32-35-32z" fill="${VEST}" ${S}/>`;
  const B_TIE =
    `<path d="M120 148l-12-7v14zM120 148l12-7v14z" fill="${TIE}" ${S2}/>` +
    `<circle cx="120" cy="148" r="3.6" fill="${TIE}" ${S2}/>`;
  const B_SHOES =
    `<ellipse cx="106" cy="183" rx="12.5" ry="8" fill="${VEST}" ${S}/>` +
    `<ellipse cx="134" cy="183" rx="12.5" ry="8" fill="${VEST}" ${S}/>`;
  const CURL_D = "M114 34c-3-14 5-25 19-25 10 0 16 8 13 17-2 6-9 9-14 4";
  const B_CURL =
    `<path d="${CURL_D}" stroke="${L}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
    `<path d="${CURL_D}" stroke="${PEEL}" stroke-width="7.5" fill="none" stroke-linecap="round"/>`;

  const bArm = (x, y, rot) =>
    `<ellipse cx="${x}" cy="${y}" rx="9.5" ry="12.5" fill="${CREAM}" ${S} transform="rotate(${rot} ${x} ${y})"/>`;
  const B_ARMS = bArm(83, 158, -20) + bArm(157, 158, 20);
  const B_ARM_L = bArm(83, 158, -20);
  const B_ARM_UP = bArm(170, 112, 40);

  const bateng = (arms, face, extra) =>
    (arms || B_ARMS) + B_SHOES + B_TORSO + B_VEST + B_CURL + B_HEAD + B_TIE + face + (extra || "");

  /* ============================================================
     술꼬 — 하늘 말랑이 고래
     ============================================================ */
  const SKY = "#d7ebfa";
  const SKY_D = "#a8d2ef";
  const BELLY = "#fffcf6";

  const W_BODY = `<path d="M120 32c-37 0-63 28-63 67 0 43 26 71 63 71s63-28 63-71c0-39-26-67-63-67z" fill="${SKY}" ${S}/>`;
  const W_FLUKE =
    `<path d="M114 150c-5 13-25 29-42 27-8-1-7-9 2-14 12-8 25-13 32-22z" fill="${SKY_D}" ${S}/>` +
    `<path d="M126 150c5 13 25 29 42 27 8-1 7-9-2-14-12-8-25-13-32-22z" fill="${SKY_D}" ${S}/>`;
  const W_BELLY = `<ellipse cx="120" cy="144" rx="32" ry="19" fill="${BELLY}" ${S2}/>`;
  const W_SPOUT =
    `<path d="M115 36q5-4 10 0" ${S2} fill="none"/>` +
    `<path d="M120 20c-5-6-2-13 4-13s9 7 4 13z" fill="${SKY_D}" ${S2}/>` +
    `<path d="M99 29c-3.5-4.5-1.5-10 2.5-10s6 5.5 2.5 10z" fill="${SKY_D}" ${S2}/>` +
    `<path d="M141 29c-3.5-4.5-1.5-10 2.5-10s6 5.5 2.5 10z" fill="${SKY_D}" ${S2}/>`;

  const wFin = (x, y, rot) =>
    `<ellipse cx="${x}" cy="${y}" rx="12" ry="17" fill="${SKY_D}" ${S} transform="rotate(${rot} ${x} ${y})"/>`;
  const W_FINS = wFin(57, 126, -35) + wFin(183, 126, 35);
  const W_FIN_R = wFin(183, 126, 35);
  const W_FIN_UP = wFin(50, 74, 40);

  const sulkko = (fins, face, extra) =>
    (fins || W_FINS) + W_FLUKE + W_BODY + W_BELLY + W_SPOUT + face + (extra || "");

  /* ---------- 소품 ---------- */
  const METAL = "#f0f4f8";
  const shaker = (x, y) =>
    `<rect x="${x}" y="${y}" width="27" height="38" rx="10" fill="${METAL}" ${S}/>` +
    `<rect x="${x + 3.5}" y="${y - 11}" width="20" height="13" rx="5.5" fill="${METAL}" ${S}/>`;
  const glass = (x, y) =>
    `<path d="M${x - 18} ${y}h36l-18 21z" fill="${METAL}" ${S}/>` +
    `<path d="M${x} ${y + 21}v12M${x - 10} ${y + 33}h20" ${S} fill="none"/>` +
    `<circle cx="${x + 10}" cy="${y + 4}" r="4.5" fill="${TIE}" ${S2}/>`;
  const zzz = (x, y) =>
    `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="${L}">z</text>` +
    `<text x="${x + 17}" y="${y - 16}" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="${L}">z</text>`;
  const heart = (x, y) =>
    `<path d="M${x} ${y}c-4.5-7-14-3.5-14 4.5 0 7 10 10.5 14 16 4.5-5.5 14-9 14-16 0-8-9.5-11.5-14-4.5z" fill="#ff96a6" ${S2}/>`;

  /* ===================== 포즈 ===================== */
  // 바텡: 눈 96 · 볼 108 · 입 112
  // 술꼬: 눈 100 · 볼 112 · 입 118
  const POSES = {
    bt_hi: ["반가워", bateng(B_ARM_L + B_ARM_UP, eyesArc(98) + cheeks(108) + mSmile(112))],
    bt_idle: ["뭐 마실래", bateng(null, eyes(96) + cheeks(108) + mW(112))],
    bt_shake: ["셰이킹", bateng(B_ARM_L + B_ARM_UP, eyes(96) + cheeks(108) + mO(113), shaker(157, 56))],
    bt_cheers: ["건배", bateng(B_ARM_L + B_ARM_UP, eyesArc(98) + cheeks(108) + mOpen(110), glass(170, 54))],
    bt_wow: ["헉", bateng(null, eyes(96) + cheeks(110) + mO(115))],
    bt_love: ["좋아요", bateng(null, eyesHeart(96) + cheeks(108) + mSmile(112), heart(50, 54) + heart(190, 70))],

    sk_hi: ["반가워", sulkko(W_FIN_UP + W_FIN_R, eyesArc(102) + cheeks(112) + mSmile(118))],
    sk_drunk: ["취했다", sulkko(null, eyesDroop(100) + cheeks(112) + mWave(118))],
    sk_happy: ["신남", sulkko(null, eyesArc(102) + cheeks(112) + mOpen(116))],
    sk_love: ["사랑", sulkko(null, eyesHeart(100) + cheeks(112) + mSmile(118), heart(50, 54) + heart(190, 70))],
    sk_cry: ["울음", sulkko(null, eyesDroop(98) + cheeks(112) + mOpen(118) +
      `<path d="M90 110q-3 12 2 18" stroke="#96cff2" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M150 110q3 12-2 18" stroke="#96cff2" stroke-width="4" fill="none" stroke-linecap="round"/>`)],
    sk_sleep: ["꿀잠", sulkko(null, eyesDroop(102) + cheeks(112) + mO(120), zzz(176, 56))],
  };

  function svg(key, size) {
    const p = POSES[key];
    if (!p) return "";
    const d = size ? ` width="${size}" height="${size}"` : ' width="100%" height="auto"';
    return `<svg viewBox="0 0 240 240"${d} role="img" aria-label="${p[0]}">${p[1]}</svg>`;
  }
  window.BT5 = { keys: Object.keys(POSES), label: (k) => POSES[k][0], svg };
})();
