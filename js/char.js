/* 바텐톡 마스코트 — 댓글용 스티커
 *
 * 캐릭터 둘
 *  · 바리   : 나비넥타이를 맨 바텐더. 머리를 몸보다 크게 잡은 2등신이라 작아도 귀엽게 읽혀요.
 *  · 술고래 : 말 그대로 '술고래'. 늘 알딸딸한 표정에 볼이 발갛습니다.
 *
 * 왜 인라인 SVG인가
 *  - 이미지 파일이면 오프라인에서 깨지고 요청도 늘어납니다. 이 앱은 PWA라 그게 치명적이에요.
 *  - 댓글 안에서 26px 정도로 아주 작게 들어가는데, SVG는 그 크기에서도 뭉개지지 않습니다.
 *  - 다크 모드용 이미지를 따로 준비할 필요가 없어요.
 *
 * 저장 방식
 *  댓글 본문에는 `:bt_smile:` 같은 토큰만 저장합니다.
 *  - 서버 동기화·localStorage 모두 그냥 문자열이라 추가 처리가 필요 없고,
 *  - 이 스크립트가 없어도 글이 깨지지 않고 토큰이 그대로 보일 뿐입니다.
 *  렌더링은 esc() 로 이스케이프한 뒤에 하므로 사용자가 태그를 쳐도 주입되지 않아요.
 *  (치환하는 SVG 는 아래 화이트리스트에서만 나옵니다)
 */
(function () {
  "use strict";

  const SKIN = "#ffd8bd";
  const HAIR = "#6b4535";
  const VEST = "#ff5c35";
  const LINE = "#5b3a2c";   // 눈·입 (머리색보다 살짝 진하게)
  const BLUSH = "#ff9a8a";

  // 몸 → 머리 순서로 겹칩니다. 머리가 커서 어깨 위를 덮어요.
  const BASE =
    // 어깨(조끼)
    `<path d="M17 62v-7a15 15 0 0 1 30 0v7z" fill="${VEST}"/>` +
    // 셔츠 깃
    `<path d="M27 47h10l-5 6z" fill="#fff"/>` +
    // 나비넥타이
    `<path d="M32 49.5l-5-3v6zM32 49.5l5-3v6z" fill="${LINE}"/>` +
    `<circle cx="32" cy="49.5" r="1.7" fill="${LINE}"/>` +
    // 귀
    `<circle cx="15.5" cy="30" r="3.2" fill="${SKIN}"/>` +
    `<circle cx="48.5" cy="30" r="3.2" fill="${SKIN}"/>` +
    // 얼굴
    `<circle cx="32" cy="27.5" r="16.5" fill="${SKIN}"/>` +
    // 머리카락 (윗부분을 덮는 반원)
    `<path d="M15.6 26.5a16.4 16.4 0 0 1 32.8 0z" fill="${HAIR}"/>`;

  const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 2.5}" fill="${LINE}"/>`;
  const eyes = (y, r) => eye(25.5, y || 31, r) + eye(38.5, y || 31, r);
  // ^ ^ 웃는 눈
  const eyesHappy = (y) =>
    `<path d="M22.5 ${y || 32}q3-3.6 6 0M35.5 ${y || 32}q3-3.6 6 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  // 아래로 처진 눈
  const eyesDown = (y) =>
    `<path d="M22.5 ${y || 30}q3 3.2 6 0M35.5 ${y || 30}q3 3.2 6 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const smile = (w, y) =>
    `<path d="M${32 - (w || 4)} ${y || 37}q${w || 4} ${(w || 4) * 1.1} ${(w || 4) * 2} 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const blush = () =>
    `<ellipse cx="21.5" cy="35.5" rx="3" ry="1.9" fill="${BLUSH}" opacity=".75"/>` +
    `<ellipse cx="42.5" cy="35.5" rx="3" ry="1.9" fill="${BLUSH}" opacity=".75"/>`;
  // 손 (조끼 옆에서 쏙)
  const hand = (x, y) => `<circle cx="${x}" cy="${y}" r="4.4" fill="${SKIN}"/>`;

  /* 스티커 — key: [라벨, 얼굴/소품] */
  const FACES = {
    hi: ["안녕", eyesHappy() + smile(4) + blush() +
      hand(50, 44) +
      `<g stroke="${VEST}" stroke-width="2" stroke-linecap="round" fill="none"><path d="M55 38l2.5-2M57 44h3"/></g>`],

    smile: ["웃음", eyesHappy() + smile(5.5) + blush()],

    good: ["최고", eye(25.5, 31) +
      `<path d="M35.5 31.5q3-3.4 6 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
      smile(4) + blush() +
      // 엄지척
      `<g fill="${SKIN}"><rect x="46" y="42" width="9" height="10" rx="2.6"/>` +
      `<rect x="48.3" y="34.5" width="4.4" height="9.5" rx="2.2"/></g>`],

    love: ["하트", // 하트 눈
      `<path d="M25.5 33c-3.8-2.9-4.3-5.2-2.5-6.2 1.2-.7 2.5.3 2.5 1.1 0-.8 1.3-1.8 2.5-1.1 1.8 1 1.3 3.3-2.5 6.2z" fill="#ff4d6d"/>` +
      `<path d="M38.5 33c-3.8-2.9-4.3-5.2-2.5-6.2 1.2-.7 2.5.3 2.5 1.1 0-.8 1.3-1.8 2.5-1.1 1.8 1 1.3 3.3-2.5 6.2z" fill="#ff4d6d"/>` +
      smile(4) + blush()],

    cheers: ["건배", eyesHappy() + smile(4) + blush() +
      // 들어올린 잔
      `<g stroke="${LINE}" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M46 30h11l-5.5 7z"/><path d="M51.5 37v6"/><path d="M48 43h7"/></g>` +
      hand(51.5, 46)],

    shake: ["셰이킹", eyes(31) + smile(3.5) +
      // 셰이커 + 흔들림
      `<rect x="46" y="32" width="10" height="16" rx="3" fill="${LINE}"/>` +
      `<rect x="47.5" y="28" width="7" height="4" rx="1.4" fill="${LINE}"/>` +
      `<g stroke="${VEST}" stroke-width="2" stroke-linecap="round"><path d="M60 30l2-2M61 38h3M60 46l2 2"/></g>`],

    tired: ["지침", eyesDown() +
      `<path d="M28 38h8" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>` +
      // 땀
      `<path d="M47 20c2 3 3 4.4 3 5.9a3 3 0 0 1-6 0c0-1.5 1-2.9 3-5.9z" fill="#7cc4f5"/>`],

    cry: ["눈물", eyes(30, 2.8) +
      `<path d="M28 38q4 3.4 8 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
      `<path d="M25.5 34c1.5 2.5 2.3 3.7 2.3 4.8a2.3 2.3 0 0 1-4.6 0c0-1.1.8-2.3 2.3-4.8z" fill="#7cc4f5"/>` +
      `<path d="M38.5 34c1.5 2.5 2.3 3.7 2.3 4.8a2.3 2.3 0 0 1-4.6 0c0-1.1.8-2.3 2.3-4.8z" fill="#7cc4f5"/>`],

    angry: ["화남", eye(25.5, 32, 2.4) + eye(38.5, 32, 2.4) +
      `<path d="M21.5 27.5l6 2M42.5 27.5l-6 2" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M28 39.5q4-3 8 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`],

    surprise: ["놀람", eye(25.5, 30, 3.4) + eye(38.5, 30, 3.4) +
      `<ellipse cx="32" cy="39" rx="2.8" ry="3.4" fill="${LINE}"/>`],

    wink: ["윙크", eye(25.5, 31) +
      `<path d="M35.5 31.5q3-3.4 6 0" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
      smile(4) + blush()],

    think: ["궁금", eye(26.5, 30) + eye(39.5, 30) +
      `<path d="M29 38h6" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>` +
      // 물음표
      `<g fill="${VEST}"><path d="M48 14a5 5 0 0 1 9 3c0 3-4 3.4-4 6.4h-3c0-4 4-4.2 4-6.4a2 2 0 0 0-3.6-1.2z"/>` +
      `<circle cx="51.5" cy="28" r="2"/></g>`],

    fighting: ["파이팅", eyesHappy() + smile(4) + blush() +
      // 불끈 주먹
      `<rect x="45" y="34" width="10" height="9" rx="3.4" fill="${SKIN}"/>` +
      `<g stroke="${VEST}" stroke-width="2" stroke-linecap="round"><path d="M50 29v-4M45 30l-2-3M55 30l2-3"/></g>`],

    congrats: ["축하", eyesHappy() + smile(5) + blush() +
      `<g fill="#ffc93c"><path d="M51 12l1.7 4.5L57 18l-4.3 1.5L51 24l-1.7-4.5L45 18l4.3-1.5z"/>` +
      `<path d="M11 24l1.1 2.9 2.9 1.1-2.9 1.1L11 33l-1.1-2.9L7 29l2.9-1.1z"/></g>`],

    drunk: ["취함", // 뱅뱅 도는 눈
      `<g stroke="${LINE}" stroke-width="1.9" fill="none" stroke-linecap="round">` +
      `<path d="M25.5 28.6a2.9 2.9 0 1 1-2.5 4.3 4.2 4.2 0 1 0 5.7-5.3"/>` +
      `<path d="M38.5 28.6a2.9 2.9 0 1 1-2.5 4.3 4.2 4.2 0 1 0 5.7-5.3"/></g>` +
      `<path d="M27.5 38.5q2.3-2.3 4.5 0t4.5 0" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      blush()],

    sleep: ["꿀잠", eyesDown(31) +
      `<ellipse cx="32" cy="38.5" rx="2.3" ry="2.8" fill="${LINE}"/>` +
      `<g fill="${VEST}" font-family="system-ui,sans-serif" font-weight="800">` +
      `<text x="46" y="22" font-size="13">Z</text><text x="54" y="14" font-size="9">z</text></g>`],
  };

  /* ===================== 술고래 ===================== */

  const SEA = "#5aa9e6";
  const SEA_D = "#3f8bc6";
  const BELLY = "#d6ecff";
  const SEA_LINE = "#28506e";

  // 왼쪽을 보고 있는 통통한 고래. 몸 → 배 → 지느러미 → 꼬리 순.
  const WHALE =
    // 꼬리
    `<path d="M46 32c6-6 11-7 13-4.6s-1.6 5.4-3.4 8c1.8 2.6 5 5.6 3.4 8S52 44 46 38z" fill="${SEA_D}"/>` +
    // 몸통
    `<ellipse cx="28" cy="35" rx="21" ry="15.5" fill="${SEA}"/>` +
    // 밝은 배
    `<ellipse cx="26" cy="41.5" rx="15" ry="8" fill="${BELLY}"/>` +
    // 옆 지느러미
    `<path d="M24 45c1.6 5 5.4 7.4 8.6 6.4-2-2.8-3-5.6-3-8z" fill="${SEA_D}"/>`;

  // 고래는 옆모습이라 눈이 하나입니다.
  const wEye = (r) => `<circle cx="17.5" cy="31" r="${r || 2.6}" fill="${SEA_LINE}"/>`;
  const wEyeHappy = () =>
    `<path d="M14.5 31.5q3-3.4 6 0" stroke="${SEA_LINE}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
  const wBlush = () => `<ellipse cx="12.5" cy="36.5" rx="3.4" ry="2.2" fill="#ff8f7a" opacity=".85"/>`;
  const wSmile = () =>
    `<path d="M8.5 38.5q4.5 3.6 9 1.4" stroke="${SEA_LINE}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
  // 물 뿜기 (기본은 물방울, 취했을 땐 하트나 별로 바꿔서 씀)
  const spout = (fill) =>
    `<g fill="${fill || "#9fd4ff"}"><circle cx="26" cy="13" r="3"/><circle cx="31" cy="8" r="2.2"/><circle cx="22" cy="7.5" r="1.8"/></g>`;

  const WHALE_FACES = {
    gdrunk: ["술고래", // 알딸딸 — 이 캐릭터의 기본 표정
      `<g stroke="${SEA_LINE}" stroke-width="1.9" fill="none" stroke-linecap="round">` +
      `<path d="M17.5 28.6a2.9 2.9 0 1 1-2.5 4.3 4.2 4.2 0 1 0 5.7-5.3"/></g>` +
      `<path d="M8.5 39q2.2-2.2 4.4 0t4.4 0" stroke="${SEA_LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      wBlush() + spout()],

    gcheers: ["고래건배", wEyeHappy() + wSmile() + wBlush() +
      // 지느러미로 든 잔
      `<g stroke="${SEA_LINE}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M33 50h10l-5 6.5z"/><path d="M38 56.5v4"/></g>`],

    ghappy: ["고래웃음", wEyeHappy() + wSmile() + wBlush() + spout()],

    glove: ["고래하트",
      `<path d="M17.5 33c-3.6-2.8-4-5-2.4-5.9 1.1-.7 2.4.3 2.4 1 0-.7 1.3-1.7 2.4-1 1.6.9 1.2 3.1-2.4 5.9z" fill="#ff4d6d"/>` +
      wSmile() + wBlush() +
      `<g fill="#ff8fa8"><path d="M26 15c-3.4-2.7-3.8-4.8-2.2-5.6 1-.6 2.2.2 2.2.9 0-.7 1.2-1.5 2.2-.9 1.6.8 1.2 2.9-2.2 5.6z"/></g>`],

    gsleep: ["고래꿀잠",
      `<path d="M14.5 30.5q3 3.2 6 0" stroke="${SEA_LINE}" stroke-width="2.1" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="12" cy="38.5" rx="2.2" ry="2.6" fill="${SEA_LINE}"/>` + wBlush() +
      `<g fill="${SEA}" font-family="system-ui,sans-serif" font-weight="800">` +
      `<text x="27" y="15" font-size="13">Z</text><text x="36" y="8" font-size="9">z</text></g>`],

    gcry: ["고래눈물", wEye(2.8) +
      `<path d="M8.5 40q4.5-3.4 9-1.2" stroke="${SEA_LINE}" stroke-width="2.1" fill="none" stroke-linecap="round"/>` +
      `<path d="M17.5 34.5c1.5 2.5 2.3 3.7 2.3 4.8a2.3 2.3 0 0 1-4.6 0c0-1.1.8-2.3 2.3-4.8z" fill="#7cc4f5"/>` +
      spout()],

    gsurprise: ["고래놀람", wEye(3.5) +
      `<ellipse cx="12.5" cy="39" rx="2.6" ry="3.2" fill="${SEA_LINE}"/>` +
      `<g fill="#ffc93c"><path d="M30 12l1.4 3.6L35 17l-3.6 1.4L30 22l-1.4-3.6L25 17l3.6-1.4z"/></g>`],

    ggood: ["고래최고", wEyeHappy() + wSmile() + wBlush() +
      // 지느러미 엄지척
      `<g fill="${SEA_D}"><rect x="30" y="47" width="9" height="9.5" rx="2.6"/>` +
      `<rect x="32.2" y="40" width="4.4" height="9" rx="2.2"/></g>`],
  };

  // 사람 스티커는 사람 몸, 고래 스티커는 고래 몸을 씁니다.
  Object.keys(WHALE_FACES).forEach((k) => {
    FACES[k] = WHALE_FACES[k].concat([WHALE]);
  });

  const KEYS = Object.keys(FACES);

  // 스티커 SVG 하나. size 를 주면 그 크기로 고정합니다.
  function svg(key, size) {
    const f = FACES[key];
    if (!f) return "";
    const dim = size ? ` width="${size}" height="${size}"` : "";
    const base = f[2] || BASE; // 세 번째 값이 있으면 그 몸통을 씁니다 (없으면 바리)
    return `<svg class="bt-char" viewBox="0 0 64 64"${dim} role="img" aria-label="${f[0]}">${base}${f[1]}</svg>`;
  }

  // 이미 esc() 로 이스케이프된 문자열에서 토큰만 스티커로 바꿉니다.
  // 화이트리스트에 있는 key 만 치환하므로 임의 태그가 들어갈 수 없어요.
  function render(escaped) {
    return String(escaped).replace(/:bt_([a-z]+):/g, (m, k) =>
      FACES[k] ? `<span class="bt-sticker">${svg(k)}</span>` : m);
  }

  // 피커에서 탭으로 나눠 보여주려고 그룹을 명시해 둡니다.
  // (키 앞글자로 추측하면 wink 같은 게 고래로 새기 때문에 목록으로 못박아요)
  const GROUPS = [
    { id: "bari", label: "바리", keys: Object.keys(FACES).filter((k) => !WHALE_FACES[k]) },
    { id: "gorae", label: "술고래", keys: Object.keys(WHALE_FACES) },
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
