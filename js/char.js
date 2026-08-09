/* 바텐톡 캐릭터 — 댓글용 스티커
 *
 * 캐릭터 둘
 *  · 바텡 : 조끼 입고 나비넥타이 맨 바텐더. 머리 위 노란 건 레몬필(가니시)입니다.
 *  · 술꼬 : 술고래. 늘 알딸딸하고, 표정이 과합니다.
 *
 * 그림체 — 일부러 못 그린 손그림
 *  못 그린 티는 대충 그린다고 나오지 않습니다. 못 그리는 사람이 실제로 저지르는
 *  실수를 하나씩 집어넣어야 나와요.
 *   · 좌우 눈 크기와 높이가 다릅니다
 *   · 머리·몸통 윤곽선의 끝점이 시작점과 안 맞습니다 (한 번에 못 그은 원)
 *   · 같은 선을 한 번 더 흐리게 겹쳐 긋습니다 (스케치 자국)
 *   · feTurbulence 로 도형 전체를 밀어 선을 떨리게 합니다
 *  여기에 포즈마다 몸을 기울이고 효과선을 붙여 정적인 느낌을 없앴습니다.
 *
 * 왜 인라인 SVG 인가
 *  - 이미지 파일이면 오프라인에서 깨지고 요청도 20개 넘게 늘어납니다. PWA 라 치명적이에요.
 *  - 다크 모드용 이미지를 따로 준비할 필요가 없습니다.
 *
 * 저장 방식
 *  본문에는 `:bt_hi:` 같은 토큰만 저장합니다.
 *  - 동기화·localStorage 모두 그냥 문자열이라 추가 처리가 필요 없고,
 *  - 이 스크립트가 없어도 글이 깨지지 않고 토큰만 그대로 보입니다.
 *  렌더링은 esc() 뒤에 하고, 화이트리스트 키만 치환하므로 태그 주입이 안 됩니다.
 */
(function () {
  "use strict";

  /* ---------- 팔레트 ---------- */
  const L = "#6f6055";          // 연필선
  const EYE = "#3f362f";
  const CHEEK = "#ffb0b8";
  const MOUTH = "#8f5f5c";
  const CREAM = "#fffaf1";
  const VEST = "#5c5766";
  const TIE = "#e8675c";
  const PEEL = "#f7cd5c";
  const SKY = "#d7ebfa";
  const SKY_D = "#a8d2ef";
  const BELLY = "#fffcf6";
  const METAL = "#f0f4f8";
  const RED = "#e05545";

  const S = (w) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  /* ---------- 떨림 필터 ----------
     feDisplacementMap 의 실제 이동량은 scale 의 절반이 최대치입니다.
     그래서 값이 커 보여도 실제로는 ±11 정도만 움직여요. */
  const wob = (id, seed, freq, scale) =>
    `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`;

  /* ============================================================
     얼굴 — 좌우가 안 맞습니다. 일부러요.
     ============================================================ */
  const EL = 103, ER = 137;

  const eyes = (y) =>
    `<ellipse cx="${EL}" cy="${y + 2}" rx="8" ry="9.5" fill="${EYE}"/>` +
    `<circle cx="${EL + 2.6}" cy="${y - 1.5}" r="2.6" fill="#fff"/>` +
    `<ellipse cx="${ER}" cy="${y}" rx="6.5" ry="8.5" fill="${EYE}"/>` +
    `<circle cx="${ER + 2.2}" cy="${y - 3.4}" r="2.2" fill="#fff"/>`;
  const eyesFlat = (y) =>
    `<circle cx="${EL}" cy="${y + 2}" r="4.4" fill="${EYE}"/>` +
    `<circle cx="${ER}" cy="${y}" r="3.8" fill="${EYE}"/>`;
  const eyesArc = (y) =>
    `<path d="M${EL - 10} ${y + 5}q10-11 19-2" ${S(3.4)} fill="none"/>` +
    `<path d="M${ER - 9} ${y + 3}q9-9 17 1" ${S(3)} fill="none"/>`;
  const eyesDroop = (y) =>
    `<path d="M${EL - 10} ${y - 1}q10 10 19 1" ${S(3.4)} fill="none"/>` +
    `<path d="M${ER - 9} ${y + 1}q9 9 17-2" ${S(3)} fill="none"/>`;
  // 놀랐을 때 — 흰자를 크게, 눈동자를 아주 작게
  const eyesBulge = (y) =>
    `<ellipse cx="${EL - 2}" cy="${y}" rx="17" ry="19" fill="#fff" ${S(3.4)}/>` +
    `<circle cx="${EL}" cy="${y + 2}" r="5" fill="${EYE}"/>` +
    `<ellipse cx="${ER + 3}" cy="${y - 3}" rx="14" ry="16.5" fill="#fff" ${S(3)}/>` +
    `<circle cx="${ER + 2}" cy="${y - 1}" r="4.2" fill="${EYE}"/>`;
  const eyesX = (y) =>
    `<path d="M${EL - 9} ${y - 8}l19 18M${EL + 10} ${y - 9}l-19 18" ${S(4)} fill="none"/>` +
    `<path d="M${ER - 8} ${y - 9}l16 17M${ER + 9} ${y - 8}l-17 16" ${S(3.6)} fill="none"/>`;
  const eyesSwirl = (y) =>
    `<path d="M${EL} ${y - 6}a6 6 0 1 1-5 9 10 10 0 1 0 13-12" ${S(3.4)} fill="none"/>` +
    `<path d="M${ER} ${y - 5}a5 5 0 1 1-4 8 9 9 0 1 0 11-10" ${S(3)} fill="none"/>`;
  const eyesMad = (y) =>
    `<ellipse cx="${EL}" cy="${y + 3}" rx="7" ry="8" fill="${EYE}"/>` +
    `<ellipse cx="${ER}" cy="${y + 1}" rx="6" ry="7.5" fill="${EYE}"/>` +
    `<path d="M${EL - 12} ${y - 12}l17 7M${ER + 11} ${y - 13}l-16 8" ${S(3.6)} fill="none"/>`;
  const eyesHeart = (y) =>
    [[EL, 1.1], [ER, 0.92]].map(([x, k]) =>
      `<path d="M${x} ${y - 3 * k}c-${4 * k}-${6 * k}-${13 * k}-${3 * k}-${13 * k} ${4 * k} 0 ${6 * k} ${9 * k} ${10 * k} ${13 * k} ${15 * k} ${4 * k}-${5 * k} ${13 * k}-${9 * k} ${13 * k}-${15 * k} 0-${7 * k}-${9 * k}-${10 * k}-${13 * k}-${4 * k}z" fill="#ff6d86"/>`).join("");

  const cheeks = (y) =>
    `<ellipse cx="80" cy="${y}" rx="13" ry="7" fill="${CHEEK}"/>` +
    `<ellipse cx="159" cy="${y + 2}" rx="10.5" ry="6.2" fill="${CHEEK}"/>`;
  // 부끄러울 때는 볼을 얼굴 절반만큼 크게
  const cheeksBig = (y) =>
    `<ellipse cx="82" cy="${y}" rx="21" ry="12" fill="${CHEEK}" opacity=".9"/>` +
    `<ellipse cx="158" cy="${y + 2}" rx="19" ry="11" fill="${CHEEK}" opacity=".9"/>`;

  /* 입 — 중심에서 1 정도 어긋나 있습니다. */
  const mFlat = (y) => `<path d="M112 ${y}q4 4 8 0q4 4 7 1" ${S(2.8)} fill="none"/>`;
  const mSmile = (y) => `<path d="M111 ${y - 1}q8 8 16-1" ${S(2.8)} fill="none"/>`;
  const mO = (y) => `<ellipse cx="121" cy="${y}" rx="5" ry="6" fill="${MOUTH}" ${S(2.6)}/>`;
  const mWave = (y) => `<path d="M109 ${y}q5-5 10 0t10-1" ${S(2.8)} fill="none"/>`;
  const mFrown = (y) => `<path d="M110 ${y + 6}q9-9 17 0" ${S(3)} fill="none"/>`;
  const mBig = (y) => `<path d="M99 ${y}q22 27 43 1q-21 6-43-1z" fill="${MOUTH}" ${S(2.8)}/>`;
  // 얼굴 아래 절반을 통째로 먹는 입
  const mHuge = (y) =>
    `<path d="M90 ${y}q31 42 60 1q-30 9-60-1z" fill="${MOUTH}" ${S(3)}/>` +
    `<path d="M112 ${y + 26}q9 10 17 0z" fill="#ff8a8a"/>`;

  /* ============================================================
     효과 — 역동적으로 보이게 하는 건 결국 이것들입니다.
     ============================================================ */
  const speedL = (x, y) => `<path d="M${x} ${y}h-26M${x - 4} ${y + 16}h-20M${x - 2} ${y - 16}h-22" ${S(3.6)} fill="none"/>`;
  const speedR = (x, y) => `<path d="M${x} ${y}h26M${x + 4} ${y + 16}h20M${x + 2} ${y - 16}h22" ${S(3.6)} fill="none"/>`;
  const speedUp = (y) => `<path d="M72 ${y}l-8 16M120 ${y + 6}l0 18M168 ${y}l8 16" ${S(3.6)} fill="none"/>`;
  const buzz =
    `<path d="M40 96q-7 12 0 24M28 90q-9 16 0 32" ${S(3.4)} fill="none"/>` +
    `<path d="M200 96q7 12 0 24M212 90q9 16 0 32" ${S(3.4)} fill="none"/>`;
  const sweat = (x, y, k) => {
    const u = k || 1;
    return `<path d="M${x} ${y}c-${6 * u} ${9 * u}-${3 * u} ${16 * u} ${3 * u} ${16 * u}s${9 * u}-7 ${3 * u}-${16 * u}z" fill="#c3e6f8" ${S(2.6)}/>`;
  };
  const excl = (x, y, rot) =>
    `<g transform="rotate(${rot || 0} ${x} ${y})"><path d="M${x} ${y}v16" ${S(5.5)}/>` +
    `<circle cx="${x}" cy="${y + 24}" r="3.2" fill="${L}"/></g>`;
  const quest = (x, y, rot) =>
    `<g transform="rotate(${rot || 0} ${x} ${y})">` +
    `<path d="M${x - 8} ${y}a9 9 0 0 1 17 4c0 5-8 6-8 11" ${S(5)} fill="none"/>` +
    `<circle cx="${x + 9}" cy="${y + 24}" r="3.2" fill="${L}"/></g>`;
  const sparkle = (x, y, r) =>
    `<path d="M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3}-${r * 0.7} ${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.3}-${r * 0.7}-${r * 0.7}-${r * 0.3} ${r * 0.7}-${r * 0.3}z" fill="#ffd45c" ${S(2.2)}/>`;
  // 빡친 표시 (힘줄)
  const veins = (x, y) =>
    `<path d="M${x} ${y}l8-7 8 7M${x} ${y + 10}l8-7 8 7" stroke="${RED}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const tears = (y) =>
    `<path d="M92 ${y}q-8 24-2 40" stroke="#7fc4ea" stroke-width="9" fill="none" stroke-linecap="round"/>` +
    `<path d="M148 ${y - 2}q9 22 3 38" stroke="#7fc4ea" stroke-width="7.5" fill="none" stroke-linecap="round"/>`;
  const zzz = (x, y) =>
    `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="30" font-weight="800" fill="${L}" transform="rotate(-12 ${x} ${y})">Z</text>` +
    `<text x="${x + 22}" y="${y - 22}" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="${L}" transform="rotate(8 ${x + 22} ${y - 22})">z</text>`;
  const heart = (x, y, k) =>
    `<path d="M${x} ${y}c-${5 * k}-${8 * k}-${15 * k}-${4 * k}-${15 * k} ${5 * k} 0 ${8 * k} ${11 * k} ${11 * k} ${15 * k} ${17 * k} ${5 * k}-${6 * k} ${15 * k}-${9 * k} ${15 * k}-${17 * k} 0-${9 * k}-${10 * k}-${13 * k}-${15 * k}-${5 * k}z" fill="#ff7f95" ${S(2.5)}/>`;
  const confetti =
    `<rect x="42" y="44" width="11" height="7" rx="2" fill="#ff8fa8" transform="rotate(-24 47 47)"/>` +
    `<rect x="188" y="56" width="10" height="7" rx="2" fill="#8fd0f0" transform="rotate(30 193 59)"/>` +
    `<rect x="62" y="26" width="9" height="6" rx="2" fill="#a9e0a2" transform="rotate(14 66 29)"/>` +
    `<rect x="168" y="26" width="9" height="6" rx="2" fill="#ffd45c" transform="rotate(-32 172 29)"/>`;

  /* ============================================================
     바텡 — 윤곽을 일부러 안 닫습니다.
     ============================================================ */
  const B_HEAD =
    `<path d="M120 33c-33 0-59 24-59 55 0 31 26 55 59 55 34 0 59-25 58-56 0-30-26-54-56-54" fill="${CREAM}" ${S(3.2)}/>` +
    // 같은 선을 한 번 더, 살짝 어긋나게 — 스케치 자국
    `<path d="M64 100c-1-30 24-56 56-57" ${S(2.2)} fill="none" opacity=".5"/>`;
  const B_TORSO = `<path d="M120 130c-20 0-33 15-36 33-2 10 5 18 15 18h41c11 0 18-8 16-19-4-18-17-32-37-32" fill="${CREAM}" ${S(2.9)}/>`;
  const B_VEST = `<path d="M120 130c-20 0-33 15-36 33-2 10 5 18 15 18h9l12-27 13 27h8c11 0 18-8 16-19-4-18-17-32-37-32z" fill="${VEST}" ${S(3.1)}/>`;
  const B_TIE =
    `<path d="M120 148l-13-8v15zM121 148l12-8v14z" fill="${TIE}" ${S(2.6)}/>` +
    `<circle cx="120" cy="148" r="3.8" fill="${TIE}" ${S(2.5)}/>`;
  const B_SHOES =
    `<ellipse cx="105" cy="184" rx="13" ry="8" fill="${VEST}" ${S(3.3)}/>` +
    `<ellipse cx="135" cy="182" rx="11.5" ry="8.6" fill="${VEST}" ${S(2.9)}/>`;
  const CURL_D = "M114 34c-3-14 5-25 19-25 10 0 16 8 13 17-2 6-9 9-14 4";
  const B_CURL =
    `<path d="${CURL_D}" stroke="${L}" stroke-width="12.5" fill="none" stroke-linecap="round"/>` +
    `<path d="${CURL_D}" stroke="${PEEL}" stroke-width="8" fill="none" stroke-linecap="round"/>`;

  const bArm = (x, y, rot, w) =>
    `<ellipse cx="${x}" cy="${y}" rx="9.5" ry="13" fill="${CREAM}" ${S(w)} transform="rotate(${rot} ${x} ${y})"/>`;
  const ARM_DL = bArm(82, 158, -20, 3.3);
  const ARM_DR = bArm(158, 157, 22, 2.9);
  const ARM_UR = bArm(172, 108, 45, 3.1);
  const ARM_UL = bArm(68, 108, -45, 3.2);
  const ARM_LIMP = bArm(80, 172, -70, 3.1) + bArm(160, 170, 68, 2.9);
  // 엄지척 — 주먹에 엄지 하나
  const THUMB =
    `<path d="M158 106h17a6 6 0 0 1 6 6v13a6 6 0 0 1-6 6h-17z" fill="${CREAM}" ${S(3.1)}/>` +
    `<rect x="163" y="86" width="10" height="21" rx="5" fill="${CREAM}" ${S(3)}/>`;

  const bateng = (arms, face, extra) => ({
    r: arms + B_SHOES + B_TORSO + B_VEST + B_CURL + B_HEAD + (extra || ""),
    s: B_TIE + face,
  });

  /* ============================================================
     술꼬
     ============================================================ */
  const W_BODY =
    `<path d="M120 32c-38 0-64 28-64 67 0 44 27 72 64 72 38 0 63-29 62-73 0-38-26-66-61-66" fill="${SKY}" ${S(3.2)}/>` +
    `<path d="M60 104c-2-38 26-68 58-70" ${S(2.2)} fill="none" opacity=".45"/>`;
  const W_FLUKE =
    `<path d="M114 150c-6 14-26 30-43 27-8-1-7-10 2-15 13-8 26-13 33-23z" fill="${SKY_D}" ${S(3.3)}/>` +
    `<path d="M126 149c5 14 26 31 43 28 8-2 6-10-3-15-12-8-25-13-32-23z" fill="${SKY_D}" ${S(2.9)}/>`;
  const W_BELLY = `<ellipse cx="121" cy="145" rx="33" ry="18" fill="${BELLY}" ${S(2.5)}/>`;
  // k 만큼 물줄기가 높이 솟습니다
  const W_SPOUT = (k) => {
    const u = k || 0;
    return `<path d="M114 36q6-5 11 1" ${S(2.6)} fill="none"/>` +
      `<path d="M120 ${20 - u}c-6-7-2-14 4-14s10 8 4 14z" fill="${SKY_D}" ${S(2.7)}/>` +
      `<path d="M97 ${29 - u}c-4-5-2-11 3-11s6 6 2 11z" fill="${SKY_D}" ${S(2.4)}/>` +
      `<path d="M143 ${30 - u}c-4-5-1-11 3-11s6 6 3 11z" fill="${SKY_D}" ${S(2.5)}/>`;
  };
  const wFin = (x, y, rot, w) =>
    `<ellipse cx="${x}" cy="${y}" rx="12" ry="18" fill="${SKY_D}" ${S(w)} transform="rotate(${rot} ${x} ${y})"/>`;
  const FIN_DL = wFin(56, 126, -35, 3.3);
  const FIN_DR = wFin(184, 125, 36, 2.9);
  const FIN_UL = wFin(48, 72, 42, 3.2);
  const FIN_UR = wFin(192, 70, -42, 3);

  const sulkko = (fins, face, extra) => ({
    r: fins + W_FLUKE + W_BODY + W_BELLY + (extra || ""),
    s: face,
  });

  /* ---------- 소품 ---------- */
  const shaker = (x, y, rot) =>
    `<g transform="rotate(${rot || 0} ${x + 14} ${y + 20})">` +
    `<rect x="${x}" y="${y}" width="28" height="40" rx="10" fill="${METAL}" ${S(3.2)}/>` +
    `<rect x="${x + 3}" y="${y - 12}" width="21" height="14" rx="6" fill="${METAL}" ${S(2.9)}/></g>`;
  const glass = (x, y) =>
    `<path d="M${x - 19} ${y}h37l-18 22z" fill="${METAL}" ${S(3.2)}/>` +
    `<path d="M${x} ${y + 22}v12M${x - 10} ${y + 34}h21" ${S(2.9)} fill="none"/>` +
    `<circle cx="${x + 10}" cy="${y + 5}" r="4.6" fill="${TIE}" ${S(2.5)}/>`;

  /* ===================== 스티커 =====================
     key: [라벨, {r: 큰형태, s: 얼굴}, seed, 기울기(도), 위아래 이동] */
  const P = {
    /* ---- 바텡 ---- */
    hi: ["어서오세요", bateng(ARM_DL + ARM_UR,
      eyesArc(96) + cheeks(108) + mBig(112), speedR(196, 92)), 3, -8, 0],

    idle: ["뭐 마실래", bateng(ARM_DL + ARM_DR,
      eyesFlat(96) + cheeks(108) + mFlat(114)), 11, 2, 0],

    shake: ["셰이킹", bateng(ARM_DL + ARM_UR,
      eyes(96) + cheeks(108) + mO(114) + sweat(62, 62, .8),
      shaker(158, 50, 14) + buzz), 19, 6, 0],

    cheers: ["건배", bateng(ARM_DL + ARM_UR,
      eyesArc(94) + cheeks(106) + mHuge(108),
      glass(176, 46) + sparkle(58, 56, 13) + sparkle(206, 92, 10)), 27, -9, 0],

    good: ["최고", bateng(ARM_DL + THUMB,
      eyesArc(96) + cheeks(108) + mBig(112), sparkle(56, 54, 12)), 51, -5, 0],

    huh: ["에?", bateng(ARM_DL + ARM_DR,
      eyesBulge(94) + mO(122), excl(46, 44, -18) + excl(196, 40, 16)), 35, 4, 0],

    angry: ["빡침", bateng(ARM_DL + ARM_DR,
      eyesMad(98) + mFrown(118), veins(178, 40) + buzz), 59, 3, 0],

    shy: ["부끄", bateng(ARM_UL + ARM_UR,
      eyesArc(96) + cheeksBig(110) + mSmile(116)), 67, -3, 0],

    think: ["궁금", bateng(ARM_DL + ARM_DR,
      eyesFlat(96) + mFlat(116), quest(184, 40, 12)), 75, 5, 0],

    fight: ["파이팅", bateng(ARM_UL + ARM_UR,
      eyesArc(94) + cheeks(106) + mHuge(108),
      speedUp(196) + sparkle(38, 60, 11)), 83, -4, -6],

    congrats: ["축하", bateng(ARM_UL + ARM_UR,
      eyesArc(94) + cheeks(106) + mBig(112),
      confetti + sparkle(206, 96, 11)), 91, 6, -4],

    love: ["하트", bateng(ARM_DL + ARM_DR,
      eyesHeart(96) + cheeks(110) + mSmile(118),
      heart(44, 50, .95) + heart(198, 72, .8)), 99, -7, 0],

    dead: ["영업 끝", bateng(ARM_LIMP,
      eyesX(98) + mWave(120) + sweat(154, 58, .7)), 43, 10, 6],

    /* ---- 술꼬 ---- */
    whi: ["안녕", sulkko(FIN_UL + FIN_DR,
      eyesArc(102) + cheeks(112) + mBig(118), W_SPOUT(6) + speedL(44, 96)), 7, -7, 0],

    wdrunk: ["꽐라", sulkko(FIN_DL + FIN_DR,
      eyesSwirl(102) + cheeks(114) + mWave(120), W_SPOUT(0) + sweat(58, 70, .8)), 15, -11, 4],

    whappy: ["개신남", sulkko(FIN_UL + FIN_UR,
      eyesArc(100) + cheeks(110) + mHuge(114),
      W_SPOUT(8) + speedUp(192) + sparkle(40, 66, 12) + sparkle(202, 60, 11)), 23, 5, -8],

    wlove: ["사랑해", sulkko(FIN_DL + FIN_UR,
      eyesHeart(100) + cheeks(112) + mSmile(120),
      W_SPOUT(0) + heart(42, 52, 1) + heart(196, 74, .8)), 31, 8, 0],

    wcry: ["엉엉", sulkko(FIN_DL + FIN_DR,
      eyesDroop(96) + cheeks(112) + mHuge(114) + tears(106), W_SPOUT(0)), 39, -4, 0],

    wsleep: ["뻗음", sulkko(FIN_DL + FIN_DR,
      eyesDroop(102) + cheeks(112) + mO(122), W_SPOUT(0) + zzz(178, 60)), 47, 14, 4],

    wgood: ["개좋아", sulkko(FIN_UL + FIN_DR,
      eyesArc(100) + cheeks(112) + mBig(118),
      W_SPOUT(4) + sparkle(38, 54, 13) + sparkle(200, 84, 10)), 107, -6, 0],

    wangry: ["빡친 고래", sulkko(FIN_DL + FIN_DR,
      eyesMad(104) + mFrown(122), W_SPOUT(10) + veins(176, 46)), 115, 4, 0],

    wwow: ["헐", sulkko(FIN_DL + FIN_DR,
      eyesBulge(100) + mO(128), W_SPOUT(0) + excl(42, 46, -16) + excl(198, 44, 14)), 123, 3, 0],

    wshy: ["부끄", sulkko(FIN_UL + FIN_UR,
      eyesArc(100) + cheeksBig(114) + mSmile(120), W_SPOUT(0)), 131, -3, 0],
  };

  const KEYS = Object.keys(P);
  const BATENG_KEYS = ["hi", "idle", "shake", "cheers", "good", "huh", "angry", "shy", "think", "fight", "congrats", "love", "dead"];
  const SULKKO_KEYS = KEYS.filter((k) => BATENG_KEYS.indexOf(k) < 0);

  /* 예전 스티커 키 → 새 키.
     이미 올라간 댓글의 토큰이 깨지면 안 되니까 남겨둡니다. */
  const ALIAS = {
    smile: "hi", wink: "hi", tired: "dead", cry: "dead",
    surprise: "huh", fighting: "fight", drunk: "wdrunk", sleep: "wsleep",
    gdrunk: "wdrunk", gcheers: "cheers", ghappy: "whappy", glove: "wlove",
    gsleep: "wsleep", gcry: "wcry", gsurprise: "wwow", ggood: "wgood",
  };
  const resolve = (k) => (P[k] ? k : (ALIAS[k] && P[ALIAS[k]] ? ALIAS[k] : null));

  const BIG = { freq: 0.045, scale: 22 };
  const FACE = { freq: 0.055, scale: 6 };
  const FIT = 0.85;   // 기울기 + 떨림으로 삐져나가지 않게 확보한 여백

  // 필터를 걸 때마다 브라우저가 노이즈를 새로 만듭니다.
  // 작게 쓰는 스티커는 어차피 떨림이 안 보이니 필터를 빼서 비용을 아껴요.
  let uid = 0;
  /* 이름표 — 포즈만으로는 어떤 스티커인지 헷갈려서 위에 적어줍니다.
     글꼴이 아직 안 왔거나 막혔을 때를 대비해 기본 손글씨 계열을 함께 지정해요. */
  const HAND = "'Nanum Pen Script', 'Gaegu', 'Segoe Script', cursive";

  /* 이름표 — 위치와 기울기를 스티커마다 다르게 둡니다.
     다만 무작위로 두면 다시 그릴 때마다 흔들리므로,
     각 스티커의 고유 seed 로 정해 늘 같은 모양이 나오게 했어요. */
  const TAG_SPOT = [
    { x: 66, y: -12 },    // 왼쪽 위
    { x: 120, y: -18 },   // 가운데 위
    { x: 176, y: -12 },   // 오른쪽 위
  ];

  const labelOf = (text, seed) => {
    const spot = TAG_SPOT[Math.abs(seed) % 3];
    const tilt = (Math.abs(seed * 7) % 13) - 6;      // -6도 ~ +6도
    return '<text x="' + spot.x + '" y="' + spot.y + '" text-anchor="middle"' +
      ' transform="rotate(' + tilt + ' ' + spot.x + ' ' + spot.y + ')"' +
      ' font-family="' + HAND + '" font-size="36" fill="' + L + '" stroke="none">' +
      text + '</text>';
  };

  function svg(key, size, rough) {
    const k = resolve(key);
    if (!k) return "";
    const p = P[k];
    const dim = size ? ` width="${size}" height="${size}"` : "";
    const t = `translate(120 ${120 + (p[4] || 0)}) rotate(${p[3]}) scale(${FIT}) translate(-120 -120)`;
    // 위쪽에 이름표 자리를 만들기 위해 화면을 -52 부터 시작합니다.
    const head = `<svg viewBox="0 -40 240 280"${dim} role="img" aria-label="${p[0]}">`;
    const tag = labelOf(p[0], p[2] || 0);
    if (!rough) {
      return `${head}${tag}<g transform="${t}">${p[1].r}${p[1].s}</g></svg>`;
    }
    // 같은 문서에 여러 개가 뜨므로 id 가 겹치면 안 됩니다.
    const a = `btr${++uid}`, b = `btf${uid}`;
    return head +
      `<defs>${wob(a, p[2], BIG.freq, BIG.scale)}${wob(b, p[2] + 13, FACE.freq, FACE.scale)}</defs>` +
      tag +
      `<g transform="${t}"><g filter="url(#${a})">${p[1].r}</g>` +
      `<g filter="url(#${b})">${p[1].s}</g></g></svg>`;
  }

  // 이미 esc() 로 이스케이프된 문자열에서 토큰만 스티커로 바꿉니다.
  // 화이트리스트에 있는 key 만 치환하므로 임의 태그가 들어갈 수 없어요.
  //
  // 카카오톡처럼, 스티커만 보낸 글은 크게 띄웁니다.
  //  · 스티커만 있는 글  → 큼직하게 (이 경우에만 떨림 필터를 겁니다)
  //  · 글자와 섞인 스티커 → 글자 크기에 맞춰 작게
  // 여러 개를 도배해도 화면이 망가지지 않도록 3개까지만 크게 처리해요.
  const TOKEN = /:bt_([a-z]+):/g;
  function render(escaped) {
    const s = String(escaped);
    const found = s.match(TOKEN) || [];
    const rest = s.replace(TOKEN, "").trim();
    const allKnown = found.length > 0 && found.every((t) => resolve(t.slice(4, -1)));
    const big = allKnown && rest === "" && found.length <= 3;
    const cls = big ? "bt-sticker big" : "bt-sticker";
    return s.replace(TOKEN, (m, k) =>
      resolve(k) ? `<span class="${cls}">${svg(k, 0, big)}</span>` : m);
  }


  /* ============================================================
     둘이서 — 홈 화면 인사말 옆에 놓는 장면.
     어깨동무하고 술병 하나를 나눠 든, 알딸딸한 바텡과 술꼬.
     스티커(240 기준)보다 넓은 무대라 좌표를 따로 잡았습니다.
     ============================================================ */
  function duo() {
    const id = "btduo";
    return `<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="바텡과 술꼬가 어깨동무한 그림">
      <defs>${wob(id, 7, "0.028", 5)}</defs>
      <g filter="url(#${id})">

        <!-- 기분 좋은 음표·거품 -->
        <path d="M40 40q6-14 14-4" ${S(2.6)} fill="none" opacity=".5"/>
        <circle cx="36" cy="42" r="3.4" fill="${SKY_D}" opacity=".7"/>
        <path d="M252 34q7-13 15-3" ${S(2.6)} fill="none" opacity=".45"/>
        <circle cx="248" cy="36" r="3" fill="${CHEEK}" opacity=".8"/>

        <!-- ===== 술꼬 (오른쪽, 덩치 큼) ===== -->
        <!-- 몸 -->
        <path d="M196 208q-30 0-38-26t8-46q17-21 42-20 27 1 39 22 11 20 2 41-10 29-38 29z"
              fill="${SKY}" ${S(4)}/>
        <!-- 배 -->
        <path d="M176 168q22 12 46 1 3 18-22 20-25 2-24-21z" fill="${BELLY}" ${S(3)}/>
        <!-- 꼬리 -->
        <path d="M254 132q16-13 22-4-8 6-6 15 9 3 6 12-12 3-24-9z" fill="${SKY_D}" ${S(3.4)}/>
        <!-- 물 뿜기 -->
        <path d="M212 108q-3-16 4-24" ${S(3.4)} fill="none"/>
        <circle cx="215" cy="79" r="5" fill="${SKY_D}" opacity=".85"/>
        <circle cx="226" cy="70" r="3.4" fill="${SKY_D}" opacity=".7"/>
        <!-- 눈: 반쯤 감김 -->
        <path d="M186 152q9 8 18 1" ${S(3.4)} fill="none"/>
        <path d="M214 150q8 7 16 0" ${S(3.2)} fill="none"/>
        <!-- 볼 -->
        <ellipse cx="182" cy="166" rx="9" ry="6.5" fill="${CHEEK}" opacity=".85"/>
        <ellipse cx="230" cy="164" rx="8" ry="6" fill="${CHEEK}" opacity=".8"/>
        <!-- 헤벌쭉한 입 -->
        <path d="M198 172q10 10 20 0" ${S(3.4)} fill="none"/>

        <!-- ===== 바텡 (왼쪽) ===== -->
        <!-- 몸통 + 조끼 -->
        <path d="M78 208q-22 0-26-22t6-36q10-14 26-13 18 1 26 15 9 14 4 34-5 22-24 22z"
              fill="${VEST}" ${S(4)}/>
        <path d="M70 150q16 10 32 0-2 30-16 30t-16-30z" fill="${CREAM}" ${S(3)}/>
        <!-- 나비넥타이 -->
        <path d="M78 150l-11-6v13z" fill="${TIE}" ${S(2.6)}/>
        <path d="M92 150l11-6v13z" fill="${TIE}" ${S(2.6)}/>
        <circle cx="85" cy="150" r="3.6" fill="${TIE}" ${S(2.2)}/>
        <!-- 머리 (한 번에 못 그은 원) -->
        <path d="M85 62q30 0 33 31 3 30-31 32-34 2-36-30-2-31 34-33z" fill="${CREAM}" ${S(4)}/>
        <!-- 레몬필 -->
        <path d="M92 58q10-16 24-9-8 5-8 12" fill="${PEEL}" ${S(3)}/>
        <!-- 눈: 취해서 처짐 -->
        <path d="M66 96q10 10 19 1" ${S(3.4)} fill="none"/>
        <path d="M96 94q9 9 17-1" ${S(3.2)} fill="none"/>
        <!-- 볼 -->
        <ellipse cx="62" cy="110" rx="9" ry="6.5" fill="${CHEEK}" opacity=".9"/>
        <ellipse cx="112" cy="108" rx="8" ry="6" fill="${CHEEK}" opacity=".85"/>
        <!-- 웃는 입 -->
        <path d="M76 112q10 11 21 1" ${S(3.4)} fill="none" stroke="${MOUTH}"/>

        <!-- ===== 어깨동무 팔 (바텡 → 술꼬) ===== -->
        <path d="M112 150q30-16 62-6" ${S(4.6)} fill="none"/>
        <circle cx="176" cy="145" r="6" fill="${CREAM}" ${S(3)}/>

        <!-- ===== 술병 (둘이 함께 든) ===== -->
        <g>
          <path d="M136 128h20v-22h-20z" fill="${METAL}" ${S(3)}/>
          <path d="M132 128h28l6 54q1 12-11 12h-18q-12 0-11-12z" fill="${RED}" ${S(3.4)}/>
          <path d="M138 150h16" ${S(2.6)} fill="none" opacity=".55" stroke="${CREAM}"/>
          <path d="M140 100h12v-8h-12z" fill="${PEEL}" ${S(2.6)}/>
        </g>
        <!-- 술꼬 지느러미가 병을 받침 -->
        <path d="M170 176q-14 8-24-2" ${S(4.2)} fill="none"/>

        <!-- 바닥 그림자 -->
        <ellipse cx="150" cy="212" rx="96" ry="7" fill="${L}" opacity=".1"/>
      </g>
    </svg>`;
  }

  const GROUPS = [
    { id: "bateng", label: "바텡", keys: BATENG_KEYS },
    { id: "sulkko", label: "술꼬", keys: SULKKO_KEYS },
  ];

  window.BTChar = {
    keys: KEYS,
    groups: GROUPS,
    icon: "hi",                       // 입력바 버튼에 쓸 기본 스티커
    label: (k) => { const r = resolve(k); return r ? P[r][0] : ""; },
    token: (k) => `:bt_${k}:`,
    svg,
    render,
    duo,
  };
})();
