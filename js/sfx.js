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

  /* ---------- 소리 목록 ----------
     자주 나는 소리(탭·화면 이동)는 아주 작고 짧게 두고,
     드물게 나는 소리(등록·삭제·공감)는 또렷하게 둡니다.
     같은 크기로 만들면 앱을 쓰는 내내 울려서 금방 피곤해져요. */
  var SOUNDS = {
    // 탭 바꾸기·칩 고르기 — 손끝에 닿는 느낌만
    tap:      function () { tone({ from: 1150, dur: 0.03, vol: 0.2 }); },
    // 안으로 들어가기 (글·모임·도감 열기)
    open:     function () { tone({ from: 520, to: 800, dur: 0.08, vol: 0.28 }); },
    // 뒤로 나오기
    back:     function () { tone({ from: 760, to: 480, dur: 0.08, vol: 0.24 }); },
    // 시트 올라옴
    sheet:    function () { tone({ from: 420, to: 660, dur: 0.1, vol: 0.24 }); },
    // 공감 누름 — 기분 좋게 톡
    like:     function () { tone({ from: 880, dur: 0.05, vol: 0.4, type: "triangle" });
                            tone({ from: 1320, dur: 0.09, vol: 0.34, delay: 0.045, type: "triangle" }); },
    // 공감 취소 — 되돌아가는 느낌으로 낮게
    unlike:   function () { tone({ from: 700, to: 460, dur: 0.08, vol: 0.26 }); },
    // 삭제 — 아래로 떨어지는 소리. 되돌릴 수 없는 일이라 확실히 들리게
    remove:   function () { tone({ from: 440, to: 190, dur: 0.15, vol: 0.36, type: "triangle" }); },
    // 스위치 켜고 끄기
    toggle:   function () { tone({ from: 620, to: 920, dur: 0.06, vol: 0.3, type: "triangle" }); },
    // 포인트 적립
    coin:     function () { tone({ from: 1180, dur: 0.05, vol: 0.38, type: "triangle" });
                            tone({ from: 1570, dur: 0.11, vol: 0.34, delay: 0.05, type: "triangle" }); },
    // 메시지·댓글 보냄 — 올라갔는지 눈으로 확인하기 전에 알려줘요
    send:     function () { tone({ from: 700, to: 1050, dur: 0.09, vol: 0.6 }); },
    // 채팅 도착 — 다른 화면을 보고 있을 수 있습니다
    receive:  function () { tone({ from: 900, to: 640, dur: 0.11, vol: 0.55 }); },
    // 글·모임·도감·리뷰 등록 완료 — 잔 부딪히는 느낌의 3음
    success:  function () { tone({ from: 660, dur: 0.1, vol: 0.5, type: "triangle" });
                            tone({ from: 880, dur: 0.1, vol: 0.5, delay: 0.09, type: "triangle" });
                            tone({ from: 1170, dur: 0.16, vol: 0.45, delay: 0.18, type: "triangle" }); },
    // 실패·차단 — 안내 문구를 놓쳐도 뭔가 잘못됐다는 건 전해집니다
    error:    function () { tone({ from: 300, to: 190, dur: 0.18, vol: 0.5, type: "sawtooth" }); },
    // 알림 도착
    notify:   function () { tone({ from: 1050, dur: 0.08, vol: 0.5 });
                            tone({ from: 1400, dur: 0.12, vol: 0.45, delay: 0.09 }); },
  };

  // 같은 소리가 연달아 울리면 시끄러우니 최소 간격을 둡니다.
  var MIN_GAP = { receive: 200, notify: 400, tap: 60, open: 80, back: 80 };

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
      if (enabled) { unlock(); play("send"); }   // 켤 때 한 번 들려줘요
    },
    names: Object.keys(SOUNDS),
  };
})();
