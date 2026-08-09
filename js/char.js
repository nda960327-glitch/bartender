/* 바텐톡 마스코트 — 댓글용 스티커
 *
 * 캐릭터 둘
 *  · 바리   : 나비넥타이 맨 바텐더
 *  · 술고래 : 말 그대로 '술고래'. 늘 알딸딸합니다.
 *
 * 그림체
 *  굵은 검정 외곽선 + 플랫한 단색 + 전신 정면 포즈.
 *  선 굵기를 3으로 통일해서 작게 줄여도 실루엣이 뭉개지지 않게 했어요.
 *  그라데이션·그림자는 일부러 안 씁니다.
 *
 * 왜 인라인 SVG인가
 *  - 이미지 파일이면 오프라인에서 깨지고 요청도 24개 늘어납니다. PWA라 치명적이에요.
 *  - 다크 모드용 이미지를 따로 준비할 필요가 없습니다.
 *
 * 저장 방식
 *  본문에는 `:bt_smile:` 토큰만 저장합니다.
 *  - 동기화·localStorage 모두 그냥 문자열이라 추가 처리가 필요 없고,
 *  - 이 스크립트가 없어도 글이 깨지지 않고 토큰만 그대로 보입니다.
 *  렌더링은 esc() 뒤에 하고, 화이트리스트 키만 치환하므로 태그 주입이 안 됩니다.
 */
(function () {
  "use strict";

  /* ---------- 공통 팔레트 ---------- */
  const INK = "#231f20";      // 외곽선·눈
  const SKIN = "#ffdcbe";
  const HAIR = "#2b2b30";
  const VEST = "#34333c";
  const TIE = "#ff5c35";
  const SHOE = "#ffc93c";
  const SEA = "#86c9f2";
  const SEA_D = "#57a8dd";
  const BELLY = "#f2fbff";

  // 모든 도형에 같은 굵기의 선을 두릅니다. 이게 이 그림체의 전부예요.
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  /* ---------- 바리 (바텐더) ---------- */
  const BARI =
    // 신발
    `<rect x="21" y="53.5" width="9" height="6.5" rx="3.2" fill="${SHOE}" ${S}/>` +
    `<rect x="34" y="53.5" width="9" height="6.5" rx="3.2" fill="${SHOE}" ${S}/>` +
    // 팔
    `<rect x="11.5" y="35" width="6.5" height="15" rx="3.2" fill="${VEST}" ${S}/>` +
    `<rect x="46" y="35" width="6.5" height="15" rx="3.2" fill="${VEST}" ${S}/>` +
    // 몸통(조끼)
    `<rect x="17" y="32" width="30" height="23" rx="9" fill="${VEST}" ${S}/>` +
    // 셔츠 V
    `<path d="M27 33h10l-5 8z" fill="#fff" ${S}/>` +
    // 나비넥타이
    `<path d="M32 35l-5.5-3.5v7zM32 35l5.5-3.5v7z" fill="${TIE}" ${S}/>` +
    // 머리
    `<circle cx="32" cy="20" r="13.5" fill="${SKIN}" ${S}/>` +
    // 머리카락 (윗부분 덮개)
    `<path d="M18.6 19a13.5 13.5 0 0 1 26.8 0 11 11 0 0 0-26.8 0z" fill="${HAIR}" ${S}/>`;

  /* ---------- 술고래 ---------- */
  const GORAE =
    // 발
    `<rect x="22" y="52" width="8.5" height="6" rx="3" fill="${SEA_D}" ${S}/>` +
    `<rect x="33.5" y="52" width="8.5" height="6" rx="3" fill="${SEA_D}" ${S}/>` +
    // 지느러미(팔)
    `<ellipse cx="13" cy="38" rx="5" ry="7" fill="${SEA_D}" ${S}/>` +
    `<ellipse cx="51" cy="38" rx="5" ry="7" fill="${SEA_D}" ${S}/>` +
    // 몸통 (머리와 한 덩어리)
    `<path d="M32 8c12 0 19 9 19 21s-7 24-19 24-19-12-19-24S20 8 32 8z" fill="${SEA}" ${S}/>` +
    // 밝은 배
    `<ellipse cx="32" cy="42" rx="12" ry="10" fill="${BELLY}" ${S}/>`;

  /* ---------- 얼굴 조각 ---------- */
  // 바리 얼굴은 cy 20 근처, 고래 얼굴은 cy 28 근처입니다.
  const eye = (x, y, rx, ry) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx || 2.3}" ry="${ry || 3}" fill="${INK}"/>`;
  const eyeArc = (x, y) =>
    `<path d="M${x - 3.4} ${y}q3.4-4 6.8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const eyeDown = (x, y) =>
    `<path d="M${x - 3.4} ${y - 1.6}q3.4 4 6.8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const mouth = (x, y, w) =>
    `<path d="M${x - (w || 3.4)} ${y}q${w || 3.4} ${(w || 3.4) * 1.2} ${(w || 3.4) * 2} 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const mouthO = (x, y, rx, ry) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx || 2.6}" ry="${ry || 3.2}" fill="${INK}"/>`;
  const cheeks = (y, dx) =>
    `<circle cx="${32 - (dx || 9)}" cy="${y}" r="2.6" fill="#ff8f9a"/>` +
    `<circle cx="${32 + (dx || 9)}" cy="${y}" r="2.6" fill="#ff8f9a"/>`;
  const heartEye = (x, y) =>
    `<path d="M${x} ${y + 3.4}c-4.2-3.2-4.7-5.8-2.7-6.9 1.3-.8 2.7.3 2.7 1.2 0-.9 1.4-2 2.7-1.2 2 1.1 1.5 3.7-2.7 6.9z" fill="#ff4d6d"/>`;
  const spiral = (x, y) =>
    `<path d="M${x} ${y - 2.6}a2.8 2.8 0 1 1-2.4 4.2 4 4 0 1 0 5.5-5.1" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const tear = (x, y) =>
    `<path d="M${x} ${y}c1.7 2.8 2.6 4.2 2.6 5.4a2.6 2.6 0 0 1-5.2 0c0-1.2.9-2.6 2.6-5.4z" fill="#5ab0ea" ${S.replace("3", "2")}/>`;
  const zzz = (x, y) =>
    `<g fill="${INK}" font-family="system-ui,sans-serif" font-weight="900">` +
    `<text x="${x}" y="${y}" font-size="12">Z</text><text x="${x + 8}" y="${y - 8}" font-size="8">z</text></g>`;
  const sparkle = (x, y, s2) =>
    `<path d="M${x} ${y}l${(s2 || 4) * 0.4} ${s2 || 4} ${s2 || 4} ${(s2 || 4) * 0.4}-${s2 || 4} ${(s2 || 4) * 0.4}-${(s2 || 4) * 0.4} ${s2 || 4}-${(s2 || 4) * 0.4}-${s2 || 4}-${s2 || 4}-${(s2 || 4) * 0.4} ${s2 || 4}-${(s2 || 4) * 0.4}z" fill="#ffc93c" ${S.replace("3", "2")}/>`;
  // 손에 든 칵테일 잔
  const glass = (x, y) =>
    `<g fill="#fff" ${S.replace("3", "2.4")}><path d="M${x - 5} ${y}h10l-5 6.5z"/>` +
    `<path d="M${x} ${y + 6.5}v4.5" fill="none"/><path d="M${x - 3.5} ${y + 11}h7" fill="none"/></g>`;

  /* ===================== 스티커 ===================== */
  /* key: [라벨, 얼굴/소품, 몸통(생략하면 바리)] */
  const FACES = {
    /* --- 바리 --- */
    hi: ["안녕", eyeArc(26, 20) + eyeArc(38, 20) + mouth(32, 25, 3) + cheeks(23) +
      // 든 손
      `<circle cx="50" cy="27" r="5.5" fill="${SKIN}" ${S}/>` +
      `<path d="M56 20l2.5-2.5M58 26h3.5" stroke="${TIE}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`],

    smile: ["웃음", eyeArc(26, 20) + eyeArc(38, 20) + mouth(32, 25, 4.2) + cheeks(23)],

    good: ["최고", eye(26, 20) + eyeArc(38, 20) + mouth(32, 25, 3) + cheeks(23) +
      // 엄지척
      `<rect x="45" y="28" width="10" height="10" rx="3.4" fill="${SKIN}" ${S}/>` +
      `<rect x="47.5" y="19" width="5" height="10" rx="2.5" fill="${SKIN}" ${S}/>`],

    love: ["하트", heartEye(26, 17) + heartEye(38, 17) + mouth(32, 25, 3) + cheeks(23)],

    cheers: ["건배", eyeArc(26, 20) + eyeArc(38, 20) + mouth(32, 25, 3) + cheeks(23) +
      glass(52, 22)],

    shake: ["셰이킹", eye(26, 20) + eye(38, 20) + mouth(32, 25, 2.6) +
      // 셰이커
      `<rect x="47" y="26" width="11" height="17" rx="3.4" fill="#d9dde3" ${S}/>` +
      `<rect x="48.8" y="21" width="7.4" height="5" rx="2" fill="#d9dde3" ${S}/>` +
      `<path d="M61 24l2-2M62 32h2M61 40l2 2" stroke="${TIE}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`],

    tired: ["지침", eyeDown(26, 20) + eyeDown(38, 20) +
      `<path d="M28 26h8" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` +
      tear(48, 10)],

    cry: ["눈물", eye(26, 19) + eye(38, 19) +
      `<path d="M28 27q4 3.6 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      tear(25, 24) + tear(39, 24)],

    angry: ["화남", eye(26, 21, 2.2, 2.8) + eye(38, 21, 2.2, 2.8) +
      `<path d="M21.5 15.5l6.5 2.5M42.5 15.5l-6.5 2.5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M28 27.5q4-3.4 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`],

    surprise: ["놀람", eye(26, 18, 3.2, 3.8) + eye(38, 18, 3.2, 3.8) + mouthO(32, 26)],

    wink: ["윙크", eye(26, 20) + eyeArc(38, 20) + mouth(32, 25, 3) + cheeks(23)],

    think: ["궁금", eye(27, 19) + eye(39, 19) +
      `<path d="M29 26h6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<g fill="${TIE}" ${S.replace("3", "2.2")}><path d="M48 9a5 5 0 0 1 9 3c0 3-4 3.4-4 6.4h-3c0-4 4-4.2 4-6.4a2 2 0 0 0-3.6-1.2z"/>` +
      `<circle cx="51.5" cy="23" r="2.2"/></g>`],

    fighting: ["파이팅", eyeArc(26, 20) + eyeArc(38, 20) + mouth(32, 25, 3) + cheeks(23) +
      `<rect x="44" y="21" width="11" height="10" rx="3.6" fill="${SKIN}" ${S}/>` +
      `<path d="M49.5 16v-4M44 17l-2.5-3M55 17l2.5-3" stroke="${TIE}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`],

    congrats: ["축하", eyeArc(26, 20) + eyeArc(38, 20) + mouth(32, 25, 4) + cheeks(23) +
      sparkle(50, 8, 4.5) + sparkle(8, 20, 3.5)],

    drunk: ["취함", spiral(26, 20) + spiral(38, 20) +
      `<path d="M27.5 26.5q2.3-2.3 4.5 0t4.5 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      cheeks(23)],

    sleep: ["꿀잠", eyeDown(26, 20.5) + eyeDown(38, 20.5) + mouthO(32, 26, 2.2, 2.8) +
      cheeks(23) + zzz(46, 19)],

    /* --- 술고래 --- */
    gdrunk: ["술고래", spiral(26, 28) + spiral(38, 28) +
      `<path d="M27.5 35q2.3-2.3 4.5 0t4.5 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      cheeks(32, 11) +
      // 물줄기
      `<g fill="${BELLY}" ${S.replace("3", "2.4")}><circle cx="32" cy="4.5" r="3.4"/>` +
      `<circle cx="25" cy="2.5" r="2.2"/><circle cx="39" cy="2.5" r="2.2"/></g>`, GORAE],

    gcheers: ["고래건배", eyeArc(26, 28) + eyeArc(38, 28) + mouth(32, 33, 4) + cheeks(32, 11) +
      glass(52, 26), GORAE],

    ghappy: ["고래웃음", eyeArc(26, 28) + eyeArc(38, 28) + mouth(32, 33, 4.5) + cheeks(32, 11) +
      `<g fill="${BELLY}" ${S.replace("3", "2.4")}><circle cx="32" cy="4.5" r="3.4"/>` +
      `<circle cx="25" cy="2.5" r="2.2"/><circle cx="39" cy="2.5" r="2.2"/></g>`, GORAE],

    glove: ["고래하트", heartEye(26, 25) + heartEye(38, 25) + mouth(32, 33, 3.4) + cheeks(32, 11) +
      `<g fill="#ff8fa8" ${S.replace("3", "2.2")}><path d="M32 9c-4-3-4.5-5.5-2.6-6.6 1.3-.8 2.6.3 2.6 1.2 0-.9 1.3-2 2.6-1.2 1.9 1.1 1.4 3.6-2.6 6.6z"/></g>`, GORAE],

    gsleep: ["고래꿀잠", eyeDown(26, 28.5) + eyeDown(38, 28.5) + mouthO(32, 34, 2.2, 2.8) +
      cheeks(32, 11) + zzz(44, 20), GORAE],

    gcry: ["고래눈물", eye(26, 27) + eye(38, 27) +
      `<path d="M28 35q4 3.6 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      tear(25, 32) + tear(39, 32), GORAE],

    gsurprise: ["고래놀람", eye(26, 26, 3.2, 3.8) + eye(38, 26, 3.2, 3.8) + mouthO(32, 34) +
      sparkle(48, 8, 4), GORAE],

    ggood: ["고래최고", eyeArc(26, 28) + eyeArc(38, 28) + mouth(32, 33, 4) + cheeks(32, 11) +
      `<rect x="46" y="26" width="10" height="10" rx="3.4" fill="${SEA_D}" ${S}/>` +
      `<rect x="48.5" y="17" width="5" height="10" rx="2.5" fill="${SEA_D}" ${S}/>`, GORAE],
  };

  const KEYS = Object.keys(FACES);

  // 스티커 SVG 하나. size 를 주면 그 크기로 고정합니다.
  function svg(key, size) {
    const f = FACES[key];
    if (!f) return "";
    const dim = size ? ` width="${size}" height="${size}"` : "";
    const base = f[2] || BARI;   // 세 번째 값이 있으면 그 몸통 (없으면 바리)
    return `<svg class="bt-char" viewBox="0 0 64 64"${dim} role="img" aria-label="${f[0]}">${base}${f[1]}</svg>`;
  }

  // 이미 esc() 로 이스케이프된 문자열에서 토큰만 스티커로 바꿉니다.
  // 화이트리스트에 있는 key 만 치환하므로 임의 태그가 들어갈 수 없어요.
  function render(escaped) {
    return String(escaped).replace(/:bt_([a-z]+):/g, (m, k) =>
      FACES[k] ? `<span class="bt-sticker">${svg(k)}</span>` : m);
  }

  // 피커 탭용. 키 앞글자로 추측하면 wink 같은 게 고래로 새기 때문에 목록으로 못박습니다.
  const GORAE_KEYS = KEYS.filter((k) => FACES[k][2] === GORAE);
  const GROUPS = [
    { id: "bari", label: "바리", keys: KEYS.filter((k) => FACES[k][2] !== GORAE) },
    { id: "gorae", label: "술고래", keys: GORAE_KEYS },
  ];

  window.BTChar = {
    keys: KEYS,
    groups: GROUPS,
    label: (k) => (FACES[k] ? FACES[k][0] : ""),
    token: (k) => `:bt_${k}:`,
    svg,
    render,
  };
})();
