/* ============ 바텐톡 - 바텐더 익명 커뮤니티 ============ */
(function () {
  "use strict";

  /* ---------- 상수 ---------- */
  const COLORS = [
    "#ff6b5e", "#ff8ad4", "#c9a58f", "#ff9b3d", "#ffcb52",
    "#8fbf8f", "#cbe08a", "#a6e6de", "#6b9fff", "#b8a6f5",
  ];
  const REGIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주"];
  const JOBS = ["전체", "칵테일바", "펍/호프", "와인바", "위스키바", "호텔바", "이자카야"];
  const CAT_LABEL = { free: "자유", promo: "홍보", hot: "인기" };
  const THUMB_COLORS = ["#4a6cf7", "#12b5a5", "#1f2937", "#7c3aed", "#0ea5e9", "#e11d48"];

  /* ---------- 저장소 ---------- */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("bartalk_" + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, val) { localStorage.setItem("bartalk_" + key, JSON.stringify(val)); },
  };

  /* ---------- 시드 데이터 ---------- */
  const now = Date.now();
  const H = 3600e3, M = 60e3, D = 86400e3;

  const SEED_JOBS = [
    { id: 1, shop: "문라이트라운지", days: 30, title: "강남 칵테일바 메인 바텐더 급구 경력 우대", pay: "시급 20,000원", region: "서울", area: "서울 강남구", type: "칵테일바" },
    { id: 2, shop: "바네온", days: 59, title: "★홍대★네온바★주말 바텐더★초보환영★", pay: "시급 15,000원", region: "서울", area: "서울 마포구", type: "펍/호프" },
    { id: 3, shop: "몰트하우스", days: 235, title: "주급보장!! 위스키바 바텐더 모집 숙련자 우대", pay: "시급 17,000원", region: "경기", area: "경기 수원시", type: "위스키바" },
    { id: 4, shop: "비노쉐어", days: 203, title: "와인바 소믈리에 겸 바텐더 정규직 채용", pay: "월급 320만원", region: "서울", area: "서울 강남구", type: "와인바" },
    { id: 5, shop: "수원포차", days: 17, title: "수원역 이자카야 홀 겸 바텐더 야간 모집", pay: "시급 13,000원", region: "경기", area: "경기 수원시", type: "이자카야" },
    { id: 6, shop: "그랜드바", days: 8, title: "호텔 라운지바 바텐더 신입/경력 공개채용", pay: "월급 290만원", region: "인천", area: "인천 중구", type: "호텔바" },
  ];

  const SEED_POSTS = [
    { id: 1, cat: "free", color: 5, nick: "익명", time: now - 9 * M, title: "엥", body: "이런.. 오늘 첫 출근인데 사장님이 안 계심", likes: 0, comments: [{ color: 3, text: "ㅋㅋㅋ 전화해보세요", time: now - 5 * M }], emoji: "🍸" },
    { id: 2, cat: "free", color: 7, nick: "익명", time: now - 11 * M, title: "씻어야하는데", body: "마감하고 왔더니 존나졸려 ㅜㅜㅜㅜ", likes: 0, comments: [{ color: 1, text: "고생하셨어요 ㅠㅠ", time: now - 8 * M }] },
    { id: 3, cat: "free", color: 6, nick: "익명", time: now - 14 * M, title: "명품주얼리", body: "팔찌중 뭐가 잴나요?", likes: 0, comments: [] },
    { id: 4, cat: "free", color: 7, nick: "익명", time: now - 15 * M, title: "하이 환상", body: "홍대 칵테일바 이번주 신메뉴", likes: 0, comments: [{ color: 4, text: "오 어디요?", time: now - 10 * M }, { color: 2, text: "궁금", time: now - 9 * M }, { color: 8, text: "저도 가볼래요", time: now - 7 * M }, { color: 0, text: "위치 좀요", time: now - 4 * M }] },
    { id: 5, cat: "hot", color: 8, nick: "익명", time: now - 4 * H, title: "ㄹㅇ진상손님 11", body: "하 그냥 셰이커 던질뻔했다 ....", likes: 2, comments: Array.from({ length: 19 }, (_, i) => ({ color: i % 10, text: ["고생하셨어요", "무슨 일이에요?", "저도 어제 겪음", "참으세요 ㅠ", "사장님한테 말해요"][i % 5], time: now - (200 - i * 9) * M })), emoji: "💬" },
    { id: 6, cat: "hot", color: 2, nick: "익명", time: now - 5 * H, title: "돈왜버는건지모르겠어요", body: "어차피 집이 못사는것도 아니고 빚이 있는것도 아닌데 차라리 자격증 공부나 할까", likes: 6, comments: Array.from({ length: 12 }, (_, i) => ({ color: (i + 3) % 10, text: ["다들 그런 시기 있어요", "조주기능사 따세요", "화이팅", "저도요.."][i % 4], time: now - (280 - i * 12) * M })) },
    { id: 7, cat: "hot", color: 3, nick: "익명", time: now - 6 * H, title: "내가 닮았다고 들어본 연옌", body: "어떤 이미지일 것 같애 다들", likes: 1, comments: Array.from({ length: 45 }, (_, i) => ({ color: (i + 1) % 10, text: ["궁금하네요", "사진은요?", "ㅋㅋㅋ", "저는 강동원 들어봄"][i % 4], time: now - (350 - i * 6) * M })), emoji: "📸" },
    { id: 8, cat: "hot", color: 5, nick: "익명", time: now - 11 * H - 30 * M, title: "와 대박", body: "역시 연습했더니 플레어 성공함 영상 봐줘", likes: 6, comments: Array.from({ length: 31 }, (_, i) => ({ color: (i + 5) % 10, text: ["멋있어요!!", "오 대박", "몇 년 차세요?", "부럽다"][i % 4], time: now - (500 - i * 10) * M })), emoji: "🎬" },
    { id: 9, cat: "promo", color: 4, nick: "강남루프탑바", time: now - 70 * M, title: "루프탑바 신규오픈☆[매일 시음회ㅜ선착순]", body: "오픈기념 시그니처 칵테일 시음회 진행", likes: 0, comments: [], emoji: "🎉" },
    { id: 10, cat: "promo", color: 0, nick: "조주학원", time: now - 95 * M, title: "[조주기능사]☆실기 단기반☆주말반 모집", body: "합격보장반 소수정예 커리큘럼 상담환영", likes: 0, comments: [], emoji: "🍹" },
    { id: 11, cat: "promo", color: 9, nick: "바용품샵", time: now - 150 * M, title: "@@셰이커/지거 풀세트 공동구매 언니 오빠들@@", body: "바텐더 입문 세트 30% 할인 이벤트", likes: 0, comments: [], emoji: "🛒" },
    { id: 12, cat: "promo", color: 1, nick: "미나언니", time: now - 173 * M, title: "칵테일 클래스 ■원데이 1시간 30■ 수강생 모집", body: "《기초부터》《소수정예》《밀착케어》", likes: 0, comments: [], emoji: "🥂" },
  ];

  /* ---------- 상태 ---------- */
  let state = {
    user: store.get("user", { nick: "버블", color: 2, points: 3478 }),
    posts: store.get("posts", SEED_POSTS),
    dark: store.get("dark", false),
    push: store.get("push", true),
    view: "home",
    commTab: "all",
    writeCat: "free",
    curPost: null,
    filterRegion: "전체",
    filterJob: "전체",
    selColor: null,
    agreeWithdraw: false,
  };
  const saveUser = () => store.set("user", state.user);
  const savePosts = () => store.set("posts", state.posts);

  /* ---------- 유틸 ---------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function fmtTime(t) {
    const d = new Date(t);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = today.getTime() - D;
    const ampm = d.getHours() < 12 ? "오전" : "오후";
    let h = d.getHours() % 12; if (h === 0) h = 12;
    const hm = `${ampm} ${h}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (t >= today.getTime()) return hm;
    if (t >= yesterday) return `어제 ${hm}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  }
  const fmtNum = (n) => n.toLocaleString("ko-KR");

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
  }

  /* ---------- 테마 ---------- */
  function applyTheme() {
    document.documentElement.dataset.theme = state.dark ? "dark" : "light";
    const ic = $("#mode-icon");
    ic.innerHTML = state.dark
      ? '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>';
  }

  /* ---------- 화면 전환 ---------- */
  function show(view) {
    state.view = view;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + view; });
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    if (view === "home") renderJobs();
    if (view === "community") renderPosts();
    if (view === "mypage") renderMyPage();
    if (view === "settings") renderSettings();
  }

  /* ---------- 채용정보 ---------- */
  function renderJobs() {
    const q = $("#job-search").value.trim();
    const list = SEED_JOBS.filter((j) =>
      (state.filterRegion === "전체" || j.region === state.filterRegion) &&
      (state.filterJob === "전체" || j.type === state.filterJob) &&
      (!q || j.title.includes(q) || j.shop.includes(q))
    );
    $("#job-list").innerHTML = list.length
      ? list.map((j, i) => `
        <div class="job-item">
          <div class="job-thumb" style="background:${THUMB_COLORS[j.id % THUMB_COLORS.length]}">${j.shop}</div>
          <div class="job-info">
            <div class="job-meta"><span class="job-badge">🟡</span><span class="job-name">${j.shop}</span><span class="job-days">· ${j.days}일째 광고중</span></div>
            <div class="job-title">${j.title}</div>
            <div class="job-sub"><b>${j.pay}</b> · ${j.area} · ${j.type}</div>
          </div>
        </div>`).join("")
      : '<div class="empty-state">검색 결과가 없어요.</div>';
  }

  /* ---------- 커뮤니티 ---------- */
  function renderPosts() {
    const q = $("#post-search").value.trim();
    let list = [...state.posts];
    if (state.commTab === "hot") list = list.filter((p) => p.cat === "hot" || p.likes + p.comments.length >= 10);
    else if (state.commTab !== "all") list = list.filter((p) => p.cat === state.commTab);
    if (q) list = list.filter((p) => p.title.includes(q) || p.body.includes(q));
    list.sort((a, b) => b.time - a.time);

    const ph = { all: "커뮤니티 전체 검색", hot: "커뮤니티 인기 검색", free: "커뮤니티 자유 검색", promo: "커뮤니티 홍보 검색" };
    $("#post-search").placeholder = ph[state.commTab];

    $("#post-list").innerHTML = list.length
      ? list.map((p) => `
        <div class="post-item" data-id="${p.id}">
          <div class="post-main">
            <div class="post-head"><span class="avatar" style="background:${COLORS[p.color]}"></span><span class="post-time">· ${fmtTime(p.time)}</span></div>
            <div class="post-title">${esc(p.title)}</div>
            <div class="post-preview">${esc(p.body)}</div>
            <div class="post-counts">
              <span class="count ${p.likedByMe ? "liked" : ""}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>${p.likes}</span>
              <span class="count"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg>${p.comments.length}</span>
            </div>
          </div>
          <div class="post-side">
            <span class="cat-tag">${CAT_LABEL[p.cat] || "자유"}</span>
            ${p.emoji ? `<span class="post-thumb">${p.emoji}</span>` : ""}
          </div>
        </div>`).join("")
      : '<div class="empty-state">게시글이 없어요.</div>';

    $$("#post-list .post-item").forEach((el) =>
      el.addEventListener("click", () => openPost(+el.dataset.id))
    );
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- 게시글 상세 ---------- */
  function openPost(id) {
    state.curPost = id;
    renderPostDetail();
    show("post");
  }
  function renderPostDetail() {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    $("#post-detail").innerHTML = `
      <div class="detail-wrap">
        <div class="detail-head">
          <span class="avatar md" style="background:${COLORS[p.color]}"></span>
          <div><div class="detail-nick">${esc(p.nick)}</div><div class="detail-time">${fmtTime(p.time)}</div></div>
          <span class="cat-tag detail-cat">${CAT_LABEL[p.cat] || "자유"}</span>
        </div>
        <div class="detail-title">${esc(p.title)}</div>
        <div class="detail-body">${esc(p.body)}</div>
        <div class="detail-actions">
          <button class="like-btn ${p.likedByMe ? "liked" : ""}" id="detail-like">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>공감 ${p.likes}
          </button>
          <span class="count"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg> 댓글 ${p.comments.length}</span>
        </div>
      </div>
      <div class="comment-sec-title">댓글 ${p.comments.length}</div>
      ${p.comments.map((c) => `
        <div class="comment-item">
          <span class="avatar" style="background:${COLORS[c.color]}"></span>
          <div class="comment-body">
            <div class="comment-head"><span class="comment-nick">익명</span><span class="comment-time">${fmtTime(c.time)}</span></div>
            <div class="comment-text">${esc(c.text)}</div>
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    $("#detail-like").addEventListener("click", () => {
      p.likedByMe = !p.likedByMe;
      p.likes += p.likedByMe ? 1 : -1;
      savePosts();
      renderPostDetail();
    });
  }

  /* ---------- 글쓰기 ---------- */
  function updateSubmit() {
    const ok = $("#write-title").value.trim() && $("#write-body").value.trim();
    const btn = $("#write-submit");
    btn.disabled = !ok;
    btn.classList.toggle("ready", !!ok);
  }
  function submitPost() {
    const title = $("#write-title").value.trim();
    const body = $("#write-body").value.trim();
    if (!title || !body) return;
    const id = Math.max(0, ...state.posts.map((p) => p.id)) + 1;
    state.posts.push({
      id, cat: state.writeCat, color: state.user.color, nick: "익명",
      time: Date.now(), title, body, likes: 0, comments: [],
    });
    savePosts();
    $("#write-title").value = "";
    $("#write-body").value = "";
    updateSubmit();
    state.commTab = state.writeCat;
    $$("#community-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === state.commTab));
    show("community");
    toast("게시글이 등록되었어요.");
  }

  /* ---------- 마이페이지 ---------- */
  function renderMyPage() {
    $("#my-avatar").style.background = COLORS[state.user.color];
    $("#my-nick").textContent = state.user.nick;
    $("#my-points").textContent = fmtNum(state.user.points) + "원";
    $("#toggle-push").classList.toggle("on", state.push);
    $("#toggle-push").setAttribute("aria-checked", state.push);
  }

  /* ---------- 계정설정 ---------- */
  function renderSettings() {
    state.selColor = state.user.color;
    state.agreeWithdraw = false;
    $("#withdraw-agree").classList.remove("on");
    $("#btn-withdraw").disabled = true;
    $("#btn-withdraw").classList.remove("ready");
    $("#pw-current").value = "";
    $("#pw-new").value = "";
    updatePwBtn();
    renderColorGrid();
  }
  function renderColorGrid() {
    $("#color-grid").innerHTML = COLORS.map((c, i) =>
      `<button class="color-dot ${i === state.selColor ? "selected" : ""}" style="background:${c}" data-i="${i}" aria-label="색상 ${i + 1}"></button>`
    ).join("");
    $$("#color-grid .color-dot").forEach((d) =>
      d.addEventListener("click", () => {
        state.selColor = +d.dataset.i;
        renderColorGrid();
        const changed = state.selColor !== state.user.color;
        $("#btn-profile-save").disabled = !changed;
        $("#btn-profile-save").classList.toggle("ready", changed);
      })
    );
  }
  function updatePwBtn() {
    const ok = $("#pw-current").value.length >= 4 && $("#pw-new").value.length >= 4;
    $("#btn-pw-save").disabled = !ok;
    $("#btn-pw-save").classList.toggle("ready", ok);
  }

  /* ---------- 바텀시트 ---------- */
  function openSheet(title, options, selected, onPick) {
    const bd = document.createElement("div");
    bd.className = "sheet-backdrop";
    bd.innerHTML = `<div class="sheet"><h3>${title}</h3>${options.map((o) =>
      `<button class="sheet-opt ${o === selected ? "sel" : ""}">${o}</button>`).join("")}</div>`;
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.remove(); });
    bd.querySelectorAll(".sheet-opt").forEach((b) =>
      b.addEventListener("click", () => { onPick(b.textContent); bd.remove(); })
    );
    $("#app").appendChild(bd);
  }

  /* ---------- 이벤트 바인딩 ---------- */
  // 하단 네비
  $$(".nav-btn").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));

  // 커뮤니티 탭
  $$("#community-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => {
      state.commTab = t.dataset.tab;
      $$("#community-tabs .tab").forEach((x) => x.classList.toggle("active", x === t));
      renderPosts();
    })
  );

  // 알림 탭
  $$("[data-atab]").forEach((t) =>
    t.addEventListener("click", () => {
      $$("[data-atab]").forEach((x) => x.classList.toggle("active", x === t));
      $("#alerts-noti").hidden = t.dataset.atab !== "noti";
      $("#alerts-chat").hidden = t.dataset.atab !== "chat";
    })
  );

  // 검색
  $("#job-search").addEventListener("input", renderJobs);
  $("#post-search").addEventListener("input", renderPosts);

  // 필터
  $("#filter-region").addEventListener("click", () =>
    openSheet("지역 선택", REGIONS, state.filterRegion, (v) => {
      state.filterRegion = v;
      $("#filter-region-value").textContent = v;
      renderJobs();
    })
  );
  $("#filter-job").addEventListener("click", () =>
    openSheet("직종 선택", JOBS, state.filterJob, (v) => {
      state.filterJob = v;
      $("#filter-job-value").textContent = v;
      renderJobs();
    })
  );

  // 배너
  $("#live-talk-banner").addEventListener("click", () => { state.commTab = "all"; show("community"); });
  $("#rules-banner").addEventListener("click", () => toast("광고, 비난, 도배성 글은 제한될 수 있어요."));

  // 글쓰기
  $$(".cat-chip").forEach((c) =>
    c.addEventListener("click", () => {
      state.writeCat = c.dataset.cat;
      $$(".cat-chip").forEach((x) => x.classList.toggle("active", x === c));
    })
  );
  $("#write-title").addEventListener("input", updateSubmit);
  $("#write-body").addEventListener("input", updateSubmit);
  $("#write-submit").addEventListener("click", submitPost);
  $("#write-back").addEventListener("click", () => show("community"));
  $("#write-img").addEventListener("click", () => toast("데모 버전에서는 사진 첨부를 지원하지 않아요."));

  // 게시글 상세
  $("#post-back").addEventListener("click", () => show("community"));
  $("#comment-send").addEventListener("click", addComment);
  $("#comment-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addComment(); });
  function addComment() {
    const text = $("#comment-input").value.trim();
    if (!text) return;
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    p.comments.push({ color: state.user.color, text, time: Date.now() });
    savePosts();
    $("#comment-input").value = "";
    renderPostDetail();
  }

  // 마이페이지
  $("#btn-settings").addEventListener("click", () => show("settings"));
  $("#btn-logout").addEventListener("click", () => toast("데모 버전에서는 로그아웃이 비활성화되어 있어요."));
  $("#btn-points").addEventListener("click", () => toast(`보유 포인트 ${fmtNum(state.user.points)}원`));
  $("#btn-darkmode").addEventListener("click", () => {
    state.dark = !state.dark;
    store.set("dark", state.dark);
    applyTheme();
  });
  $("#toggle-push").addEventListener("click", () => {
    state.push = !state.push;
    store.set("push", state.push);
    renderMyPage();
    toast(state.push ? "푸시알림을 켰어요." : "푸시알림을 껐어요.");
  });

  // 계정설정
  $("#settings-back").addEventListener("click", () => show("mypage"));
  $("#btn-profile-save").addEventListener("click", () => {
    state.user.color = state.selColor;
    saveUser();
    $("#btn-profile-save").disabled = true;
    $("#btn-profile-save").classList.remove("ready");
    toast("프로필이 변경되었어요.");
  });
  $("#pw-current").addEventListener("input", updatePwBtn);
  $("#pw-new").addEventListener("input", updatePwBtn);
  $("#btn-pw-save").addEventListener("click", () => {
    $("#pw-current").value = "";
    $("#pw-new").value = "";
    updatePwBtn();
    toast("비밀번호가 변경되었어요. (데모)");
  });
  $("#withdraw-agree").addEventListener("click", () => {
    state.agreeWithdraw = !state.agreeWithdraw;
    $("#withdraw-agree").classList.toggle("on", state.agreeWithdraw);
    $("#btn-withdraw").disabled = !state.agreeWithdraw;
    $("#btn-withdraw").classList.toggle("ready", state.agreeWithdraw);
  });
  $("#btn-withdraw").addEventListener("click", () => {
    if (!state.agreeWithdraw) return;
    if (!confirm("정말 탈퇴하시겠어요? 모든 데이터가 초기화돼요.")) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bartalk_"))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  });

  /* ---------- 초기화 ---------- */
  applyTheme();
  show("home");
})();
