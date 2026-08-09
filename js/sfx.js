/* ============================================================
 *  바텐톡 효과음
 *
 *  오디오 파일을 쓰지 않고 브라우저에서 소리를 직접 만들어요.
 *   · 내려받을 파일이 0KB — 앱이 무거워지지 않습니다
 *   · 오프라인에서도 그대로 납니다
 *   · 바(bar) 분위기에 맞춰 짧고 부드러운 톤으로 맞췄습니다
 *
 *  규칙
 *   · 첫 사용자 입력이 있기 전에는 소리를 만들지 않습니다 (브라우저 정책)
 *   · 너무 잦은 소리는 귀에 거슬리므로 같은 소리는 최소 간격을 둡니다
 *   · 설정에서 끄면 완전히 침묵합니다
 * ============================================================ */
(function () {
  "use strict";

  var KEY = "bartalk_sfx";
  var ctx = null;
  var master = null;
  var enabled = true;
  var lastAt = {};

  try {
    var saved = localStorage.getItem(KEY);
    if (saved !== null) enabled = JSON.parse(saved);
  } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;          // 전체 음량 (은은하게)
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  // 브라우저는 사용자가 화면을 건드리기 전엔 소리를 막아요.
  function unlock() {
    var c = ensure();
    if (c && c.state === "suspended") c.resume().catch(function () {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { once: false, passive: true });
  });

  /* 짧은 음 하나 */
  function tone(opt) {
    var c = ensure();
    if (!c || c.state === "suspended") return;
    var t0 = c.currentTime + (opt.delay || 0);
    var dur = opt.dur || 0.09;

    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opt.type || "sine";
    osc.frequency.setValueAtTime(opt.from, t0);
    if (opt.to && opt.to !== opt.from) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opt.to), t0 + dur);
    }

    var vol = (opt.vol == null ? 1 : opt.vol);
    // 딸깍거리지 않도록 아주 짧게 올렸다가 부드럽게 내려요
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* 짧은 잡음 — 얼음·셰이커 느낌 */
  function noise(opt) {
    var c = ensure();
    if (!c || c.state === "suspended") return;
    var dur = opt.dur || 0.12;
    var t0 = c.currentTime + (opt.delay || 0);
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);   // 뒤로 갈수록 잦아듦
    }
    var src = c.createBufferSource();
    src.buffer = buf;
    var bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = opt.freq || 3000;
    bp.Q.value = 0.8;
    var gain = c.createGain();
    gain.gain.value = opt.vol == null ? 0.5 : opt.vol;
    src.connect(bp).connect(gain).connect(master);
    src.start(t0);
  }

  /* ---------- 소리 목록 ---------- */
  var SOUNDS = {
    // 가벼운 탭 — 버튼, 칩, 탭 전환
    tap:      function () { tone({ from: 620, to: 520, dur: 0.05, vol: 0.5, type: "sine" }); },
    // 화면 이동
    nav:      function () { tone({ from: 480, to: 720, dur: 0.08, vol: 0.45 }); },
    // 뒤로
    back:     function () { tone({ from: 700, to: 460, dur: 0.08, vol: 0.4 }); },
    // 시트·창 열기
    open:     function () { tone({ from: 400, to: 660, dur: 0.1, vol: 0.4, type: "triangle" }); },
    close:    function () { tone({ from: 620, to: 380, dur: 0.09, vol: 0.35, type: "triangle" }); },
    // 메시지 보내기
    send:     function () { tone({ from: 700, to: 1050, dur: 0.09, vol: 0.6 }); },
    // 메시지 받기
    receive:  function () { tone({ from: 900, to: 640, dur: 0.11, vol: 0.55 }); },
    // 공감 — 살짝 통통 튀게
    like:     function () { tone({ from: 760, to: 1140, dur: 0.07, vol: 0.6 });
                            tone({ from: 1140, to: 1500, dur: 0.07, vol: 0.4, delay: 0.06 }); },
    unlike:   function () { tone({ from: 700, to: 420, dur: 0.08, vol: 0.35 }); },
    // 글·모임·도감 등록 성공 — 잔 부딪히는 느낌의 3음
    success:  function () { tone({ from: 660, dur: 0.1, vol: 0.5, type: "triangle" });
                            tone({ from: 880, dur: 0.1, vol: 0.5, delay: 0.09, type: "triangle" });
                            tone({ from: 1170, dur: 0.16, vol: 0.45, delay: 0.18, type: "triangle" }); },
    // 실패·차단
    error:    function () { tone({ from: 300, to: 190, dur: 0.18, vol: 0.5, type: "sawtooth" }); },
    // 알림
    notify:   function () { tone({ from: 1050, dur: 0.08, vol: 0.5 });
                            tone({ from: 1400, dur: 0.12, vol: 0.45, delay: 0.09 }); },
    // 포인트 획득
    coin:     function () { tone({ from: 1200, dur: 0.06, vol: 0.5, type: "square" });
                            tone({ from: 1800, dur: 0.12, vol: 0.35, delay: 0.05, type: "square" }); },
    // 삭제
    trash:    function () { noise({ freq: 1800, dur: 0.16, vol: 0.4 });
                            tone({ from: 380, to: 200, dur: 0.14, vol: 0.35, type: "triangle" }); },
    // 셰이커 흔들기 — 타이머 시작
    shake:    function () { noise({ freq: 4200, dur: 0.22, vol: 0.45 }); },
    // 타이머 종료 — 종소리
    ding:     function () { tone({ from: 1560, dur: 0.5, vol: 0.55, type: "sine" });
                            tone({ from: 2340, dur: 0.35, vol: 0.2, type: "sine" }); },
    // 퀴즈 정답 / 오답
    correct:  function () { tone({ from: 880, dur: 0.09, vol: 0.5 });
                            tone({ from: 1320, dur: 0.16, vol: 0.45, delay: 0.08 }); },
    wrong:    function () { tone({ from: 400, to: 300, dur: 0.16, vol: 0.45, type: "square" }); },
    // 로그인 완료
    welcome:  function () { tone({ from: 520, dur: 0.12, vol: 0.45, type: "triangle" });
                            tone({ from: 780, dur: 0.12, vol: 0.45, delay: 0.11, type: "triangle" });
                            tone({ from: 1040, dur: 0.28, vol: 0.4, delay: 0.22, type: "triangle" }); },
  };

  // 같은 소리가 연달아 울리면 시끄러우니 최소 간격을 둡니다.
  var MIN_GAP = { tap: 45, nav: 80, like: 90, receive: 200, notify: 400 };

  function play(name) {
    if (!enabled) return;
    var fn = SOUNDS[name];
    if (!fn) return;
    var gap = MIN_GAP[name] || 30;
    var now = Date.now();
    if (lastAt[name] && now - lastAt[name] < gap) return;
    lastAt[name] = now;
    try { fn(); } catch (e) {}
  }

  window.BTSfx = {
    play: play,
    get enabled() { return enabled; },
    set enabled(v) {
      enabled = !!v;
      try { localStorage.setItem(KEY, JSON.stringify(enabled)); } catch (e) {}
      if (enabled) { unlock(); play("tap"); }   // 켤 때 한 번 들려줘요
    },
    names: Object.keys(SOUNDS),
  };
})();
