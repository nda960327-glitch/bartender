/* ============ 바텐톡 - 바텐더 익명 커뮤니티 ============ */
(function () {
  "use strict";

  /* ---------- 상수 ---------- */
  /* ---------- 앱 메타 (js/legal.js 가 단일 원본) ---------- */
  const LEGAL_META = (window.BARTALK_LEGAL && window.BARTALK_LEGAL.meta) || {};
  const APP_VER = LEGAL_META.version || "1.0.0";
  const SUPPORT_EMAIL = LEGAL_META.email || "3663hong@gmail.com";
  // 출시 시 기능 on/off. 스토어는 실제 판매/배송·PG 연동 전까지 "사전 오픈" 안내로 동작해요.
  // 결제 인프라 없이 실제 주문을 받으면 Play 심사에서 반려될 수 있으니, 정식 오픈 전엔 STORE_LIVE = false 를 유지하세요.
  const FEATURES = { STORE_LIVE: false };

  const COLORS = [
    "#ff6b5e", "#ff8ad4", "#c9a58f", "#ff9b3d", "#ffcb52",
    "#8fbf8f", "#cbe08a", "#a6e6de", "#6b9fff", "#b8a6f5",
  ];
  const REGIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주"];
  const JOB_TYPES = ["전체", "칵테일바", "펍/호프", "와인바", "위스키바", "호텔바", "이자카야"];
  const SPIRIT_CATS = ["위스키", "진", "럼", "보드카", "데킬라", "리큐르", "와인", "전통주", "브랜디", "기타"];
  const COCKTAIL_BASES = ["진", "럼", "위스키", "보드카", "데킬라", "리큐르", "논알콜", "기타"];
  const EMOJIS = ["🥃", "🍸", "🍹", "🍷", "🍾", "🍺", "🍶", "🧉", "🥂", "🍋"];
  const CAT_LABEL = { free: "자유", promo: "홍보", hot: "인기" };
  const THUMB_COLORS = ["#4a6cf7", "#12b5a5", "#1f2937", "#7c3aed", "#0ea5e9", "#e11d48"];
  const STORE_CATS = ["전체", "기물", "글라스", "재료/시럽", "서적", "굿즈", "소모품"];
  const PRODUCTS = [
    { id: 1, cat: "기물", emoji: "🍸", name: "보스턴 셰이커 세트 (틴+틴)", price: 29000, tag: "베스트", desc: "영업용 표준 보스턴 셰이커. 무게 밸런스가 좋아 장시간 셰이킹에도 손목 부담이 적어요.\n\n- 스테인리스 304\n- 대틴 800ml + 소틴 500ml" },
    { id: 2, cat: "기물", emoji: "🍸", name: "코블러 셰이커 500ml", price: 24000, desc: "스트레이너 일체형 3피스 셰이커. 홈텐딩과 연습용으로 가장 무난한 선택." },
    { id: 3, cat: "기물", emoji: "🥃", name: "더블 지거 30/45ml", price: 9000, tag: "베스트", desc: "국제 표준 30/45ml 더블 지거. 내부 15ml 눈금 포함." },
    { id: 4, cat: "기물", emoji: "🥄", name: "바 스푼 30cm (트위스트)", price: 8000, desc: "트위스트 손잡이 바 스푼. 스터·레이어링·머들 백까지 하나로." },
    { id: 5, cat: "기물", emoji: "🍸", name: "호손 스트레이너", price: 9500, desc: "스프링 장력이 탄탄한 호손 스트레이너. 보스턴 셰이커와 짝꿍." },
    { id: 6, cat: "기물", emoji: "🥃", name: "야라이 믹싱글라스 500ml", price: 32000, desc: "야라이 컷 패턴 믹싱글라스. 스터 칵테일의 품격이 올라갑니다." },
    { id: 7, cat: "기물", emoji: "🪵", name: "우드 머들러", price: 7000, desc: "모히토·캐리피리냐 필수품. 끝이 둥글어 허브를 부드럽게 눌러줘요." },
    { id: 8, cat: "기물", emoji: "🍋", name: "핸드 스퀴저", price: 8500, desc: "라임·레몬 즙을 빠르게. 알루미늄 주물이라 가볍고 튼튼해요." },
    { id: 9, cat: "글라스", emoji: "🍸", name: "닉앤노라 글라스 2P", price: 24000, desc: "클래식 칵테일에 어울리는 150ml 닉앤노라 2개 세트." },
    { id: 10, cat: "글라스", emoji: "🥂", name: "쿠페 글라스 2P", price: 22000, desc: "다이키리·사이드카용 200ml 쿠페 2개 세트." },
    { id: 11, cat: "글라스", emoji: "🥃", name: "하이볼 글라스 4P", price: 19000, tag: "베스트", desc: "350ml 하이볼 잔 4개 세트. 업소용 강화 유리." },
    { id: 12, cat: "글라스", emoji: "🥃", name: "온더락 글라스 2P", price: 14000, desc: "위스키 온더락용 300ml 2개 세트. 두툼한 바닥으로 안정감 있어요." },
    { id: 13, cat: "재료/시럽", emoji: "🍒", name: "그레나딘 시럽 700ml", price: 8500, desc: "선라이즈·셜리 템플의 붉은 층. 석류 향 시럽." },
    { id: 14, cat: "재료/시럽", emoji: "🍯", name: "설탕시럽 700ml (1:1)", price: 6000, desc: "사워 계열 필수 심플 시럽. 바로 쓰는 완제품." },
    { id: 15, cat: "재료/시럽", emoji: "🍋", name: "라임 코디얼 500ml", price: 7500, desc: "김렛용 라임 코디얼. 신선 라임이 없을 때 든든한 백업." },
    { id: 16, cat: "서적", emoji: "📚", name: "클래식 칵테일 노트 (제본)", price: 12000, desc: "클래식 60종 스펙·기법·역사를 정리한 제본 노트. 조주기능사 대비에도 좋아요." },
    { id: 17, cat: "굿즈", emoji: "🦺", name: "바텐톡 에이프런", price: 25000, tag: "신상", desc: "12온스 캔버스 에이프런. 오프너 포켓 + 타월 고리 포함." },
    { id: 18, cat: "굿즈", emoji: "🎨", name: "바텐톡 스티커팩 (12매)", price: 4000, tag: "신상", desc: "셰이커·쿠페·시트러스 일러스트 방수 스티커 12매." },
    { id: 19, cat: "굿즈", emoji: "🪵", name: "코르크 코스터 10P", price: 6000, desc: "무지 코르크 코스터 10개. 어떤 바 분위기에도 잘 붙어요." },
    { id: 20, cat: "소모품", emoji: "🍢", name: "가니시 픽 100입", price: 5000, desc: "체리·올리브용 대나무 가니시 픽 100개입." },
    { id: 21, cat: "소모품", emoji: "🥤", name: "종이 빨대 200입", price: 7000, desc: "친환경 종이 빨대 200개입. 블랙·화이트 혼합." },
    { id: 22, cat: "소모품", emoji: "🧻", name: "칵테일 냅킨 250매", price: 6500, desc: "정사각 칵테일 냅킨 250매. 로고 없는 무지." },
  ];

  /* ---------- 저장소 ---------- */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("bartalk_" + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem("bartalk_" + key, JSON.stringify(val)); }
      catch { toast("저장 공간이 부족해요. 사진 첨부를 줄여주세요."); }
    },
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
    { id: 7, shop: "서면비어", days: 12, title: "부산 서면 크래프트펍 바텐더/서버 모집", pay: "시급 14,000원", region: "부산", area: "부산 부산진구", type: "펍/호프" },
    { id: 8, shop: "달빛한잔", days: 4, title: "전통주 다이닝바 바텐더 채용 (주말)", pay: "시급 16,000원", region: "서울", area: "서울 종로구", type: "칵테일바" },
  ];

  const SEED_SPIRITS = [
    { id: 1, kind: "spirit", emoji: "🥃", name: "글렌피딕 12년", cat: "위스키", abv: 40, price: "5~7만원", note: "배와 사과 향이 나는 입문용 싱글몰트. 부드럽고 깔끔한 피니시라 하이볼로도 좋아요.", by: "익명", time: now - 20 * D, reviews: [
      { color: 3, stars: 5, text: "입문자한테 늘 추천하는 몰트", time: now - 5 * D },
      { color: 6, stars: 4, text: "하이볼 말면 손님들 반응 좋음", time: now - 2 * D },
    ] },
    { id: 2, kind: "spirit", emoji: "🍸", name: "탱커레이 No.10", cat: "진", abv: 47.3, price: "4~5만원", note: "시트러스 향이 강한 프리미엄 진. 마티니 베이스로 최고.", by: "익명", time: now - 15 * D, reviews: [
      { color: 1, stars: 5, text: "마티니엔 이거죠", time: now - 3 * D },
    ] },
    { id: 3, kind: "spirit", emoji: "🍾", name: "카뮤 VSOP", cat: "브랜디", abv: 40, price: "8~10만원", note: "꽃향 은은한 꼬냑. 사이드카 만들 때 자주 씁니다.", by: "익명", time: now - 12 * D, reviews: [] },
    { id: 4, kind: "spirit", emoji: "🍶", name: "화요 41", cat: "전통주", abv: 41, price: "3~4만원", note: "증류식 소주. 온더락으로 마시면 곡물 단맛이 살아나요.", by: "익명", time: now - 9 * D, reviews: [
      { color: 8, stars: 4, text: "외국 손님들이 신기해하면서 잘 마셔요", time: now - 1 * D },
    ] },
    { id: 5, kind: "spirit", emoji: "🥃", name: "부에나비스타 레포사도", cat: "데킬라", abv: 40, price: "6~8만원", note: "오크 숙성 데킬라. 마르가리타보다 스트레이트 추천.", by: "익명", time: now - 6 * D, reviews: [] },
    { id: 101, kind: "cocktail", emoji: "🍸", name: "네그로니", base: "진", abv: 24, ings: "진 30ml\n캄파리 30ml\n스위트 베르무트 30ml\n오렌지 필", recipe: "믹싱글라스에 재료를 넣고 스터 후 온더락 글라스에 스트레인. 오렌지 필로 가니시.", note: "쌉싸름한 어른의 맛. 1:1:1 비율이 기본이지만 진을 조금 올려도 좋아요.", by: "익명", time: now - 18 * D, reviews: [
      { color: 2, stars: 5, text: "요즘 제일 많이 나가는 클래식", time: now - 4 * D },
      { color: 9, stars: 4, text: "캄파리 브랜드 바꾸면 느낌 확 달라짐", time: now - 2 * D },
    ] },
    { id: 102, kind: "cocktail", emoji: "🥃", name: "올드 패션드", base: "위스키", abv: 32, ings: "버번 위스키 45ml\n설탕 1티스푼\n앙고스투라 비터 2대시\n오렌지 필", recipe: "글라스에 설탕과 비터를 넣고 녹인 뒤 위스키와 큰 얼음을 넣고 스터. 오렌지 필로 마무리.", note: "클래식의 왕. 손님 취향 따라 라이 위스키로 바꿔도 좋습니다.", by: "익명", time: now - 14 * D, reviews: [
      { color: 5, stars: 5, text: "기본기 연습에 최고", time: now - 6 * D },
    ] },
    { id: 103, kind: "cocktail", emoji: "🍹", name: "모히토", base: "럼", abv: 12, ings: "화이트 럼 45ml\n라임 반 개\n애플민트 10장\n설탕 2티스푼\n소다수", recipe: "글라스에 민트, 라임, 설탕을 넣고 가볍게 머들링. 크러시드 아이스와 럼을 넣고 소다수로 채우기.", note: "민트는 너무 세게 머들링하면 쓴맛 나요. 향만 내듯 가볍게!", by: "익명", time: now - 10 * D, reviews: [
      { color: 0, stars: 4, text: "여름 시그니처로 변형해서 쓰는 중", time: now - 3 * D },
    ] },
    { id: 104, kind: "cocktail", emoji: "🍋", name: "진 토닉", base: "진", abv: 8, ings: "진 45ml\n토닉워터 120ml\n라임 1조각", recipe: "얼음을 가득 채운 하이볼 글라스에 진을 붓고 토닉워터를 부은 뒤 한 번만 저어주기. 라임 가니시.", note: "많이 저으면 탄산 다 날아가요. 진:토닉 1:3 비율 추천.", by: "익명", time: now - 8 * D, reviews: [] },
    { id: 105, kind: "cocktail", emoji: "🥂", name: "위스키 사워", base: "위스키", abv: 20, ings: "버번 위스키 45ml\n레몬주스 25ml\n설탕시럽 20ml\n달걀 흰자(선택)", recipe: "재료를 셰이커에 넣고 드라이 셰이크 후 얼음과 함께 다시 셰이크. 쿠페 글라스에 스트레인.", note: "흰자 넣으면 폼이 예뻐서 사진용으로도 좋아요.", by: "익명", time: now - 5 * D, reviews: [] },
  ];

  const SEED_MEETS = [
    { id: 1, region: "서울", title: "강남 위스키 시음 번개 🥃", date: now + 2 * D, place: "강남역 인근 위스키바", max: 6, joined: 4, desc: "이번에 새로 들어온 셰리 캐스크 몰트 같이 시음해요. 바텐더 경력 무관, 술 좋아하면 환영!", host: "익명", hostColor: 8, isJoined: false, comments: [
      { color: 3, text: "혹시 초보도 괜찮나요?", time: now - 3 * H },
      { color: 8, text: "네 그럼요! 편하게 오세요", time: now - 2 * H },
    ] },
    { id: 2, region: "서울", title: "홍대 칵테일 레시피 스터디", date: now + 5 * D, place: "홍대입구 스터디룸", max: 8, joined: 6, desc: "클래식 칵테일 하나씩 잡고 레시피 연구하는 모임입니다. 이번 주제는 사워 계열!", host: "익명", hostColor: 1, isJoined: false, comments: [] },
    { id: 3, region: "경기", title: "수원 바텐더 친목 모임 🍻", date: now + 7 * D, place: "수원역 OO포차", max: 10, joined: 9, desc: "수원/동탄 쪽에서 일하는 바텐더들 편하게 만나요. 업계 얘기, 고민 상담 뭐든 좋아요.", host: "익명", hostColor: 5, isJoined: false, comments: [
      { color: 7, text: "저 동탄이요! 참여합니다", time: now - 5 * H },
    ] },
    { id: 4, region: "부산", title: "부산 플레어 연습 모임", date: now + 10 * D, place: "서면 연습실", max: 5, joined: 2, desc: "플레어 바텐딩 같이 연습해요. 기물은 각자 지참, 초보 환영입니다.", host: "익명", hostColor: 4, isJoined: false, comments: [] },
  ];

  const SEED_POSTS = [
    { id: 1, cat: "free", color: 5, nick: "익명", time: now - 9 * M, title: "엥", body: "이런.. 오늘 첫 출근인데 사장님이 안 계심", likes: 0, comments: [{ color: 3, text: "ㅋㅋㅋ 전화해보세요", time: now - 5 * M }], emoji: "🍸" },
    { id: 2, cat: "free", color: 7, nick: "익명", time: now - 11 * M, title: "씻어야하는데", body: "마감하고 왔더니 너무 졸려 ㅜㅜㅜㅜ", likes: 0, comments: [{ color: 1, text: "고생하셨어요 ㅠㅠ", time: now - 8 * M }] },
    { id: 3, cat: "free", color: 6, nick: "익명", time: now - 14 * M, title: "지거 추천 좀", body: "일제 지거 쓰다가 떨어뜨려서 새로 사야해요. 뭐가 좋나요?", likes: 0, comments: [] },
    { id: 4, cat: "free", color: 7, nick: "익명", time: now - 15 * M, title: "하이 환상", body: "홍대 칵테일바 이번주 신메뉴", likes: 0, comments: [{ color: 4, text: "오 어디요?", time: now - 10 * M }, { color: 2, text: "궁금", time: now - 9 * M }, { color: 8, text: "저도 가볼래요", time: now - 7 * M }, { color: 0, text: "위치 좀요", time: now - 4 * M }] },
    { id: 5, cat: "hot", color: 8, nick: "익명", time: now - 4 * H, title: "ㄹㅇ진상손님 11", body: "하 그냥 셰이커 던질뻔했다 ....", likes: 2, comments: Array.from({ length: 19 }, (_, i) => ({ color: i % 10, text: ["고생하셨어요", "무슨 일이에요?", "저도 어제 겪음", "참으세요 ㅠ", "사장님한테 말해요"][i % 5], time: now - (200 - i * 9) * M })), emoji: "💬" },
    { id: 6, cat: "hot", color: 2, nick: "익명", time: now - 5 * H, title: "돈왜버는건지모르겠어요", body: "어차피 집이 못사는것도 아니고 빚이 있는것도 아닌데 차라리 자격증 공부나 할까", likes: 6, comments: Array.from({ length: 12 }, (_, i) => ({ color: (i + 3) % 10, text: ["다들 그런 시기 있어요", "조주기능사 따세요", "화이팅", "저도요.."][i % 4], time: now - (280 - i * 12) * M })) },
    { id: 7, cat: "hot", color: 3, nick: "익명", time: now - 6 * H, title: "손님이 준 팁 최고 기록", body: "다들 팁 얼마까지 받아봤어요? 궁금", likes: 1, comments: Array.from({ length: 45 }, (_, i) => ({ color: (i + 1) % 10, text: ["5만원이요", "저는 아직 ㅠ", "ㅋㅋㅋ", "외국 손님이 후하죠"][i % 4], time: now - (350 - i * 6) * M })), emoji: "💸" },
    { id: 8, cat: "hot", color: 5, nick: "익명", time: now - 11 * H - 30 * M, title: "와 대박", body: "역시 연습했더니 플레어 성공함 영상 봐줘", likes: 6, comments: Array.from({ length: 31 }, (_, i) => ({ color: (i + 5) % 10, text: ["멋있어요!!", "오 대박", "몇 년 차세요?", "부럽다"][i % 4], time: now - (500 - i * 10) * M })), emoji: "🎬" },
    { id: 9, cat: "promo", color: 4, nick: "강남루프탑바", time: now - 70 * M, title: "루프탑바 신규오픈☆[매일 시음회ㅜ선착순]", body: "오픈기념 시그니처 칵테일 시음회 진행", likes: 0, comments: [], emoji: "🎉" },
    { id: 10, cat: "promo", color: 0, nick: "조주학원", time: now - 95 * M, title: "[조주기능사]☆실기 단기반☆주말반 모집", body: "합격보장반 소수정예 커리큘럼 상담환영", likes: 0, comments: [], emoji: "🍹" },
    { id: 11, cat: "promo", color: 9, nick: "바용품샵", time: now - 150 * M, title: "@@셰이커/지거 풀세트 공동구매@@", body: "바텐더 입문 세트 30% 할인 이벤트", likes: 0, comments: [], emoji: "🛒" },
    { id: 12, cat: "promo", color: 1, nick: "미나언니", time: now - 173 * M, title: "칵테일 클래스 ■원데이 클래스■ 수강생 모집", body: "《기초부터》《소수정예》《밀착케어》", likes: 0, comments: [], emoji: "🥂" },
  ];

  /* ---------- 확장 시드 데이터 v2 ---------- */
  SEED_JOBS.push(
    { id: 9, shop: "어반테일", days: 21, title: "성수 감성 칵테일바 바텐더 모집 (주5일)", pay: "시급 16,000원", region: "서울", area: "서울 성동구", type: "칵테일바" },
    { id: 10, shop: "블루문펍", days: 44, title: "해운대 오션뷰 펍 바텐더/서버 대모집", pay: "시급 13,500원", region: "부산", area: "부산 해운대구", type: "펍/호프" },
    { id: 11, shop: "오크룸", days: 66, title: "대구 위스키바 경력 바텐더 우대 채용", pay: "시급 15,000원", region: "대구", area: "대구 중구", type: "위스키바" },
    { id: 12, shop: "살루드", days: 9, title: "이태원 스페인바 정규직 바텐더 채용", pay: "월급 300만원", region: "서울", area: "서울 용산구", type: "칵테일바" },
    { id: 13, shop: "하이볼스탠드", days: 27, title: "판교 하이볼 전문점 야간 바텐더 급구", pay: "시급 14,000원", region: "경기", area: "경기 성남시", type: "이자카야" },
    { id: 14, shop: "라비니아", days: 88, title: "송도 와인바 소믈리에 지망생 환영", pay: "시급 15,000원", region: "인천", area: "인천 연수구", type: "와인바" },
    { id: 15, shop: "더몰트", days: 15, title: "둔산동 몰트바 위스키 러버 바텐더 모집", pay: "시급 14,500원", region: "대전", area: "대전 서구", type: "위스키바" },
    { id: 16, shop: "네온사인", days: 33, title: "동명동 칵테일바 주말 바텐더 모집", pay: "시급 14,000원", region: "광주", area: "광주 동구", type: "칵테일바" }
  );

  SEED_SPIRITS.push(
    // ===== 위스키 (스카치 싱글몰트) =====
    { id: 201, kind: "spirit", emoji: "🥃", name: "글렌리벳 12년", cat: "위스키", abv: 40, price: "5~7만원", note: "부드러운 과일향의 스페이사이드 대표 입문 몰트. 글렌피딕과 함께 첫 싱글몰트로 가장 많이 추천돼요.", by: "익명", time: now - 40 * D, reviews: [
      { color: 4, stars: 4, text: "무난 그 자체. 입문용으로 좋아요", time: now - 12 * D },
    ] },
    { id: 202, kind: "spirit", emoji: "🥃", name: "발베니 12년 더블우드", cat: "위스키", abv: 40, price: "11~14만원", note: "버번 캐스크 숙성 후 셰리 캐스크로 마무리. 꿀과 바닐라, 은은한 셰리 단맛이 매력이라 선물용으로도 인기.", by: "익명", time: now - 39 * D, reviews: [
      { color: 7, stars: 5, text: "달달한 몰트 좋아하는 손님한테 늘 추천", time: now - 8 * D },
      { color: 2, stars: 5, text: "구하기 힘든 게 단점", time: now - 3 * D },
    ] },
    { id: 203, kind: "spirit", emoji: "🥃", name: "맥캘란 12년 셰리오크", cat: "위스키", abv: 40, price: "12~16만원", note: "셰리 캐스크 숙성의 교과서. 건포도·다크초콜릿 뉘앙스로 바에서 지명률이 가장 높은 몰트 중 하나.", by: "익명", time: now - 38 * D, reviews: [
      { color: 9, stars: 5, text: "손님들이 이름만 듣고 시키는 술 1위", time: now - 10 * D },
    ] },
    { id: 204, kind: "spirit", emoji: "🥃", name: "글렌모렌지 오리지널 10년", cat: "위스키", abv: 40, price: "4~6만원", note: "시트러스와 복숭아 향이 산뜻한 하이랜드 몰트. 가볍고 깨끗해서 하이볼 베이스로도 아깝지 않아요.", by: "익명", time: now - 37 * D, reviews: [] },
    { id: 205, kind: "spirit", emoji: "🥃", name: "아드벡 10년", cat: "위스키", abv: 46, price: "8~10만원", note: "강렬한 피트와 스모크 뒤에 숨은 단맛. 피트 입문을 끝낸 손님에게 다음 단계로 권하기 좋아요.", by: "익명", time: now - 36 * D, reviews: [
      { color: 0, stars: 5, text: "피트 좋아하면 무조건", time: now - 6 * D },
    ] },
    { id: 206, kind: "spirit", emoji: "🥃", name: "라가불린 16년", cat: "위스키", abv: 43, price: "12~15만원", note: "묵직한 피트와 요오드, 긴 피니시. 아일라의 왕이라 불리는 클래식.", by: "익명", time: now - 35 * D, reviews: [] },
    { id: 207, kind: "spirit", emoji: "🥃", name: "라프로익 10년", cat: "위스키", abv: 40, price: "8~10만원", note: "소독약 같다는 말이 칭찬이 되는 술. 호불호 최강이지만 빠지면 헤어나올 수 없어요.", by: "익명", time: now - 34 * D, reviews: [
      { color: 5, stars: 4, text: "첫 모금은 충격, 세 모금째 사랑", time: now - 9 * D },
    ] },
    { id: 208, kind: "spirit", emoji: "🥃", name: "탈리스커 10년", cat: "위스키", abv: 45.8, price: "7~9만원", note: "후추처럼 알싸한 스파이시함과 바다 내음. 스카이 섬의 개성이 뚜렷해요.", by: "익명", time: now - 33 * D, reviews: [] },
    { id: 209, kind: "spirit", emoji: "🥃", name: "하이랜드 파크 12년", cat: "위스키", abv: 40, price: "7~9만원", note: "헤더 꿀의 단맛과 은은한 피트의 밸런스. 두루두루 호평받는 올라운더.", by: "익명", time: now - 32 * D, reviews: [] },
    { id: 210, kind: "spirit", emoji: "🥃", name: "글렌드로낙 12년", cat: "위스키", abv: 43, price: "8~10만원", note: "진한 셰리 몰트를 합리적인 가격에. 맥캘란 대안으로 자주 권합니다.", by: "익명", time: now - 31 * D, reviews: [
      { color: 3, stars: 5, text: "가성비 셰리는 이거죠", time: now - 5 * D },
    ] },
    { id: 211, kind: "spirit", emoji: "🥃", name: "보모어 12년", cat: "위스키", abv: 40, price: "6~8만원", note: "부드러운 피트 입문용. 스모크와 과일향의 균형이 좋아 피트 첫 경험으로 추천.", by: "익명", time: now - 30 * D, reviews: [] },
    { id: 212, kind: "spirit", emoji: "🥃", name: "오반 14년", cat: "위스키", abv: 43, price: "10~13만원", note: "가벼운 스모크와 오렌지 껍질, 소금기. 하이랜드와 아일라의 중간 성격.", by: "익명", time: now - 29 * D, reviews: [] },
    // ===== 위스키 (블렌디드) =====
    { id: 213, kind: "spirit", emoji: "🥃", name: "조니워커 블랙 12년", cat: "위스키", abv: 40, price: "3~5만원", note: "블렌디드의 기준점. 은은한 스모크가 있어 하이볼부터 온더락까지 다 어울려요.", by: "익명", time: now - 28 * D, reviews: [
      { color: 6, stars: 4, text: "바 기본템. 없는 데가 없죠", time: now - 7 * D },
    ] },
    { id: 214, kind: "spirit", emoji: "🥃", name: "발렌타인 17년", cat: "위스키", abv: 40, price: "7~9만원", note: "한국에서 유독 사랑받는 블렌디드. 부드럽고 고급스러워 접대 자리 단골.", by: "익명", time: now - 27 * D, reviews: [] },
    { id: 215, kind: "spirit", emoji: "🥃", name: "시바스 리갈 12년", cat: "위스키", abv: 40, price: "3~4만원", note: "달콤하고 순한 블렌디드. 위스키 처음 마시는 손님에게 부담이 없어요.", by: "익명", time: now - 26 * D, reviews: [] },
    { id: 216, kind: "spirit", emoji: "🥃", name: "제임슨", cat: "위스키", abv: 40, price: "3~4만원", note: "3회 증류로 가볍고 매끈한 아이리시 위스키. 진저에일과 섞는 '제임슨 진저'가 유명해요.", by: "익명", time: now - 25 * D, reviews: [
      { color: 1, stars: 4, text: "아이리시 하이볼 최고", time: now - 4 * D },
    ] },
    // ===== 위스키 (아메리칸/버번) =====
    { id: 217, kind: "spirit", emoji: "🥃", name: "메이커스 마크", cat: "위스키", abv: 45, price: "4~5만원", note: "밀을 쓴 부드러운 버번. 빨간 왁스 캡이 시그니처. 올드 패션드 베이스로 무난 그 이상.", by: "익명", time: now - 24 * D, reviews: [] },
    { id: 218, kind: "spirit", emoji: "🥃", name: "버팔로 트레이스", cat: "위스키", abv: 45, price: "4~6만원", note: "바닐라·카라멜의 정석 버번. 칵테일과 니트 모두 커버하는 가성비 갑.", by: "익명", time: now - 23 * D, reviews: [
      { color: 8, stars: 5, text: "우리 바 버번 칵테일은 다 이걸로", time: now - 2 * D },
    ] },
    { id: 219, kind: "spirit", emoji: "🥃", name: "와일드 터키 101", cat: "위스키", abv: 50.5, price: "4~6만원", note: "높은 도수의 펀치력. 위스키 사워처럼 시트러스와 붙어도 존재감이 살아있어요.", by: "익명", time: now - 22 * D, reviews: [] },
    { id: 220, kind: "spirit", emoji: "🥃", name: "우드포드 리저브", cat: "위스키", abv: 43.2, price: "6~8만원", note: "곱고 우아한 프리미엄 버번. 민트 줄렙 공식 위스키로도 유명하죠.", by: "익명", time: now - 21 * D, reviews: [] },
    { id: 221, kind: "spirit", emoji: "🥃", name: "잭 다니엘 올드 No.7", cat: "위스키", abv: 40, price: "3~5만원", note: "차콜 멜로잉을 거친 테네시 위스키. 잭콕 하나로 전 세계 바 필수템이 됐어요.", by: "익명", time: now - 20 * D, reviews: [] },
    { id: 222, kind: "spirit", emoji: "🥃", name: "불렛 버번", cat: "위스키", abv: 45, price: "4~6만원", note: "라이 비율이 높아 스파이시한 버번. 칵테일에 넣으면 심이 잡혀요.", by: "익명", time: now - 19 * D, reviews: [] },
    // ===== 위스키 (재패니즈) =====
    { id: 223, kind: "spirit", emoji: "🥃", name: "야마자키 12년", cat: "위스키", abv: 43, price: "20~30만원", note: "일본 위스키 붐의 주역. 미즈나라 오크의 향신료 뉘앙스가 독특합니다. 구하기가 일.", by: "익명", time: now - 18 * D, reviews: [
      { color: 2, stars: 5, text: "들어오는 족족 팔림", time: now - 1 * D },
    ] },
    { id: 224, kind: "spirit", emoji: "🥃", name: "히비키 하모니", cat: "위스키", abv: 43, price: "13~18만원", note: "이름처럼 조화로운 블렌디드. 병 디자인만으로도 바 백바가 살아나요.", by: "익명", time: now - 17 * D, reviews: [] },
    { id: 225, kind: "spirit", emoji: "🥃", name: "산토리 가쿠빈", cat: "위스키", abv: 40, price: "3~4만원", note: "일본 하이볼 문화를 만든 술. 하이볼 전용이라 해도 과언이 아니에요.", by: "익명", time: now - 16 * D, reviews: [
      { color: 4, stars: 4, text: "하이볼 회전율 최고", time: now - 3 * D },
    ] },
    { id: 226, kind: "spirit", emoji: "🥃", name: "니카 프롬 더 배럴", cat: "위스키", abv: 51.4, price: "8~11만원", note: "각진 병에 담긴 고도수 블렌디드. 진하고 묵직해서 온더락 진리.", by: "익명", time: now - 15 * D, reviews: [] },
    // ===== 진 =====
    { id: 227, kind: "spirit", emoji: "🍸", name: "봄베이 사파이어", cat: "진", abv: 47, price: "3~4만원", note: "10가지 보태니컬의 화사한 향. 파란 병만큼 향도 청량한 스탠다드 진.", by: "익명", time: now - 14 * D, reviews: [] },
    { id: 228, kind: "spirit", emoji: "🍸", name: "헨드릭스", cat: "진", abv: 44, price: "5~7만원", note: "오이와 장미 인퓨전이 시그니처. 가니시도 라임 대신 오이로 내면 손님들이 신기해해요.", by: "익명", time: now - 13 * D, reviews: [
      { color: 7, stars: 5, text: "진토닉에 오이 올리면 반응 미쳐요", time: now - 2 * D },
    ] },
    { id: 229, kind: "spirit", emoji: "🍸", name: "몽키 47", cat: "진", abv: 47, price: "8~11만원", note: "47가지 보태니컬을 쓴 독일 진. 복잡한 향을 즐기려면 마티니나 니트로.", by: "익명", time: now - 12 * D, reviews: [] },
    { id: 230, kind: "spirit", emoji: "🍸", name: "로쿠 진", cat: "진", abv: 43, price: "4~5만원", note: "벚꽃·유자 등 일본 보태니컬 6종. 토닉과 만나면 은은한 벚꽃향이 살아나요.", by: "익명", time: now - 11 * D, reviews: [] },
    // ===== 럼 =====
    { id: 231, kind: "spirit", emoji: "🍹", name: "바카디 카르타 블랑카", cat: "럼", abv: 40, price: "2~3만원", note: "화이트 럼의 기준. 다이키리·모히토 등 럼 칵테일의 출발점입니다.", by: "익명", time: now - 10 * D, reviews: [] },
    { id: 232, kind: "spirit", emoji: "🍹", name: "하바나 클럽 3년", cat: "럼", abv: 40, price: "3~4만원", note: "쿠바 스타일의 가벼운 숙성 럼. 모히토를 진짜 쿠바 맛으로 만들어줘요.", by: "익명", time: now - 10 * D, reviews: [] },
    { id: 233, kind: "spirit", emoji: "🍹", name: "디플로마티코 리세르바", cat: "럼", abv: 40, price: "7~9만원", note: "디저트처럼 달콤한 베네수엘라 다크 럼. 럼 니트 입문으로 실패가 없어요.", by: "익명", time: now - 9 * D, reviews: [
      { color: 5, stars: 5, text: "달콤한 술 찾는 손님 최종병기", time: now - 1 * D },
    ] },
    // ===== 보드카 =====
    { id: 234, kind: "spirit", emoji: "🍸", name: "앱솔루트", cat: "보드카", abv: 40, price: "2~3만원", note: "깔끔하고 중립적인 스웨덴 보드카. 칵테일 베이스의 일꾼.", by: "익명", time: now - 9 * D, reviews: [] },
    { id: 235, kind: "spirit", emoji: "🍸", name: "그레이 구스", cat: "보드카", abv: 40, price: "5~7만원", note: "프랑스 밀로 만든 프리미엄 보드카. 마티니를 부드럽게 마시고 싶을 때.", by: "익명", time: now - 8 * D, reviews: [] },
    { id: 236, kind: "spirit", emoji: "🍸", name: "티토스", cat: "보드카", abv: 40, price: "4~5만원", note: "옥수수 베이스의 미국 크래프트 보드카. 은은한 단맛이 매력.", by: "익명", time: now - 8 * D, reviews: [] },
    // ===== 데킬라 =====
    { id: 237, kind: "spirit", emoji: "🥃", name: "돈 훌리오 블랑코", cat: "데킬라", abv: 40, price: "8~10만원", note: "100% 아가베의 깨끗한 단맛. 데킬라 이미지를 바꿔주는 술이에요.", by: "익명", time: now - 7 * D, reviews: [
      { color: 9, stars: 5, text: "이거 마시고 데킬라 다시 봤다는 손님 많음", time: now - 2 * D },
    ] },
    { id: 238, kind: "spirit", emoji: "🥃", name: "호세 쿠엘보 에스페시알", cat: "데킬라", abv: 40, price: "3~4만원", note: "마르가리타 대량 영업의 친구. 슈터로도 제일 많이 나가죠.", by: "익명", time: now - 7 * D, reviews: [] },
    // ===== 리큐르 =====
    { id: 239, kind: "spirit", emoji: "🍷", name: "캄파리", cat: "리큐르", abv: 25, price: "3~4만원", note: "허브와 쓴맛의 이탈리안 비터 리큐르. 네그로니·스프리츠의 심장.", by: "익명", time: now - 6 * D, reviews: [] },
    { id: 240, kind: "spirit", emoji: "🍷", name: "아페롤", cat: "리큐르", abv: 11, price: "3~4만원", note: "캄파리의 순한 동생. 오렌지빛 스프리츠 하나로 여름 매출을 책임집니다.", by: "익명", time: now - 6 * D, reviews: [
      { color: 3, stars: 4, text: "여름엔 스프리츠가 국룰", time: now - 1 * D },
    ] },
    { id: 241, kind: "spirit", emoji: "🍾", name: "깔루아", cat: "리큐르", abv: 16, price: "2~3만원", note: "멕시코 커피 리큐르. 깔루아 밀크부터 에스프레소 마티니까지 활용 무한.", by: "익명", time: now - 5 * D, reviews: [] },
    { id: 242, kind: "spirit", emoji: "🍾", name: "베일리스", cat: "리큐르", abv: 17, price: "3~4만원", note: "아이리시 크림 리큐르. 얼음에 그냥 부어도 디저트가 돼요.", by: "익명", time: now - 5 * D, reviews: [] },
    { id: 243, kind: "spirit", emoji: "🍊", name: "코인트로", cat: "리큐르", abv: 40, price: "4~5만원", note: "오렌지 리큐르의 표준. 마르가리타·코스모·사이드카가 다 이 병에서 나옵니다.", by: "익명", time: now - 4 * D, reviews: [] },
    { id: 244, kind: "spirit", emoji: "🍸", name: "미도리", cat: "리큐르", abv: 20, price: "3~4만원", note: "형광 초록의 멜론 리큐르. 준벅·미도리 사워로 초보 손님 입맛을 사로잡아요.", by: "익명", time: now - 4 * D, reviews: [] },
    { id: 245, kind: "spirit", emoji: "🥥", name: "말리부", cat: "리큐르", abv: 21, price: "2~3만원", note: "코코넛 향 럼 리큐르. 파인애플 주스만 부어도 휴양지가 됩니다.", by: "익명", time: now - 3 * D, reviews: [] },
    { id: 246, kind: "spirit", emoji: "🥃", name: "디사론노", cat: "리큐르", abv: 28, price: "4~5만원", note: "아몬드향 아마레또의 대명사. 갓파더·아마레또 사워 필수템.", by: "익명", time: now - 3 * D, reviews: [] },
    // ===== 브랜디/전통주 =====
    { id: 247, kind: "spirit", emoji: "🍾", name: "헤네시 VS", cat: "브랜디", abv: 40, price: "7~9만원", note: "세계에서 가장 많이 팔리는 꼬냑. 사이드카 베이스로도, 니트로도.", by: "익명", time: now - 2 * D, reviews: [] },
    { id: 248, kind: "spirit", emoji: "🍶", name: "안동소주 45", cat: "전통주", abv: 45, price: "2~3만원", note: "전통 증류식 소주의 대표. 도수는 세지만 향은 곱습니다. 한식 안주와 찰떡.", by: "익명", time: now - 2 * D, reviews: [] },
    { id: 249, kind: "spirit", emoji: "🍶", name: "복순도가 손막걸리", cat: "전통주", abv: 6.5, price: "1~2만원", note: "샴페인처럼 터지는 탄산 막걸리. 외국 손님 반응이 특히 좋아요.", by: "익명", time: now - 1 * D, reviews: [
      { color: 6, stars: 5, text: "오픈할 때 뚜껑 조심 ㅋㅋ 분수됨", time: now - 10 * H },
    ] }
  );

  SEED_SPIRITS.push(
    // ===== 칵테일 (클래식) =====
    { id: 301, kind: "cocktail", emoji: "🍸", name: "마티니", base: "진", abv: 28, ings: "진 60ml\n드라이 베르무트 10ml\n올리브 또는 레몬 필", recipe: "믹싱글라스에 얼음과 재료를 넣고 차갑게 스터. 칠링한 마티니 글라스에 스트레인 후 가니시.", note: "베르무트 비율로 드라이함을 조절해요. 손님 취향을 먼저 물어보는 게 좋아요.", by: "익명", time: now - 30 * D, reviews: [
      { color: 1, stars: 5, text: "바텐더 실력이 그대로 드러나는 술", time: now - 5 * D },
    ] },
    { id: 302, kind: "cocktail", emoji: "🥃", name: "맨해튼", base: "위스키", abv: 30, ings: "라이 위스키 50ml\n스위트 베르무트 20ml\n앙고스투라 비터 2대시\n체리", recipe: "믹싱글라스에 얼음과 재료를 넣고 스터. 쿠페 글라스에 스트레인, 체리로 가니시.", note: "마티니와 함께 스터 기본기의 양대산맥. 버번으로 하면 좀 더 달콤해집니다.", by: "익명", time: now - 29 * D, reviews: [] },
    { id: 303, kind: "cocktail", emoji: "🍹", name: "다이키리", base: "럼", abv: 22, ings: "화이트 럼 45ml\n라임주스 25ml\n설탕시럽 15ml", recipe: "셰이커에 얼음과 재료를 넣고 강하게 셰이크. 칠링한 쿠페에 더블 스트레인.", note: "럼·라임·설탕 세 가지로 셰이킹의 기본을 배우는 술. 밸런스 연습에 최고예요.", by: "익명", time: now - 28 * D, reviews: [
      { color: 8, stars: 5, text: "심플한 게 제일 어렵다는 걸 알려주는 술", time: now - 4 * D },
    ] },
    { id: 304, kind: "cocktail", emoji: "🍋", name: "마르가리타", base: "데킬라", abv: 25, ings: "데킬라 50ml\n코인트로 20ml\n라임주스 15ml\n소금 리밍", recipe: "글라스 림에 라임을 문지르고 소금을 묻힌다. 재료를 셰이크해 스트레인.", note: "소금 리밍은 반만 하면 손님이 선택해서 마실 수 있어요.", by: "익명", time: now - 27 * D, reviews: [] },
    { id: 305, kind: "cocktail", emoji: "🍸", name: "코스모폴리탄", base: "보드카", abv: 20, ings: "보드카 40ml\n코인트로 15ml\n라임주스 15ml\n크랜베리주스 30ml", recipe: "셰이커에 얼음과 재료를 넣고 셰이크. 마티니 글라스에 스트레인, 오렌지 필로 마무리.", note: "분홍빛 색감이 생명. 크랜베리 양으로 색을 조절해요.", by: "익명", time: now - 26 * D, reviews: [] },
    { id: 306, kind: "cocktail", emoji: "🍸", name: "에스프레소 마티니", base: "보드카", abv: 18, ings: "보드카 50ml\n깔루아 20ml\n에스프레소 1샷(30ml)\n설탕시럽 5ml", recipe: "모든 재료를 얼음과 함께 아주 강하게 셰이크. 마티니 글라스에 더블 스트레인, 원두 3알 가니시.", note: "크레마 거품이 포인트라 셰이킹을 세게, 길게! 갓 뽑은 에스프레소일수록 좋아요.", by: "익명", time: now - 25 * D, reviews: [
      { color: 2, stars: 5, text: "요즘 주문 1위. 원두 3알 잊지 마세요", time: now - 3 * D },
    ] },
    { id: 307, kind: "cocktail", emoji: "🥂", name: "아페롤 스프리츠", base: "리큐르", abv: 9, ings: "아페롤 60ml\n프로세코 90ml\n소다수 30ml\n오렌지 슬라이스", recipe: "얼음을 채운 와인 글라스에 프로세코, 아페롤, 소다수 순서로 붓고 가볍게 스터. 오렌지 가니시.", note: "순서대로 부어야 아페롤이 가라앉지 않아요. 여름 테라스 최강 메뉴.", by: "익명", time: now - 24 * D, reviews: [] },
    { id: 308, kind: "cocktail", emoji: "🥃", name: "위스키 하이볼", base: "위스키", abv: 9, ings: "위스키 45ml\n탄산수 120ml\n레몬 필(선택)", recipe: "얼음을 가득 채운 하이볼 글라스에 위스키를 붓고 차가운 탄산수를 조심히 부은 뒤 딱 한 번 스터.", note: "얼음 가득·탄산수 차갑게·젓기는 한 번. 이 세 가지가 하이볼의 전부예요.", by: "익명", time: now - 23 * D, reviews: [
      { color: 4, stars: 5, text: "가쿠빈+토키 얼음이면 끝", time: now - 2 * D },
    ] },
    { id: 309, kind: "cocktail", emoji: "🥥", name: "피나 콜라다", base: "럼", abv: 12, ings: "화이트 럼 50ml\n코코넛 크림 30ml\n파인애플주스 50ml\n파인애플 웨지", recipe: "재료를 크러시드 아이스와 함께 블렌딩하거나 강하게 셰이크. 파인애플과 체리로 가니시.", note: "블렌더 버전이 정석. 얼음 양으로 농도를 맞추세요.", by: "익명", time: now - 22 * D, reviews: [] },
    { id: 310, kind: "cocktail", emoji: "🍹", name: "롱아일랜드 아이스티", base: "기타", abv: 22, ings: "진 15ml\n럼 15ml\n보드카 15ml\n데킬라 15ml\n코인트로 15ml\n레몬주스 25ml\n콜라 적당량", recipe: "콜라를 제외한 재료를 셰이크 후 얼음 채운 글라스에 붓고 콜라로 채운다. 레몬 가니시.", note: "홍차 없이 홍차 색을 내는 마법. 도수가 세니 손님에게 미리 안내하세요.", by: "익명", time: now - 21 * D, reviews: [
      { color: 0, stars: 4, text: "만들 때마다 병 5개 꺼내는 게 일 ㅋㅋ", time: now - 6 * D },
    ] },
    { id: 311, kind: "cocktail", emoji: "🍾", name: "사이드카", base: "기타", abv: 26, ings: "꼬냑 50ml\n코인트로 20ml\n레몬주스 20ml\n설탕 리밍(선택)", recipe: "재료를 얼음과 셰이크해 쿠페 글라스에 스트레인. 취향에 따라 설탕 리밍.", note: "브랜디 칵테일 입문 1순위. 신맛과 단맛의 밸런스가 관건.", by: "익명", time: now - 20 * D, reviews: [] },
    { id: 312, kind: "cocktail", emoji: "🍸", name: "김렛", base: "진", abv: 24, ings: "진 60ml\n라임주스 15ml\n설탕시럽 10ml", recipe: "재료를 얼음과 함께 셰이크 후 쿠페에 더블 스트레인. 라임 필 가니시.", note: "레이먼드 챈들러 소설로 유명해진 술. 드라이하게 갈수록 어른의 맛.", by: "익명", time: now - 19 * D, reviews: [] },
    { id: 313, kind: "cocktail", emoji: "🍋", name: "톰 콜린스", base: "진", abv: 10, ings: "진 45ml\n레몬주스 30ml\n설탕시럽 15ml\n소다수 60ml", recipe: "진·레몬·시럽을 셰이크해 얼음 채운 콜린스 글라스에 붓고 소다수로 채운다. 레몬·체리 가니시.", note: "진 레모네이드라고 생각하면 쉬워요. 여름 낮술로 최고.", by: "익명", time: now - 18 * D, reviews: [] },
    { id: 314, kind: "cocktail", emoji: "🥂", name: "프렌치 75", base: "진", abv: 15, ings: "진 30ml\n레몬주스 15ml\n설탕시럽 10ml\n샴페인 60ml", recipe: "진·레몬·시럽을 셰이크해 플루트 글라스에 스트레인 후 샴페인으로 채운다. 레몬 필 가니시.", note: "축하 자리에 어울리는 스파클링 칵테일. 샴페인은 마지막에!", by: "익명", time: now - 17 * D, reviews: [] },
    { id: 315, kind: "cocktail", emoji: "🍈", name: "준벅", base: "리큐르", abv: 10, ings: "미도리 30ml\n말리부 15ml\n바나나 리큐르 15ml\n파인애플주스 60ml\n레몬주스 15ml", recipe: "재료를 얼음과 함께 셰이크해 얼음 채운 글라스에 붓는다. 파인애플·체리 가니시.", note: "초록빛 달콤함으로 술 못 마시는 손님도 사로잡는 국민 입문 칵테일.", by: "익명", time: now - 16 * D, reviews: [
      { color: 7, stars: 4, text: "여자 손님 테이블에서 제일 많이 나가요", time: now - 3 * D },
    ] },
    { id: 316, kind: "cocktail", emoji: "🍈", name: "미도리 사워", base: "리큐르", abv: 10, ings: "미도리 45ml\n레몬주스 20ml\n설탕시럽 10ml\n소다수 60ml", recipe: "미도리·레몬·시럽을 셰이크해 얼음 채운 글라스에 붓고 소다수로 채운다.", note: "형광 초록 비주얼로 사진 찍는 손님이 많아요. 상큼달콤의 대명사.", by: "익명", time: now - 15 * D, reviews: [] },
    { id: 317, kind: "cocktail", emoji: "🍅", name: "블러디 메리", base: "보드카", abv: 12, ings: "보드카 45ml\n토마토주스 90ml\n레몬주스 15ml\n우스터소스 2대시\n타바스코 약간\n소금·후추", recipe: "재료를 얼음과 함께 롤링(잔 사이로 옮겨 붓기)해 섞고 셀러리 스틱으로 가니시.", note: "해장 칵테일의 전설. 스파이스 양은 손님 취향대로 조절하세요.", by: "익명", time: now - 14 * D, reviews: [] },
    { id: 318, kind: "cocktail", emoji: "🧉", name: "모스코 뮬", base: "보드카", abv: 10, ings: "보드카 45ml\n진저비어 120ml\n라임주스 10ml\n라임 웨지", recipe: "구리 머그에 얼음을 채우고 보드카·라임주스를 넣은 뒤 진저비어로 채운다.", note: "구리잔이 없으면 하이볼 글라스도 OK. 생강의 알싸함이 포인트.", by: "익명", time: now - 13 * D, reviews: [] },
    { id: 319, kind: "cocktail", emoji: "🥤", name: "쿠바 리브레", base: "럼", abv: 10, ings: "화이트 럼 50ml\n콜라 120ml\n라임주스 10ml\n라임 웨지", recipe: "얼음 채운 하이볼 글라스에 럼과 라임주스를 넣고 콜라로 채운 뒤 가볍게 스터.", note: "럼콕과의 차이는 라임 한 조각. 그 한 조각이 커요.", by: "익명", time: now - 12 * D, reviews: [] },
    { id: 320, kind: "cocktail", emoji: "🥛", name: "깔루아 밀크", base: "리큐르", abv: 5, ings: "깔루아 45ml\n우유 120ml", recipe: "얼음을 채운 글라스에 깔루아를 붓고 우유를 부어 층을 만든 뒤 마시기 전에 젓는다.", note: "층 분리를 예쁘게 내려면 우유를 바 스푼 등을 타고 천천히. 알콜 입문 1번 술.", by: "익명", time: now - 11 * D, reviews: [] },
    { id: 321, kind: "cocktail", emoji: "🍑", name: "섹스 온 더 비치", base: "보드카", abv: 11, ings: "보드카 40ml\n피치 리큐르 20ml\n오렌지주스 40ml\n크랜베리주스 40ml", recipe: "얼음 채운 글라스에 재료를 순서대로 붓고 가볍게 스터. 오렌지 슬라이스 가니시.", note: "그라데이션을 내고 싶으면 크랜베리를 마지막에 천천히.", by: "익명", time: now - 10 * D, reviews: [] },
    { id: 322, kind: "cocktail", emoji: "🥃", name: "페니실린", base: "위스키", abv: 20, ings: "블렌디드 스카치 45ml\n레몬주스 25ml\n꿀생강시럽 20ml\n아일라 위스키 플로트 7.5ml", recipe: "스카치·레몬·시럽을 셰이크해 얼음 위에 스트레인, 피트 위스키를 띄우고 생강 슬라이스 가니시.", note: "모던 클래식의 대표. 마지막 피트 플로트가 '약' 같은 향을 완성해요.", by: "익명", time: now - 9 * D, reviews: [
      { color: 9, stars: 5, text: "이거 시키는 손님은 찐이다", time: now - 2 * D },
    ] },
    { id: 323, kind: "cocktail", emoji: "🍷", name: "뉴욕 사워", base: "위스키", abv: 18, ings: "버번 45ml\n레몬주스 25ml\n설탕시럽 15ml\n레드와인 플로트 15ml", recipe: "버번·레몬·시럽을 셰이크해 얼음 위에 붓고 레드와인을 스푼 뒷면을 타고 띄운다.", note: "와인 층이 만드는 그라데이션이 시그니처. 사진 맛집 칵테일.", by: "익명", time: now - 8 * D, reviews: [] },
    { id: 324, kind: "cocktail", emoji: "🥃", name: "갓파더", base: "위스키", abv: 30, ings: "스카치 위스키 45ml\n디사론노 15ml", recipe: "온더락 글라스에 큰 얼음을 넣고 재료를 부은 뒤 가볍게 스터.", note: "재료 두 개로 끝나는 남자의 술. 아마레또 비율로 단맛 조절.", by: "익명", time: now - 7 * D, reviews: [] },
    { id: 325, kind: "cocktail", emoji: "☕", name: "화이트 러시안", base: "보드카", abv: 15, ings: "보드카 40ml\n깔루아 20ml\n생크림(또는 우유) 20ml", recipe: "온더락 글라스에 얼음, 보드카, 깔루아를 넣고 크림을 위에 띄운다.", note: "영화 위대한 레보스키로 유명해진 술. 크림 대신 우유면 좀 더 가볍게.", by: "익명", time: now - 6 * D, reviews: [] },
    { id: 326, kind: "cocktail", emoji: "☕", name: "블랙 러시안", base: "보드카", abv: 22, ings: "보드카 50ml\n깔루아 20ml", recipe: "온더락 글라스에 얼음과 재료를 넣고 스터.", note: "화이트 러시안에서 크림만 뺀 심플 버전. 식후주로 좋아요.", by: "익명", time: now - 6 * D, reviews: [] },
    { id: 327, kind: "cocktail", emoji: "🍹", name: "마이타이", base: "럼", abv: 20, ings: "다크 럼 30ml\n화이트 럼 30ml\n오렌지 퀴라소 15ml\n오르쟈(아몬드시럽) 10ml\n라임주스 20ml\n민트", recipe: "재료를 크러시드 아이스와 셰이크해 글라스에 통째로 붓고 민트와 라임으로 가니시.", note: "티키 칵테일의 왕. 다크 럼 플로트를 얹으면 비주얼 완성.", by: "익명", time: now - 5 * D, reviews: [] },
    { id: 328, kind: "cocktail", emoji: "🍋", name: "카이피리냐", base: "기타", abv: 22, ings: "카샤사 60ml\n라임 1개(웨지)\n설탕 2티스푼", recipe: "글라스에 라임과 설탕을 넣고 머들링한 뒤 크러시드 아이스와 카샤사를 넣고 스터.", note: "브라질 국민 칵테일. 카샤사가 없으면 럼으로 하면 카이피리시마.", by: "익명", time: now - 5 * D, reviews: [] },
    { id: 329, kind: "cocktail", emoji: "🌅", name: "데킬라 선라이즈", base: "데킬라", abv: 12, ings: "데킬라 45ml\n오렌지주스 90ml\n그레나딘 시럽 15ml", recipe: "얼음 채운 글라스에 데킬라와 오렌지주스를 붓고 그레나딘을 천천히 가라앉힌다.", note: "일출 그라데이션이 생명. 젓지 말고 그대로 서브하세요.", by: "익명", time: now - 4 * D, reviews: [] },
    { id: 330, kind: "cocktail", emoji: "🍋", name: "팔로마", base: "데킬라", abv: 10, ings: "데킬라 50ml\n자몽소다 120ml\n라임주스 10ml\n소금 리밍(선택)", recipe: "소금 리밍한 하이볼 글라스에 얼음, 데킬라, 라임주스를 넣고 자몽소다로 채운다.", note: "멕시코 현지에서는 마르가리타보다 인기. 여름 신메뉴로 강추.", by: "익명", time: now - 4 * D, reviews: [] },
    { id: 331, kind: "cocktail", emoji: "🥂", name: "미모사", base: "기타", abv: 8, ings: "샴페인 75ml\n오렌지주스 75ml", recipe: "플루트 글라스에 오렌지주스를 붓고 샴페인을 천천히 채운다.", note: "브런치의 동반자. 1:1 비율이 기본, 젓지 않아도 됩니다.", by: "익명", time: now - 3 * D, reviews: [] },
    { id: 332, kind: "cocktail", emoji: "🍑", name: "벨리니", base: "기타", abv: 8, ings: "프로세코 100ml\n복숭아 퓨레 50ml", recipe: "플루트 글라스에 복숭아 퓨레를 넣고 프로세코를 천천히 부어 가볍게 섞는다.", note: "베네치아 해리스바에서 탄생한 클래식. 퓨레는 화이트 피치가 정석.", by: "익명", time: now - 3 * D, reviews: [] },
    { id: 333, kind: "cocktail", emoji: "🥃", name: "아마레또 사워", base: "리큐르", abv: 14, ings: "디사론노 45ml\n레몬주스 25ml\n설탕시럽 10ml\n달걀 흰자(선택)", recipe: "재료를 드라이 셰이크 후 얼음과 다시 셰이크해 온더락 글라스에 스트레인. 체리 가니시.", note: "아몬드 향과 신맛의 조합이 반칙급. 사워 중 실패 확률 최저.", by: "익명", time: now - 2 * D, reviews: [
      { color: 6, stars: 5, text: "단골들 최애. 흰자 넣으면 완성도 확 올라감", time: now - 1 * D },
    ] },
    { id: 334, kind: "cocktail", emoji: "🍸", name: "진 피즈", base: "진", abv: 10, ings: "진 45ml\n레몬주스 25ml\n설탕시럽 15ml\n소다수 60ml", recipe: "진·레몬·시럽을 셰이크해 얼음 없이 글라스에 붓고 소다수로 채운다.", note: "톰 콜린스와 형제지만 얼음 없이 마시는 게 정석 차이점.", by: "익명", time: now - 2 * D, reviews: [] },
    { id: 335, kind: "cocktail", emoji: "🍹", name: "신데렐라", base: "논알콜", abv: 0, ings: "오렌지주스 40ml\n파인애플주스 40ml\n레몬주스 20ml\n그레나딘 5ml\n소다수(선택)", recipe: "재료를 얼음과 셰이크해 글라스에 붓고 체리로 가니시.", note: "무알콜 대표 목테일. 운전하는 손님, 임산부 손님에게 자신 있게 권하세요.", by: "익명", time: now - 1 * D, reviews: [] },
    { id: 336, kind: "cocktail", emoji: "🌿", name: "버진 모히토", base: "논알콜", abv: 0, ings: "라임 반 개\n애플민트 10장\n설탕 2티스푼\n소다수 150ml", recipe: "민트·라임·설탕을 가볍게 머들링하고 크러시드 아이스와 소다수를 채운다.", note: "럼만 뺀 모히토. 낮 영업이나 카페 겸업 바의 효자 메뉴.", by: "익명", time: now - 1 * D, reviews: [] }
  );

  /* ---------- 대량 시드 v3: 팩토리 ---------- */
  const SP = (id, emoji, name, cat, abv, price, note) =>
    ({ id, kind: "spirit", emoji, name, cat, abv, price, note, by: "익명", time: now - ((id % 90) + 1) * D, reviews: [] });
  const CT = (id, emoji, name, base, abv, ings, recipe, note) =>
    ({ id, kind: "cocktail", emoji, name, base, abv, ings, recipe, note, by: "익명", time: now - ((id % 90) + 1) * D, reviews: [] });

  SEED_SPIRITS.push(
    // ===== 위스키: 스카치 싱글몰트 =====
    SP(601, "🥃", "글렌알라키 12년", "위스키", 46, "9~12만원", "진한 셰리와 다크초콜릿. 요즘 셰리 몰트 유행의 중심."),
    SP(602, "🥃", "글렌파클라스 12년", "위스키", 43, "6~8만원", "가족 경영 증류소의 정직한 셰리. 가성비로 유명해요."),
    SP(603, "🥃", "글렌파클라스 105", "위스키", 60, "9~12만원", "캐스크 스트렝스 셰리 폭탄. 물 몇 방울과 함께 즐기세요."),
    SP(604, "🥃", "아벨라워 12년", "위스키", 40, "7~9만원", "더블 캐스크 숙성의 균형 잡힌 셰리 몰트."),
    SP(605, "🥃", "글렌고인 12년", "위스키", 43, "7~9만원", "피트를 전혀 쓰지 않는 깨끗한 하이랜드 스타일."),
    SP(606, "🥃", "크래겐모어 12년", "위스키", 40, "7~9만원", "복합적인 향의 스페이사이드 교과서. 클래식 몰트 시리즈의 한 축."),
    SP(607, "🥃", "달모어 12년", "위스키", 40, "9~12만원", "오렌지 마멀레이드와 셰리. 사슴 뿔 엠블럼이 상징."),
    SP(608, "🥃", "주라 10년", "위스키", 40, "5~7만원", "은은한 스모크와 꿀. 섬 위스키 입문으로 부담 없어요."),
    SP(609, "🥃", "클라이넬리쉬 14년", "위스키", 46, "9~12만원", "왁시한 질감으로 유명한 하이랜드 몰트. 마니아 지분율 높음."),
    SP(610, "🥃", "올드 풀트니 12년", "위스키", 40, "5~7만원", "바닷바람과 소금기. 해안 증류소의 개성."),
    SP(611, "🥃", "안녹 12년", "위스키", 40, "5~6만원", "가볍고 산뜻한 하이랜드. 식전주처럼 마시기 좋아요."),
    SP(612, "🥃", "벤로막 10년", "위스키", 43, "7~9만원", "은은한 피트가 섞인 올드 스타일 스페이사이드."),
    SP(613, "🥃", "딘스톤 12년", "위스키", 46.3, "7~9만원", "꿀과 몰트의 순한 하이랜드. 냉각여과 없이 병입."),
    SP(614, "🥃", "토마틴 12년", "위스키", 43, "5~7만원", "부드러운 과일향. 합리적 가격의 하이랜드 몰트."),
    SP(615, "🥃", "글렌킨치 12년", "위스키", 43, "6~8만원", "로우랜드의 가벼움. 꽃향과 풀내음이 산뜻해요."),
    SP(616, "🥃", "스프링뱅크 10년", "위스키", 46, "12~16만원", "캠벨타운의 자존심. 기름지고 복합적, 물량이 없어 늘 품절."),
    SP(617, "🥃", "아란 10년", "위스키", 46, "6~8만원", "시트러스와 몰트의 깔끔한 밸런스. 아란 섬의 대표."),
    SP(618, "🥃", "쿨일라 12년", "위스키", 43, "8~10만원", "아일라치고 가벼운 피트. 피트 입문 2단계로 좋아요."),
    SP(619, "🥃", "킬호만 마키어 베이", "위스키", 46, "8~10만원", "팜 증류소의 젊고 강한 피트. 어리지만 완성도가 높아요."),
    SP(620, "🥃", "발블레어 12년", "위스키", 46, "7~9만원", "사과와 바닐라의 단정한 하이랜드."),
    SP(621, "🥃", "벤리악 12년", "위스키", 46, "6~8만원", "쓰리 캐스크 숙성의 과일 폭탄. 리뉴얼 후 평가 상승."),
    SP(622, "🥃", "달위니 15년", "위스키", 43, "8~10만원", "히스 꿀의 부드러움. 스코틀랜드에서 가장 높은 증류소 중 하나."),
    SP(623, "🥃", "싱글톤 12년", "위스키", 40, "5~6만원", "부드럽고 달콤한 입문용. 마트에서 구하기 쉬운 것도 장점."),
    SP(624, "🥃", "카듀 12년", "위스키", 40, "6~8만원", "조니워커의 심장이 된 몰트. 가볍고 상냥해요."),
    SP(625, "🥃", "로얄 로크나가 12년", "위스키", 40, "6~8만원", "왕실 인증을 받은 소규모 증류소의 단정한 몰트."),
    // ===== 위스키: 블렌디드 =====
    SP(626, "🥃", "조니워커 레드", "위스키", 40, "2~3만원", "하이볼·믹싱 전용 국민 블렌디드."),
    SP(627, "🥃", "조니워커 그린 15년", "위스키", 43, "6~8만원", "몰트만 블렌딩한 블렌디드 몰트. 블랙 다음 단계로 추천."),
    SP(628, "🥃", "조니워커 골드 리저브", "위스키", 40, "6~8만원", "꿀처럼 매끄러운 질감. 하이볼로도 사치스럽게."),
    SP(629, "🥃", "조니워커 블루", "위스키", 40, "25~35만원", "블렌디드의 정점. 접대·기념일 지명주."),
    SP(630, "🥃", "로얄 살루트 21년", "위스키", 40, "20~28만원", "도자기 병의 품격. 한국 선물 시장의 전설."),
    SP(631, "🥃", "발렌타인 파이니스트", "위스키", 40, "2~3만원", "부담 없는 국민 블렌디드. 하이볼 베이스로 무난."),
    SP(632, "🥃", "듀어스 12년", "위스키", 40, "3~4만원", "더블 에이징의 부드러움. 스카치 하이볼 가성비."),
    SP(633, "🥃", "커티삭", "위스키", 40, "2~3만원", "돛단배 라벨의 가벼운 블렌디드. 칵테일 베이스로 설계된 술."),
    SP(634, "🥃", "페이머스 그라우스", "위스키", 40, "2~3만원", "스코틀랜드 자국 판매 1위 단골. 편안한 데일리."),
    SP(635, "🥃", "몽키 숄더", "위스키", 40, "4~5만원", "몰트 100% 블렌디드. 칵테일 하라고 만든 술이라 바 필수템."),
    SP(636, "🥃", "화이트 호스", "위스키", 40, "2~3만원", "은은한 피트가 있는 저가 블렌디드. 하이볼에 개성 한 스푼."),
    // ===== 위스키: 아이리시 =====
    SP(637, "🥃", "부시밀즈 오리지널", "위스키", 40, "3~4만원", "세계에서 가장 오래된 면허 증류소의 기본 병."),
    SP(638, "🥃", "부시밀즈 블랙부쉬", "위스키", 40, "4~5만원", "셰리 숙성 비율이 높은 아이리시. 달콤 부드러움."),
    SP(639, "🥃", "레드브레스트 12년", "위스키", 40, "8~10만원", "싱글 팟스틸 아이리시의 정점. 과일과 향신료의 조화."),
    SP(640, "🥃", "그린 스팟", "위스키", 40, "7~9만원", "팟스틸 특유의 크리미함. 아이리시 마니아 지명주."),
    SP(641, "🥃", "털러모어 듀", "위스키", 40, "3~4만원", "3회 증류 3종 블렌딩. 순하고 친절한 아이리시."),
    SP(642, "🥃", "틸링 스몰배치", "위스키", 46, "5~7만원", "럼 캐스크 피니시의 모던 아이리시. 새 세대 더블린 위스키."),
    // ===== 위스키: 아메리칸/캐나디안 =====
    SP(643, "🥃", "놉 크릭", "위스키", 50, "5~7만원", "9년 숙성 고도수 버번. 올드 패션드가 무거워집니다."),
    SP(644, "🥃", "포 로지스", "위스키", 40, "3~4만원", "꽃향기 나는 버번. 라벨만큼 향도 장미."),
    SP(645, "🥃", "포 로지스 스몰배치", "위스키", 45, "5~6만원", "4가지 레시피 블렌딩. 밸런스형 버번의 모범."),
    SP(646, "🥃", "에반 윌리엄스 블랙", "위스키", 43, "2~3만원", "버번 가성비의 왕. 하이볼·칵테일 부담 제로."),
    SP(647, "🥃", "엘라이자 크레이그 스몰배치", "위스키", 47, "5~6만원", "버번의 아버지 이름을 딴 술. 바닐라·오크의 정석."),
    SP(648, "🥃", "젠틀맨 잭", "위스키", 40, "4~6만원", "차콜 멜로잉을 두 번 거친 잭다니엘의 부드러운 형."),
    SP(649, "🥃", "잭 다니엘 싱글배럴", "위스키", 45, "6~8만원", "배럴 하나에서 나온 잭다니엘. 병마다 개성이 달라요."),
    SP(650, "🥃", "잭 다니엘 테네시 허니", "위스키", 35, "3~4만원", "꿀 리큐르 블렌드. 샷·하이볼로 여성 손님 반응 좋아요."),
    SP(651, "🥃", "리튼하우스 라이", "위스키", 50, "4~6만원", "칵테일용 라이의 표준. 맨해튼·사제락 필수."),
    SP(652, "🥃", "불렛 라이", "위스키", 45, "4~6만원", "라이 95% 매시빌의 스파이시함."),
    SP(653, "🥃", "크라운 로얄", "위스키", 40, "4~5만원", "보라색 주머니의 캐나디안 위스키. 부드러움의 대명사."),
    SP(654, "🥃", "캐나디안 클럽", "위스키", 40, "2~3만원", "가볍고 순한 캐나디안. 진저에일과 클래식 조합."),
    // ===== 위스키: 재패니즈/월드 =====
    SP(655, "🥃", "산토리 토키", "위스키", 43, "4~5만원", "하이볼 전용으로 설계된 블렌디드. 청량한 사과향."),
    SP(656, "🥃", "니카 요이치", "위스키", 45, "10~14만원", "석탄 직화 증류의 스모키함. 일본의 아일라라 불려요."),
    SP(657, "🥃", "니카 미야기쿄", "위스키", 45, "10~14만원", "요이치와 반대로 부드럽고 화사한 과일향."),
    SP(658, "🥃", "카발란 클래식", "위스키", 40, "8~11만원", "대만 열대 숙성의 속성 몰트. 망고 같은 과일향."),
    SP(659, "🥃", "카발란 콘서트마스터", "위스키", 40, "7~9만원", "포트 캐스크 피니시의 달콤한 대만 몰트."),
    SP(660, "🥃", "암룻 퓨전", "위스키", 50, "9~12만원", "인도 위스키의 반란. 보리 두 종을 섞은 진한 몰트."),
    // ===== 진 =====
    SP(661, "🍸", "탱커레이", "진", 47.3, "2~3만원", "4가지 보태니컬의 드라이 진 표준. 초록 병의 클래식."),
    SP(662, "🍸", "비피터", "진", 40, "2~3만원", "런던 드라이의 교과서. 주니퍼 존재감이 뚜렷해요."),
    SP(663, "🍸", "고든스", "진", 37.5, "1~2만원", "진토닉 대량 영업의 친구. 세계에서 가장 많이 팔린 진."),
    SP(664, "🍸", "플리머스 진", "진", 41.2, "4~5만원", "런던 드라이보다 부드럽고 흙내음. 마티니 애호가 지명주."),
    SP(665, "🍸", "시타델", "진", 44, "3~4만원", "프랑스식 화사함. 19가지 보태니컬의 꽃향."),
    SP(666, "🍸", "진 마레", "진", 42.7, "5~7만원", "올리브·로즈마리·타임. 지중해 허브 정원 같은 진."),
    SP(667, "🍸", "더 보타니스트", "진", 46, "5~7만원", "아일라 섬 채집 허브 22종. 브루클라디 증류소 작품."),
    SP(668, "🍸", "시프스미스", "진", 41.6, "4~6만원", "런던 크래프트 진 부활의 주역. 단정한 클래식 스타일."),
    SP(669, "🍸", "키 노 비", "진", 45.7, "6~8만원", "교토 진. 유자·산초·녹차의 일본식 보태니컬."),
    SP(670, "🍸", "헤이먼스 올드 톰", "진", 41.4, "4~5만원", "살짝 달콤한 올드 톰 스타일. 마티네즈·톰 콜린스의 원형."),
    SP(671, "🍸", "브록만스", "진", 40, "5~6만원", "블루베리 뉘앙스의 부드러운 진. 진 싫다는 손님 공략용."),
    SP(672, "🍸", "부들스", "진", 40, "3~4만원", "허브 중심의 단정한 런던 드라이."),
    // ===== 럼 =====
    SP(673, "🍹", "마이어스 다크", "럼", 40, "3~4만원", "자메이카 다크 럼의 기준. 펀치·티키에 필수."),
    SP(674, "🍹", "캡틴 모건 스파이스드", "럼", 35, "2~3만원", "바닐라·시나몬 스파이스드 럼. 콜라와 국민 조합."),
    SP(675, "🍹", "플랜터레이 3 스타", "럼", 41.2, "3~4만원", "세 산지 블렌딩 화이트 럼. 다이키리 실력이 올라가요."),
    SP(676, "🍹", "플랜터레이 XO", "럼", 40, "6~8만원", "더블 숙성의 디저트 같은 다크 럼."),
    SP(677, "🍹", "론 자카파 23", "럼", 40, "9~12만원", "솔레라 숙성 과테말라 럼. 럼계의 꼬냑."),
    SP(678, "🍹", "아프렐턴 에스테이트 시그니처", "럼", 40, "3~4만원", "자메이카 푼처 특유의 잘 익은 바나나향."),
    SP(679, "🍹", "엘도라도 12년", "럼", 40, "6~8만원", "데메라라 설탕의 깊은 단맛. 니트로 즐기는 럼."),
    SP(680, "🍹", "크라켄 블랙 스파이스드", "럼", 40, "3~4만원", "문어 라벨의 진한 스파이스드. 다크앤스토미 강추."),
    SP(681, "🍹", "고슬링 블랙 씰", "럼", 40, "3~4만원", "다크앤스토미의 공식 럼. 버뮤다의 자존심."),
    SP(682, "🍹", "세일러 제리", "럼", 40, "2~3만원", "타투 아트 라벨의 스파이스드 럼. 도수 대비 순한 맛."),
    SP(683, "🍹", "바카디 8년", "럼", 40, "4~5만원", "바카디의 숙성 라인. 온더락부터 올드패션드 트위스트까지."),
    // ===== 보드카 =====
    SP(684, "🍸", "스미노프 No.21", "보드카", 37.5, "1~2만원", "세계 판매량 최상위 보드카. 믹싱의 기본기."),
    SP(685, "🍸", "벨루가 노블", "보드카", 40, "5~7만원", "몰트 스피릿 기반의 러시아 프리미엄. 크리미한 질감."),
    SP(686, "🍸", "시락", "보드카", 40, "5~6만원", "포도로 만든 보드카. 힙합 신의 아이콘."),
    SP(687, "🍸", "케틀 원", "보드카", 40, "3~4만원", "300년 네덜란드 증류 가문의 클린 보드카. 마티니 단골."),
    SP(688, "🍸", "스톨리치나야", "보드카", 40, "2~3만원", "클래식 러시안 스타일의 표준."),
    SP(689, "🍸", "핀란디아", "보드카", 40, "2~3만원", "빙하수로 만든 북유럽 보드카. 깔끔 그 자체."),
    SP(690, "🍸", "벨베디어", "보드카", 40, "5~7만원", "폴란드 호밀 보드카. 후추 같은 피니시가 특징."),
    // ===== 데킬라/메즈칼 =====
    SP(691, "🥃", "패트론 실버", "데킬라", 40, "7~9만원", "프리미엄 데킬라 대중화의 주역. 깨끗한 아가베."),
    SP(692, "🥃", "1800 블랑코", "데킬라", 40, "4~5만원", "100% 아가베 가성비. 마르가리타 업그레이드용."),
    SP(693, "🥃", "올메카 블랑코", "데킬라", 38, "2~3만원", "슈터·믹싱용 보급형 데킬라."),
    SP(694, "🥃", "카사미고스 블랑코", "데킬라", 40, "9~12만원", "조지 클루니가 만든 부드러운 데킬라. 바닐라 뉘앙스."),
    SP(695, "🥃", "델 마게이 비다", "데킬라", 42, "6~8만원", "메즈칼 입문 표준. 장작 스모크가 매력."),
    SP(696, "🥃", "몬테 알반 메즈칼", "데킬라", 40, "4~5만원", "병 속 애벌레로 유명한 메즈칼. 화제성 갑."),
    SP(697, "🥃", "시에라 데킬라", "데킬라", 38, "2~3만원", "빨간 모자 캡의 파티 데킬라."),
    // ===== 리큐르 =====
    SP(698, "🍊", "그랑 마니에", "리큐르", 40, "5~6만원", "꼬냑 베이스 오렌지 리큐르. 마르가리타가 고급이 됩니다."),
    SP(699, "🍊", "볼스 트리플 섹", "리큐르", 38, "1~2만원", "가성비 오렌지 리큐르. 대량 영업의 친구."),
    SP(700, "🍑", "피치트리", "리큐르", 20, "2~3만원", "복숭아 리큐르의 대명사. 피치 크러시·섹스온더비치 필수."),
    SP(701, "🌊", "볼스 블루 큐라소", "리큐르", 21, "1~2만원", "파란 칵테일은 다 이 병에서. 블루 하와이·블루 레몬에이드."),
    SP(702, "🍇", "크렘 드 카시스", "리큐르", 20, "2~3만원", "블랙커런트 리큐르. 키르·브램블·엘 디아블로의 핵심."),
    SP(703, "🍒", "체리 히어링", "리큐르", 24, "3~4만원", "덴마크 체리 리큐르. 싱가포르 슬링의 필수품."),
    SP(704, "🍒", "룩사르도 마라스키노", "리큐르", 32, "4~5만원", "마라스카 체리 리큐르. 아비에이션·라스트워드·헤밍웨이 다이키리."),
    SP(705, "🌿", "샤르트뢰즈 그린", "리큐르", 55, "8~11만원", "수도사 130가지 허브 비법. 라스트 워드의 심장."),
    SP(706, "🌿", "샤르트뢰즈 옐로우", "리큐르", 43, "8~10만원", "그린보다 달고 순한 버전. 꿀·사프란 뉘앙스."),
    SP(707, "🌿", "베네딕틴 DOM", "리큐르", 40, "4~6만원", "27가지 허브와 꿀. 싱가포르 슬링·비앤비."),
    SP(708, "🥃", "드람뷔이", "리큐르", 40, "4~6만원", "스카치+헤더 꿀 리큐르. 러스티 네일 한 잔이면 설명 끝."),
    SP(709, "🦌", "예거마이스터", "리큐르", 35, "3~4만원", "56가지 허브의 독일 리큐르. 예거밤으로 클럽 필수."),
    SP(710, "🌿", "페르노 압생트", "리큐르", 68, "7~9만원", "아니스 향의 초록 요정. 사제락 린스로 한 방울씩."),
    SP(711, "⭐", "몰리나리 삼부카", "리큐르", 42, "3~4만원", "아니스 리큐르. 커피콩 3알 띄워 불붙이는 세리머니로 유명."),
    SP(712, "🍋", "리몬첼로", "리큐르", 28, "2~3만원", "이탈리아 레몬 리큐르. 식후 냉동실 샷이 정석."),
    SP(713, "🍈", "파쇼아", "리큐르", 17, "1~2만원", "패션프루트 리큐르. 열대 칵테일 응용 무한."),
    SP(714, "🌸", "생제르맹", "리큐르", 20, "5~6만원", "엘더플라워 리큐르. 휴고 스프리츠·프렌치 구스베리."),
    SP(715, "🌼", "갈리아노", "리큐르", 42.3, "4~5만원", "길쭉한 병의 바닐라·허브 리큐르. 하비 월뱅어의 주인공."),
    SP(716, "🌰", "프란젤리코", "리큐르", 20, "3~4만원", "수도사 병 모양 헤이즐넛 리큐르. 커피 칵테일과 찰떡."),
    SP(717, "🌿", "볼스 크렘 드 멘트 그린", "리큐르", 24, "1~2만원", "민트 리큐르. 그래스호퍼·스팅어용."),
    SP(718, "🍫", "볼스 크렘 드 카카오", "리큐르", 24, "1~2만원", "초콜릿 리큐르. 알렉산더 계열 필수."),
    SP(719, "🍌", "볼스 크렘 드 바나나", "리큐르", 17, "1~2만원", "바나나 리큐르. 준벅의 숨은 주역."),
    SP(720, "🍯", "아이리시 미스트", "리큐르", 35, "3~4만원", "아이리시 위스키+꿀+허브. 뜨거운 물만 부어도 완성."),
    // ===== 베르무트/아페리티프 (와인) =====
    SP(721, "🍷", "마티니 로쏘", "와인", 15, "1~2만원", "스위트 베르무트 표준. 맨해튼·네그로니 기본."),
    SP(722, "🍷", "마티니 엑스트라 드라이", "와인", 15, "1~2만원", "드라이 베르무트 표준. 마티니의 반쪽."),
    SP(723, "🍷", "마티니 비앙코", "와인", 15, "1~2만원", "달콤한 화이트 베르무트. 토닉만 부어도 한 잔."),
    SP(724, "🍷", "돌린 드라이", "와인", 17.5, "2~3만원", "샹베리 AOC 베르무트. 마티니가 우아해집니다."),
    SP(725, "🍷", "카르파노 안티카 포뮬라", "와인", 16.5, "4~6만원", "스위트 베르무트의 끝판왕. 바닐라 뉘앙스."),
    SP(726, "🍷", "릴레 블랑", "와인", 17, "3~4만원", "보르도 아페리티프 와인. 베스퍼 마티니의 비밀."),
    SP(727, "🥂", "모엣 & 샹동 임페리얼", "와인", 12, "6~8만원", "샴페인의 대명사. 미모사·프렌치75 베이스로도."),
    SP(728, "🥂", "뵈브 클리코 옐로우 라벨", "와인", 12, "7~9만원", "노란 라벨의 아이콘. 축하주 지명 1순위."),
    SP(729, "🥂", "미오네토 프로세코", "와인", 11, "2~3만원", "스프리츠용 프로세코 가성비."),
    // ===== 브랜디 =====
    SP(730, "🍾", "레미 마틴 VSOP", "브랜디", 40, "8~10만원", "파인 샴페인 꼬냑의 표준. 사이드카가 달라져요."),
    SP(731, "🍾", "마르텔 VS", "브랜디", 40, "5~7만원", "300년 역사의 입문 꼬냑."),
    SP(732, "🍾", "꾸르부아지에 VS", "브랜디", 40, "5~7만원", "나폴레옹의 꼬냑이라는 별명. 부드러운 과일향."),
    SP(733, "🍎", "불라르 칼바도스 VSOP", "브랜디", 40, "5~7만원", "노르망디 사과 브랜디. 애플 잭 칵테일에."),
    SP(734, "🍾", "생 레미 VSOP", "브랜디", 40, "2~3만원", "프렌치 브랜디 가성비. 믹싱용으로 충분."),
    // ===== 전통주/사케/기타 =====
    SP(735, "🍶", "일품진로", "전통주", 25, "1~2만원", "오크 숙성 증류식 소주. 위스키 애호가도 인정."),
    SP(736, "🍶", "화요 25", "전통주", 25, "1~2만원", "화요의 데일리 라인. 하이볼 베이스로 인기."),
    SP(737, "🍶", "서울의 밤", "전통주", 25, "1~2만원", "매실 증류원액의 은은한 향. 병 디자인도 예뻐 선물용."),
    SP(738, "🍶", "이강주", "전통주", 25, "2~3만원", "배·생강·울금이 들어간 조선 3대 명주."),
    SP(739, "🍶", "감홍로", "전통주", 40, "3~4만원", "관서 지방의 붉은 명주. 계피·용안육의 한방 향."),
    SP(740, "🍶", "죽력고", "전통주", 32, "3~4만원", "대나무 진액으로 내린 전통 증류주."),
    SP(741, "🍶", "한산소곡주", "전통주", 18, "1~2만원", "앉은뱅이 술이라는 별명의 달콤한 명주."),
    SP(742, "🍶", "문배주", "전통주", 40, "2~3만원", "좁쌀·수수로 빚는 중요무형문화재 증류주."),
    SP(743, "🍶", "닷사이 45", "기타", 16, "3~4만원", "준마이다이긴조 입문 사케. 화사한 쌀 향."),
    SP(744, "🍶", "쿠보타 센주", "기타", 15, "3~4만원", "깔끔한 니가타 스타일 사케. 식중주로 좋아요."),
    SP(745, "🍺", "기네스 드래프트", "기타", 4.2, "4~6천원", "질소 크림 거품의 스타우트. 블랙 벨벳 칵테일 재료로도."),
    SP(746, "🍶", "진로 이즈백", "기타", 16, "2~3천원", "레트로 두꺼비 소주. 소주 칵테일 베이스."),
    SP(747, "🍋", "앙고스투라 비터", "기타", 44.7, "2~3만원", "칵테일의 소금·후추. 몇 방울로 완성도가 달라져요."),
    SP(748, "🍊", "앙고스투라 오렌지 비터", "기타", 28, "2~3만원", "마티니·올드패션드에 오렌지 향 한 끗."),
    SP(749, "🍑", "페이쇼드 비터", "기타", 35, "2~3만원", "뉴올리언스의 비터. 사제락 필수품.")
  );

  SEED_SPIRITS.push(
    // ===== 칵테일 대량 추가: 진 베이스 =====
    CT(401, "🍸", "아비에이션", "진", 20, "진 45ml\n마라스키노 15ml\n크렘 드 바이올렛 7.5ml\n레몬주스 15ml", "재료를 셰이크해 쿠페에 스트레인. 체리 가니시.", "하늘색 빛깔의 클래식. 바이올렛이 없으면 빼고 만들어도 돼요."),
    CT(402, "🍸", "라스트 워드", "진", 24, "진 22.5ml\n그린 샤르트뢰즈 22.5ml\n마라스키노 22.5ml\n라임주스 22.5ml", "네 재료를 동량으로 셰이크해 쿠페에 더블 스트레인.", "1:1:1:1의 완벽한 균형. 금주법 시대에서 부활한 명작."),
    CT(403, "🍇", "브램블", "진", 18, "진 50ml\n레몬주스 25ml\n설탕시럽 12.5ml\n크렘 드 카시스 15ml", "진·레몬·시럽을 크러시드 아이스 위에 붓고 카시스를 위에 드리즐.", "보라색 그라데이션이 시그니처. 블랙베리 가니시가 정석."),
    CT(404, "🍸", "클로버 클럽", "진", 17, "진 45ml\n라즈베리 시럽 15ml\n레몬주스 15ml\n달걀 흰자 1개분", "드라이 셰이크 후 얼음과 다시 셰이크. 쿠페에 스트레인.", "분홍 거품이 사랑스러운 클래식. 흰자 셰이킹 연습에 최적."),
    CT(405, "🌿", "진 바질 스매시", "진", 18, "진 50ml\n레몬주스 25ml\n설탕시럽 15ml\n바질잎 8장", "바질을 가볍게 머들링 후 재료와 셰이크, 얼음 위에 더블 스트레인.", "2008년생 모던 클래식. 초록 향이 폭발합니다."),
    CT(406, "🌿", "사우스사이드", "진", 18, "진 50ml\n라임주스 25ml\n설탕시럽 15ml\n민트잎 8장", "재료를 셰이크해 쿠페에 더블 스트레인. 민트잎 가니시.", "진으로 만드는 모히토 느낌. 시카고 갱단이 마셨다는 전설."),
    CT(407, "🍸", "베스퍼", "진", 30, "진 45ml\n보드카 15ml\n릴레 블랑 7.5ml", "얼음과 함께 셰이크(원작 기준)해 쿠페에 스트레인. 레몬 필.", "007이 주문한 그 마티니. '젓지 말고 흔들어서'."),
    CT(408, "🧅", "깁슨", "진", 28, "진 60ml\n드라이 베르무트 10ml\n칵테일 어니언 1개", "스터 후 마티니 글라스에 스트레인, 어니언으로 가니시.", "올리브 대신 양파 하나로 마티니가 다른 술이 됩니다."),
    CT(409, "🍸", "마티네즈", "진", 26, "진 45ml\n스위트 베르무트 45ml\n마라스키노 7.5ml\n앙고스투라 1대시", "스터 후 쿠페에 스트레인. 레몬 필 가니시.", "마티니의 조상님. 올드 톰 진으로 만들면 더 정통."),
    CT(410, "🍸", "화이트 레이디", "진", 22, "진 40ml\n코인트로 30ml\n레몬주스 20ml", "재료를 셰이크해 쿠페에 스트레인.", "사이드카의 진 버전. 깔끔한 시트러스 클래식."),
    CT(411, "🍒", "싱가포르 슬링", "진", 14, "진 30ml\n체리 히어링 15ml\n베네딕틴 7.5ml\n그레나딘 7.5ml\n파인애플주스 120ml\n라임주스 15ml\n앙고스투라 1대시", "재료를 셰이크해 얼음 채운 하이볼에 붓고 체리·파인애플 가니시.", "래플스 호텔의 유산. 재료는 많지만 그만한 가치가 있어요."),
    CT(412, "🍋", "진 리키", "진", 12, "진 45ml\n라임주스 15ml\n소다수 90ml", "얼음 채운 하이볼에 진·라임을 넣고 소다수로 채운다.", "설탕 없는 드라이 청량함. 여름 무더위 특효약."),
    CT(413, "🌿", "행키 팽키", "진", 26, "진 45ml\n스위트 베르무트 45ml\n페르넷 브랑카 2대시", "스터 후 쿠페에 스트레인. 오렌지 필.", "사보이 호텔 최초 여성 수석 바텐더 에이다 콜먼의 유산."),
    CT(414, "🍯", "비스 니즈", "진", 20, "진 60ml\n꿀시럽 20ml\n레몬주스 20ml", "꿀시럽을 미리 만들어 재료와 셰이크, 쿠페에 스트레인.", "금주법 시대에 밀주 냄새를 꿀로 가리던 술. 지금은 그냥 맛있어서 마셔요."),
    // ===== 럼 베이스 =====
    CT(415, "🍹", "헤밍웨이 다이키리", "럼", 20, "화이트 럼 60ml\n자몽주스 15ml\n마라스키노 7.5ml\n라임주스 20ml", "재료를 셰이크해 쿠페에 더블 스트레인.", "설탕 대신 마라스키노. 헤밍웨이가 더블로 마셔 '파파 도블레'."),
    CT(416, "⛈️", "다크 앤 스토미", "럼", 11, "다크 럼 60ml\n진저비어 100ml\n라임주스 10ml", "얼음 채운 하이볼에 진저비어를 먼저, 다크 럼을 위에 띄운다.", "폭풍우 구름 같은 럼 층이 포인트. 고슬링 럼이 정석."),
    CT(417, "🍹", "플랜터스 펀치", "럼", 16, "다크 럼 45ml\n라임주스 20ml\n설탕시럽 15ml\n앙고스투라 2대시\n소다수(선택)", "재료를 셰이크해 크러시드 아이스 위에 붓고 넛맥·과일 가니시.", "자메이카 농장주의 펀치. 비율 조절 자유로운 티키의 원형."),
    CT(418, "🧟", "좀비", "럼", 25, "화이트 럼 30ml\n골드 럼 30ml\n오버프루프 럼 15ml\n라임주스 20ml\n자몽주스 15ml\n그레나딘 5ml\n앙고스투라 1대시", "재료를 크러시드 아이스와 블렌딩하거나 셰이크. 민트 가니시.", "티키의 전설. 도수가 흉기라 1인 2잔 제한이 원칙이었대요."),
    CT(419, "🏝️", "페인킬러", "럼", 13, "다크 럼 45ml\n파인애플주스 60ml\n오렌지주스 30ml\n코코넛 크림 15ml\n넛맥", "재료를 셰이크해 얼음 위에 붓고 넛맥을 갈아 올린다.", "영국령 버진아일랜드의 국민 칵테일. 피나 콜라다의 사촌."),
    CT(420, "🎩", "엘 프레지덴테", "럼", 22, "화이트 럼 45ml\n드라이 베르무트 22.5ml\n오렌지 큐라소 7.5ml\n그레나딘 1티스푼", "스터 후 쿠페에 스트레인. 오렌지 필.", "쿠바 대통령의 이름을 딴 우아한 럼 마티니."),
    CT(421, "🔥", "핫 버터드 럼", "럼", 12, "다크 럼 45ml\n버터 1조각\n황설탕 1티스푼\n뜨거운 물 120ml\n시나몬", "머그에 버터·설탕을 녹이고 럼과 뜨거운 물을 부어 젓는다.", "겨울 한정 메뉴의 왕. 몸이 녹는 마법."),
    // ===== 위스키 베이스 =====
    CT(422, "🥃", "사제락", "위스키", 32, "라이 위스키 60ml\n압생트(린스)\n각설탕 1개\n페이쇼드 비터 3대시", "글라스를 압생트로 린스하고, 설탕·비터·위스키를 스터해 붓는다. 레몬 필.", "뉴올리언스 공식 칵테일. 압생트 린스가 영혼입니다."),
    CT(423, "🥃", "불바디에", "위스키", 28, "버번 45ml\n캄파리 22.5ml\n스위트 베르무트 22.5ml", "온더락 글라스에 얼음과 함께 스터. 오렌지 필.", "네그로니의 위스키 버전. 가을·겨울 네그로니라 불려요."),
    CT(424, "🌿", "민트 줄렙", "위스키", 22, "버번 60ml\n민트잎 10장\n설탕시럽 10ml", "민트와 시럽을 가볍게 머들링, 크러시드 아이스와 버번을 넣고 스터. 민트 부케 가니시.", "켄터키 더비의 공식 음료. 은잔에 서리가 맺히면 완성."),
    CT(425, "🍋", "위스키 스매시", "위스키", 20, "버번 50ml\n레몬 웨지 3개\n민트잎 8장\n설탕시럽 15ml", "레몬·민트·시럽을 머들링 후 버번과 셰이크, 얼음 위에 스트레인.", "줄렙과 사워의 중간. 위스키 초보 손님 공략 1순위."),
    CT(426, "🥃", "러스티 네일", "위스키", 32, "스카치 45ml\n드람뷔이 20ml", "온더락 글라스에 큰 얼음과 함께 스터.", "재료 두 개로 완성되는 스카치 클래식. 비율로 단맛 조절."),
    CT(427, "🥃", "롭 로이", "위스키", 30, "스카치 50ml\n스위트 베르무트 20ml\n앙고스투라 2대시", "스터 후 쿠페에 스트레인. 체리 가니시.", "맨해튼의 스카치 버전. 스모키한 위스키로 만들면 개성 만점."),
    CT(428, "☕", "아이리시 커피", "위스키", 10, "아이리시 위스키 40ml\n뜨거운 커피 120ml\n황설탕 2티스푼\n휘핑크림", "데운 글라스에 설탕·커피·위스키를 섞고 크림을 살짝 휘핑해 띄운다.", "크림 층 사이로 마시는 게 정석. 겨울 시그니처로 최고."),
    CT(429, "🥤", "잭콕", "위스키", 10, "잭 다니엘 45ml\n콜라 120ml\n레몬 웨지", "얼음 채운 하이볼에 잭다니엘을 붓고 콜라로 채운다.", "설명이 필요 없는 국민 믹스. 레몬 한 조각이 차이를 만들어요."),
    CT(430, "✈️", "페이퍼 플레인", "위스키", 24, "버번 22.5ml\n아페롤 22.5ml\n아마로 논니노 22.5ml\n레몬주스 22.5ml", "네 재료를 동량 셰이크해 쿠페에 스트레인.", "2008년생 모던 클래식. 라스트 워드의 위스키 후계자."),
    CT(431, "💰", "골드 러시", "위스키", 24, "버번 60ml\n꿀시럽 20ml\n레몬주스 20ml", "재료를 셰이크해 큰 얼음 위에 스트레인.", "비스 니즈의 버번 버전. 꿀+버번은 배신하지 않아요."),
    CT(432, "🥃", "올드 팔", "위스키", 26, "라이 위스키 30ml\n캄파리 30ml\n드라이 베르무트 30ml", "스터 후 쿠페에 스트레인. 레몬 필.", "불바디에의 드라이한 형제. 쌉쌀한 어른 맛."),
    // ===== 보드카 베이스 =====
    CT(433, "🍊", "스크루드라이버", "보드카", 10, "보드카 45ml\n오렌지주스 120ml", "얼음 채운 하이볼에 붓고 가볍게 스터.", "드라이버로 저어 마셨다는 유전 노동자의 술. 심플 이즈 베스트."),
    CT(434, "🫐", "케이프 코더", "보드카", 10, "보드카 45ml\n크랜베리주스 120ml\n라임 웨지", "얼음 채운 글라스에 붓고 라임을 짜 넣는다.", "크랜베리 산지 케이프코드에서 이름을 딴 기본기."),
    CT(435, "🍊", "솔티 독", "보드카", 10, "보드카 45ml\n자몽주스 120ml\n소금 리밍", "소금 리밍한 글라스에 얼음과 재료를 붓는다.", "소금 없이 만들면 그레이하운드. 리밍 하나로 이름이 바뀌어요."),
    CT(436, "🌊", "시브리즈", "보드카", 9, "보드카 45ml\n크랜베리주스 90ml\n자몽주스 30ml", "얼음 채운 하이볼에 순서대로 붓고 스터. 라임 가니시.", "바닷바람이라는 이름처럼 청량한 여름 스테디셀러."),
    CT(437, "🏝️", "베이 브리즈", "보드카", 9, "보드카 45ml\n크랜베리주스 90ml\n파인애플주스 30ml", "얼음 채운 하이볼에 붓고 가볍게 스터.", "시브리즈의 파인애플 버전. 좀 더 달콤한 휴양지 맛."),
    CT(438, "💥", "카미카제", "보드카", 25, "보드카 30ml\n트리플 섹 30ml\n라임주스 30ml", "재료를 셰이크해 샷 글라스 또는 쿠페에 스트레인.", "샷으로도 칵테일로도. 1:1:1 황금비율."),
    CT(439, "🍋", "레몬 드롭", "보드카", 20, "보드카 45ml\n트리플 섹 15ml\n레몬주스 15ml\n설탕시럽 7.5ml\n설탕 리밍", "설탕 리밍한 마티니 글라스에 셰이크한 재료를 스트레인.", "새콤달콤의 정석. 레몬 사탕을 마시는 기분."),
    CT(440, "🍏", "애플 마티니", "보드카", 20, "보드카 40ml\n사과 리큐르 20ml\n레몬주스 10ml", "재료를 셰이크해 마티니 글라스에 스트레인. 사과 슬라이스.", "2000년대를 휩쓴 초록 마티니. 지금 마셔도 맛있어요."),
    CT(441, "🍸", "프렌치 마티니", "보드카", 18, "보드카 40ml\n라즈베리 리큐르 15ml\n파인애플주스 40ml", "강하게 셰이크해 거품을 내고 마티니 글라스에 스트레인.", "파인애플 거품이 생명. 셰이킹은 아낌없이."),
    CT(442, "🥥", "치치", "보드카", 11, "보드카 45ml\n파인애플주스 80ml\n코코넛 크림 30ml", "재료를 블렌딩하거나 셰이크해 얼음 위에 붓는다.", "피나 콜라다의 보드카 버전. 럼이 싫은 손님에게."),
    CT(443, "🍸", "갓마더", "보드카", 24, "보드카 45ml\n디사론노 15ml", "온더락 글라스에 얼음과 함께 스터.", "갓파더의 보드카 버전. 아몬드 향이 더 또렷해요."),
    // ===== 데킬라 베이스 =====
    CT(444, "🍋", "토미스 마르가리타", "데킬라", 24, "데킬라 50ml\n라임주스 25ml\n아가베 시럽 15ml", "재료를 셰이크해 얼음 위에 스트레인. 소금 리밍은 선택.", "오렌지 리큐르 대신 아가베. 데킬라 본연의 맛이 살아나요."),
    CT(445, "😈", "엘 디아블로", "데킬라", 12, "데킬라 50ml\n크렘 드 카시스 15ml\n라임주스 15ml\n진저비어 90ml", "얼음 채운 하이볼에 재료를 넣고 진저비어로 채운다.", "악마라는 이름의 달콤한 유혹. 카시스+생강의 의외 조합."),
    CT(446, "🧉", "멕시칸 뮬", "데킬라", 10, "데킬라 45ml\n라임주스 10ml\n진저비어 120ml", "구리 머그에 얼음과 재료를 넣고 진저비어로 채운다.", "모스코 뮬의 데킬라 버전. 라임과 아가베의 찰떡궁합."),
    CT(447, "🧊", "프로즌 마르가리타", "데킬라", 15, "데킬라 50ml\n트리플 섹 20ml\n라임주스 25ml\n얼음 1컵", "모든 재료를 블렌더에 갈아 마르가리타 글라스에 붓는다.", "여름 한정 슬러시 버전. 블렌더 소리가 곧 주문 벨소리."),
    // ===== 리큐르/기타 베이스 =====
    CT(448, "🎂", "B-52", "리큐르", 22, "깔루아 20ml\n베일리스 20ml\n그랑 마니에 20ml", "샷 글라스에 깔루아→베일리스→그랑마니에 순으로 층을 쌓는다.", "3층 레이어드 샷의 대명사. 바 스푼 뒷면을 타고 천천히."),
    CT(449, "🦗", "그래스호퍼", "리큐르", 15, "크렘 드 멘트 그린 30ml\n크렘 드 카카오 화이트 30ml\n생크림 30ml", "재료를 강하게 셰이크해 쿠페에 스트레인.", "민트초코를 마시는 디저트 칵테일. 민초단 전용."),
    CT(450, "🍷", "아메리카노", "리큐르", 11, "캄파리 30ml\n스위트 베르무트 30ml\n소다수 90ml", "얼음 채운 글라스에 붓고 오렌지 슬라이스 가니시.", "네그로니의 순한 원형. 커피 아메리카노와는 무관해요."),
    CT(451, "🥂", "네그로니 스바글리아토", "리큐르", 12, "캄파리 30ml\n스위트 베르무트 30ml\n프로세코 60ml", "얼음 채운 글라스에 순서대로 붓고 오렌지 가니시.", "진 대신 '실수로' 프로세코를 부어 탄생. 실수가 낳은 걸작."),
    CT(452, "🌸", "휴고 스프리츠", "리큐르", 8, "생제르맹 30ml\n프로세코 90ml\n소다수 30ml\n민트·라임", "얼음 채운 와인 글라스에 순서대로 붓고 민트·라임 가니시.", "아페롤 스프리츠의 꽃향기 버전. 요즘 유럽에서 대세."),
    CT(453, "🍋", "리몬첼로 스프리츠", "리큐르", 8, "리몬첼로 45ml\n프로세코 90ml\n소다수 30ml", "얼음 채운 글라스에 붓고 레몬 슬라이스 가니시.", "이탈리아 여름을 옮겨온 맛. 낮술로 위험한 술."),
    CT(454, "🍷", "키르", "기타", 11, "드라이 화이트와인 90ml\n크렘 드 카시스 10ml", "와인 글라스에 카시스를 넣고 차가운 화이트와인을 붓는다.", "프랑스 디종 시장님의 이름을 딴 아페리티프."),
    CT(455, "🥂", "키르 로얄", "기타", 11, "샴페인 90ml\n크렘 드 카시스 10ml", "플루트에 카시스를 넣고 샴페인을 천천히 붓는다.", "키르의 샴페인 버전. 보라빛 축하주."),
    CT(456, "🍫", "브랜디 알렉산더", "기타", 18, "꼬냑 30ml\n크렘 드 카카오 30ml\n생크림 30ml\n넛맥", "재료를 셰이크해 쿠페에 스트레인, 넛맥을 갈아 올린다.", "어른의 초콜릿 밀크셰이크. 식후주의 왕."),
    CT(457, "🌿", "스팅어", "기타", 28, "꼬냑 50ml\n크렘 드 멘트 화이트 20ml", "재료를 스터 또는 셰이크해 쿠페나 크러시드 아이스에.", "꼬냑+민트의 클래식. 이름처럼 쏘는 청량감."),
    CT(458, "🐎", "호스넥", "기타", 10, "브랜디 45ml\n진저에일 120ml\n레몬 스파이럴 1개\n앙고스투라(선택)", "레몬 껍질을 나선으로 길게 깎아 글라스에 두르고 재료를 붓는다.", "말 목처럼 늘어진 레몬 스파이럴이 시그니처."),
    CT(459, "🍷", "상그리아", "기타", 9, "레드와인 500ml\n브랜디 60ml\n오렌지·레몬·사과 슬라이스\n설탕 2큰술\n소다수", "과일과 설탕을 와인·브랜디에 재워 냉장 숙성 후 소다수와 서브.", "미리 만들어두는 파티 메뉴. 하루 재우면 맛이 확 올라가요."),
    CT(460, "🔥", "뱅쇼", "기타", 10, "레드와인 500ml\n오렌지 1개\n시나몬 스틱 2개\n정향·팔각\n꿀 2큰술", "재료를 약불로 15분 데워 끓이지 않고 서브.", "겨울 시즌 메뉴 1순위. 끓이면 알콜이 다 날아가니 주의."),
    CT(461, "🍒", "셜리 템플", "논알콜", 0, "진저에일 120ml\n그레나딘 15ml\n체리·레몬", "얼음 채운 글라스에 진저에일과 그레나딘을 붓고 체리 가니시.", "아역 배우 이름을 딴 목테일의 고전. 아이 동반 손님 전용."),
    CT(462, "🌺", "하비 월뱅어", "보드카", 12, "보드카 45ml\n갈리아노 15ml\n오렌지주스 90ml", "얼음 채운 글라스에 보드카·오렌지주스를 붓고 갈리아노를 띄운다.", "스크루드라이버에 갈리아노 한 층. 70년대 디스코의 맛."),
    CT(463, "🥃", "위스키 진저", "위스키", 10, "위스키 45ml\n진저에일 120ml\n레몬 웨지", "얼음 채운 하이볼에 위스키를 붓고 진저에일로 채운다.", "하이볼 다음으로 쉬운 위스키 믹스. 생강이 위스키를 살려요."),
    CT(464, "🍑", "피치 크러시", "리큐르", 8, "피치트리 45ml\n오렌지주스 60ml\n소다수 60ml", "얼음 채운 글라스에 순서대로 붓고 가볍게 스터.", "국내 바에서 사랑받는 달콤 입문 칵테일."),
    CT(465, "🍈", "멜론 볼", "리큐르", 12, "미도리 30ml\n보드카 30ml\n오렌지주스 90ml", "얼음 채운 글라스에 붓고 멜론 볼 가니시.", "미도리+보드카+오렌지의 청량 콤보."),
    CT(466, "🌴", "블루 하와이", "럼", 14, "화이트 럼 30ml\n블루 큐라소 15ml\n파인애플주스 60ml\n레몬주스 15ml", "재료를 셰이크해 얼음 위에 붓고 파인애플·체리 가니시.", "파란 바다색 티키. 보는 순간 휴가 기분."),
    CT(467, "🍹", "블루 라군", "보드카", 12, "보드카 40ml\n블루 큐라소 20ml\n레모네이드 90ml", "얼음 채운 글라스에 붓고 레몬 슬라이스 가니시.", "파란 칵테일 입문 1호. 레모네이드로 만들어 실패가 없어요."),
    CT(468, "🥭", "마이애미 바이스", "럼", 12, "피나 콜라다 믹스 반 잔\n딸기 다이키리 믹스 반 잔", "두 프로즌 믹스를 반씩 층으로 쌓아 붓는다.", "빨강·하양 투톤의 인스타 맛집 프로즌."),
    CT(469, "🍸", "코스모 논알콜", "논알콜", 0, "크랜베리주스 60ml\n오렌지주스 30ml\n라임주스 15ml\n토닉워터 30ml", "재료를 셰이크해 마티니 글라스에 스트레인.", "분위기는 코스모, 도수는 제로. 운전 손님 배려 메뉴."),
    CT(470, "🍯", "핫 토디", "위스키", 10, "위스키 45ml\n꿀 1큰술\n레몬주스 15ml\n뜨거운 물 120ml\n시나몬 스틱", "머그에 꿀·레몬·위스키를 넣고 뜨거운 물을 부어 젓는다.", "감기 기운 있을 때 생각나는 겨울 클래식.")
  );

  /* ---------- 위스키 대확장 v4 (유명 공식 보틀) ---------- */
  let wid = 2000;
  const W = (name, abv, price) => SEED_SPIRITS.push({ id: ++wid, kind: "spirit", emoji: "🥃", name, cat: "위스키", abv, price: price || "", note: "", by: "운영자", time: now - ((wid % 300) + 30) * D, reviews: [] });
  [
    // 스카치 싱글몰트 — 스페이사이드/하이랜드
    ["글렌피딕 15년 솔레라", 40, "8~11만원"], ["글렌피딕 18년", 40, "13~17만원"], ["글렌피딕 21년 그랑 레세르바", 40, "25~35만원"],
    ["글렌피딕 IPA 익스페리먼트", 43, "6~8만원"], ["글렌피딕 파이어 & 케인", 43, "6~8만원"],
    ["글렌리벳 파운더스 리저브", 40, "4~6만원"], ["글렌리벳 15년", 40, "8~10만원"], ["글렌리벳 18년", 40, "14~18만원"], ["글렌리벳 캡틴스 리저브", 40, "6~8만원"],
    ["맥캘란 더블캐스크 12년", 40, "11~14만원"], ["맥캘란 더블캐스크 15년", 43, "18~24만원"], ["맥캘란 셰리오크 18년", 43, "45~60만원"],
    ["발베니 14년 캐리비안 캐스크", 43, "13~17만원"], ["발베니 17년 더블우드", 43, "25~32만원"], ["발베니 21년 포트우드", 40, "40~55만원"],
    ["글렌모렌지 라산타 12년", 43, "7~9만원"], ["글렌모렌지 퀸타 루반 14년", 46, "8~10만원"], ["글렌모렌지 넥타 도르", 46, "9~12만원"], ["글렌모렌지 18년", 43, "16~20만원"], ["글렌모렌지 시그넷", 46, "28~35만원"],
    ["글렌드로낙 15년 리바이벌", 46, "12~15만원"], ["글렌드로낙 18년 알라다이스", 46, "18~24만원"], ["글렌드로낙 21년 팔러먼트", 48, "28~36만원"], ["글렌드로낙 포트우드", 46, "10~13만원"],
    ["글렌알라키 15년", 46, "13~17만원"], ["글렌알라키 10년 캐스크 스트렝스", 58, "13~17만원"], ["글렌알라키 12년 PX 셰리", 48, ""],
    ["글렌파클라스 15년", 46, "9~12만원"], ["글렌파클라스 17년", 43, "12~15만원"], ["글렌파클라스 21년", 43, "16~21만원"], ["글렌파클라스 25년", 43, "25~33만원"],
    ["아벨라워 12년 논칠필터드", 48, "8~10만원"], ["아벨라워 16년 더블캐스크", 43, "12~16만원"], ["아벨라워 아부나흐", 60, "16~22만원"],
    ["글렌고인 15년", 43, "10~13만원"], ["글렌고인 18년", 43, "16~21만원"], ["글렌고인 21년", 43, "26~34만원"],
    ["달모어 15년", 40, "14~18만원"], ["달모어 18년", 43, "30~40만원"], ["달모어 시가몰트", 44, "16~21만원"],
    ["벤리악 10년 큐리오시타스", 46, "7~9만원"], ["벤리악 21년", 46, ""], ["벤로막 15년", 43, "10~13만원"], ["벤로막 카스크 스트렝스", 58, ""],
    ["토마틴 레거시", 43, "4~5만원"], ["토마틴 18년", 46, "13~17만원"], ["글렌그란트 10년", 40, "4~6만원"], ["글렌그란트 아보랄리스", 40, ""],
    ["스페이번 10년", 40, "4~6만원"], ["글렌 엘긴 12년", 43, ""], ["모틀락 12년", 43, "9~12만원"], ["크라겔라키 13년", 46, "8~11만원"],
    ["발블레어 15년", 46, "11~14만원"], ["글렌터렛 트리플 우드", 43, ""], ["애버펠디 12년", 40, "5~7만원"], ["애버펠디 21년", 40, ""],
    ["로크로몬드 12년", 46, "5~7만원"], ["인치머린 12년", 46, "6~8만원"], ["툴리바딘 소버린", 43, "5~7만원"], ["에드라두어 10년", 40, "8~10만원"],
    ["올드 풀트니 15년", 46, "10~13만원"], ["안녹 18년", 46, ""], ["클라이넬리쉬 게임 오브 스론즈", 51.2, ""], ["로열 브라클라 12년", 46, ""],
    ["아드모어 레거시", 40, "4~6만원"], ["딘스톤 버진 오크", 46.3, "5~7만원"], ["글렌 스코시아 15년", 46, "9~12만원"], ["글렌 스코시아 빅토리아나", 54.2, ""],
    ["스프링뱅크 15년", 46, "18~25만원"], ["스프링뱅크 18년", 46, ""], ["헤이즐번 10년", 46, ""], ["롱로우 피티드", 46, "10~14만원"], ["킬커란 12년", 46, "9~12만원"],
    // 스카치 싱글몰트 — 아일라/아일랜즈
    ["아드벡 우가달", 54.2, "13~17만원"], ["아드벡 코리브레칸", 57.1, "14~18만원"], ["아드벡 안 오", 46.6, "9~11만원"], ["아드벡 위 비스티 5년", 47.4, "7~9만원"],
    ["라프로익 쿼터 캐스크", 48, "8~11만원"], ["라프로익 로어", 48, "13~17만원"], ["라프로익 셀렉트", 40, "6~8만원"],
    ["라가불린 8년", 48, "8~11만원"], ["라가불린 디스틸러스 에디션", 43, "14~18만원"],
    ["보모어 15년", 43, "11~14만원"], ["보모어 18년", 43, "18~24만원"], ["보모어 No.1", 40, "5~7만원"],
    ["브룩라디 클래식 라디", 50, "8~10만원"], ["포트 샬롯 10년", 50, "9~12만원"], ["옥토모어 (최신 에디션)", 57, "25~35만원"],
    ["쿨일라 모흐", 46, "8~10만원"], ["쿨일라 18년", 43, "16~22만원"], ["부나하벤 12년", 46.3, "8~10만원"], ["부나하벤 스튜라다르", 46.3, "6~8만원"],
    ["킬호만 사닉", 46, "8~10만원"], ["킬호만 로크 곰", 46, "9~12만원"], ["아드나호 5년", 50, ""], ["포트 엘렌 (희귀)", 55, ""],
    ["탈리스커 스톰", 45.8, "7~9만원"], ["탈리스커 10년 57° 노스", 57, "10~13만원"], ["탈리스커 18년", 45.8, "18~24만원"],
    ["하이랜드 파크 18년 바이킹 프라이드", 43, "20~26만원"], ["하이랜드 파크 카스크 스트렝스", 63, "10~14만원"],
    ["아란 셰리 캐스크", 55.8, "9~12만원"], ["아란 아마로네 캐스크 피니시", 50, "7~9만원"], ["아란 쿼터 캐스크", 56.2, ""],
    ["주라 12년", 40, "6~8만원"], ["주라 세븐 우드", 42, "8~10만원"], ["스카파 스키렌", 40, "8~10만원"], ["토버모리 12년", 46.3, ""], ["레첵 10년", 46.3, ""],
    // 스카치 블렌디드
    ["조니워커 18년", 40, "10~14만원"], ["조니워커 스윙", 40, "8~11만원"], ["발렌타인 12년", 40, "2~3만원"], ["발렌타인 21년", 40, "13~18만원"], ["발렌타인 30년", 40, "35~50만원"],
    ["시바스 리갈 18년", 40, "8~11만원"], ["시바스 리갈 미즈나라 12년", 40, "4~5만원"], ["시바스 리갈 25년", 40, "30~40만원"],
    ["듀어스 15년", 40, "5~7만원"], ["듀어스 18년", 40, "8~10만원"], ["그란츠 트리플 우드", 40, "1~2만원"], ["패스포트", 40, "1~2만원"],
    ["윈저 12년", 40, "3~4만원"], ["윈저 17년", 40, "7~9만원"], ["윈저 21년", 40, "12~16만원"], ["임페리얼 클래식 12년", 40, "3~4만원"],
    ["골든블루 사피루스", 36.5, "3~4만원"], ["스카치 블루 인터내셔널", 40, "2~3만원"], ["J&B 레어", 40, "1~2만원"], ["블랙 & 화이트", 40, "1~2만원"],
    ["나이키드 몰트", 40, "4~5만원"], ["코퍼독", 40, "4~5만원"], ["쉬글모어 스페이사이드", 40, ""],
    // 아이리시
    ["제임슨 블랙 배럴", 40, "4~6만원"], ["제임슨 캐스크메이츠 스타우트", 40, "4~5만원"], ["파워스 골드 라벨", 43.2, "4~5만원"],
    ["옐로우 스팟 12년", 46, "11~14만원"], ["레드브레스트 15년", 46, "13~17만원"], ["레드브레스트 룩스타", 40, ""],
    ["미들턴 베리 레어", 40, "25~35만원"], ["코네마라 피티드", 40, "5~7만원"], ["라이터스 티어스 코퍼팟", 40, "5~7만원"],
    ["틸링 싱글그레인", 46, "6~8만원"], ["부시밀즈 10년 싱글몰트", 40, "5~7만원"], ["부시밀즈 16년", 40, "11~14만원"],
    // 아메리칸 — 버번/테네시/라이
    ["블랜튼스 오리지널", 46.5, "13~18만원"], ["블랜튼스 골드", 51.5, "20~28만원"], ["이글 레어 10년", 45, "9~13만원"], ["웰러 스페셜 리저브", 45, "12~18만원"],
    ["E.H. 테일러 스몰배치", 50, "15~22만원"], ["사제락 라이", 45, "7~10만원"], ["스태그 주니어", 64, ""],
    ["에반 윌리엄스 싱글배럴", 43.3, "5~7만원"], ["헨리 맥켄나 10년 BIB", 50, "9~13만원"], ["엘라이자 크레이그 배럴프루프", 61, "12~16만원"],
    ["러셀즈 리저브 10년", 45, "6~8만원"], ["와일드 터키 레어브리드", 58.4, "8~11만원"], ["와일드 터키 켄터키 스피릿", 50.5, "9~12만원"], ["와일드 터키 81", 40.5, "3~4만원"],
    ["포 로지스 싱글배럴", 50, "7~9만원"], ["포 로지스 스몰배치 셀렉트", 52, "9~12만원"],
    ["놉 크릭 9년 스몰배치", 50, "5~7만원"], ["놉 크릭 라이", 50, "6~8만원"], ["놉 크릭 12년", 50, "10~13만원"],
    ["베이즐 헤이든", 40, "6~8만원"], ["부커스 (배치)", 63, "13~17만원"], ["베이커스 7년", 53.5, "9~12만원"],
    ["메이커스 46", 47, "6~8만원"], ["메이커스 마크 캐스크 스트렝스", 55, "9~12만원"],
    ["우드포드 리저브 더블 오크드", 43.2, "8~11만원"], ["우드포드 리저브 라이", 45.2, "6~8만원"],
    ["올드 포레스터 86", 43, "4~5만원"], ["올드 포레스터 1920", 57.5, "10~13만원"], ["올드 그랜드대드 114", 57, ""],
    ["미치터스 US★1 버번", 45.7, "8~10만원"], ["미치터스 US★1 라이", 42.4, "8~10만원"], ["미치터스 아메리칸", 41.7, ""],
    ["잭 다니엘 라이", 45, "4~6만원"], ["잭 다니엘 12년", 53.5, ""],
    ["불렛 10년", 45.6, "6~8만원"], ["하이 웨스트 더블 라이", 46, "7~9만원"],
    ["와일드 터키 롱브랜치", 43, "5~7만원"], ["제퍼슨스 오션", 45, "10~13만원"], ["엔젤스 엔비", 43.3, "9~12만원"],
    // 캐나디안
    ["크라운 로얄 노던 하베스트 라이", 45, "5~7만원"], ["크라운 로얄 블랙", 45, "5~6만원"], ["캐나디안 클럽 12년", 40, "3~4만원"],
    // 재패니즈
    ["야마자키 18년", 43, "80~120만원"], ["하쿠슈 12년", 43, "25~35만원"], ["하쿠슈 NV", 43, "12~16만원"],
    ["치타 싱글그레인", 43, "8~11만원"], ["히비키 21년", 43, "70~100만원"], ["히비키 블로섬 하모니", 43, ""],
    ["다케츠루 퓨어몰트", 43, "12~16만원"], ["슈퍼 니카", 43, "6~8만원"], ["니카 코페이 그레인", 45, "8~10만원"], ["니카 코페이 몰트", 45, "8~10만원"],
    ["니카 데이즈", 40, "5~7만원"], ["마르스 코마가타케", 50, ""], ["아카시 화이트오크", 40, "4~6만원"], ["이치로즈 몰트 & 그레인", 46.5, "13~18만원"],
    // 월드
    ["카발란 솔리스트 셰리", 57, "18~25만원"], ["카발란 솔리스트 버번", 57, "14~19만원"], ["카발란 디스틸러리 셀렉트", 40, "5~7만원"],
    ["폴 존 클래식", 55.2, "10~13만원"], ["폴 존 브릴리언스", 46, "7~9만원"], ["램푸르 셀렉트", 43, "8~10만원"],
    ["스타워드 노바", 41.3, "8~10만원"], ["울프번 노스랜드", 46, "8~10만원"], ["밀스톤 (네덜란드)", 46, ""], ["펜더린 마데이라", 46, "8~10만원"],
  ].forEach((w) => W(w[0], w[1], w[2]));

  /* ---------- 칵테일 대확장 v5 ---------- */
  SEED_SPIRITS.push(
    CT(801, "🍸", "더티 마티니", "진", 28, "진 60ml\n드라이 베르무트 10ml\n올리브 브라인 10ml\n올리브 3개", "믹싱글라스에 재료를 넣고 스터 후 칠링한 마티니 글라스에 스트레인.", "올리브 절임물의 짭짤함이 포인트. 브라인 양으로 '더티' 정도를 조절해요."),
    CT(802, "🍸", "브롱크스", "진", 22, "진 40ml\n스위트 베르무트 15ml\n드라이 베르무트 15ml\n오렌지주스 20ml", "재료를 셰이크해 쿠페에 스트레인.", "마티니에 오렌지주스를 더한 뉴욕 5대 자치구 칵테일."),
    CT(803, "🌸", "핑크 레이디", "진", 18, "진 45ml\n그레나딘 15ml\n레몬주스 15ml\n달걀 흰자", "드라이 셰이크 후 얼음과 다시 셰이크, 쿠페에 스트레인.", "분홍 거품의 클래식 레이디 칵테일."),
    CT(804, "🤍", "화이트 네그로니", "진", 24, "진 30ml\n릴레 블랑 30ml\n수즈(젠티안 리큐르) 30ml", "얼음과 함께 스터 후 온더락 글라스에. 레몬 필.", "캄파리 대신 수즈. 쌉쌀함이 더 허브향으로 변한 모던 트위스트."),
    CT(805, "🍋", "진 사워", "진", 20, "진 45ml\n레몬주스 25ml\n설탕시럽 15ml\n달걀 흰자(선택)", "재료를 셰이크해 온더락 글라스에 스트레인.", "사워의 원형. 흰자를 넣으면 실키한 진 플립 스타일."),
    CT(806, "🥃", "존 콜린스", "위스키", 12, "버번 45ml\n레몬주스 30ml\n설탕시럽 15ml\n소다수", "얼음 채운 콜린스 글라스에 셰이크한 재료를 붓고 소다수로 채운다.", "톰 콜린스의 위스키 버전."),
    CT(807, "🩸", "블러드 앤 샌드", "위스키", 20, "스카치 25ml\n체리 히어링 25ml\n스위트 베르무트 25ml\n오렌지주스 25ml", "동량 4종을 셰이크해 쿠페에 스트레인.", "1922년 영화 제목에서 온 스카치 클래식. 동량 배합이라 외우기 쉬워요."),
    CT(808, "🌉", "브루클린", "위스키", 28, "라이 위스키 50ml\n드라이 베르무트 20ml\n마라스키노 7.5ml\n아메르 피콘(비터) 7.5ml", "스터 후 쿠페에 스트레인.", "맨해튼의 이웃 자치구 버전. 드라이하고 어른스러운 맛."),
    CT(809, "🍋", "린치버그 레모네이드", "위스키", 10, "잭 다니엘 45ml\n트리플 섹 15ml\n레몬주스 25ml\n레몬라임 소다", "얼음 채운 글라스에 셰이크한 재료를 붓고 소다로 채운다.", "잭 다니엘 증류소 마을 이름의 상큼한 레모네이드."),
    CT(810, "🧉", "켄터키 뮬", "위스키", 10, "버번 45ml\n라임주스 10ml\n진저비어 120ml\n민트", "구리 머그에 얼음과 재료를 넣고 진저비어로 채운다.", "모스코 뮬의 버번 버전. 켄터키식 해석."),
    CT(811, "🥃", "스카치 앤 소다", "위스키", 12, "스카치 45ml\n소다수 90ml", "온더락 글라스에 얼음, 스카치, 소다수 순으로.", "가장 미니멀한 위스키 롱드링크."),
    CT(812, "🍑", "우우 (Woo Woo)", "보드카", 12, "보드카 30ml\n피치트리 30ml\n크랜베리주스 90ml", "얼음 채운 글라스에 붓고 스터.", "이름부터 신나는 파티 칵테일."),
    CT(813, "🎻", "발랄라이카", "보드카", 22, "보드카 30ml\n코인트로 30ml\n레몬주스 30ml", "동량 셰이크 후 쿠페에 스트레인.", "러시아 악기 이름의 1:1:1 사워. 사이드카의 보드카 버전."),
    CT(814, "🍅", "블러디 시저", "보드카", 12, "보드카 45ml\n클라마토 주스 120ml\n우스터·타바스코\n셀러리 솔트 리밍", "리밍한 글라스에 재료를 롤링해 붓고 셀러리 가니시.", "캐나다의 국민 해장 칵테일. 조개 육수가 비밀."),
    CT(815, "🌺", "바하마 마마", "럼", 12, "다크 럼 30ml\n코코넛 럼 30ml\n파인애플주스 60ml\n오렌지주스 30ml\n그레나딘 10ml", "재료를 셰이크해 크러시드 아이스 위에. 체리·파인애플 가니시.", "카리브해 휴양지의 대표 트로피컬."),
    CT(816, "🦂", "스콜피온", "럼", 16, "럼 30ml\n브랜디 15ml\n오렌지주스 45ml\n레몬주스 20ml\n오르쟈 10ml", "재료를 셰이크해 크러시드 아이스 위에.", "티키 볼(공유 칵테일)로도 유명한 하와이안 클래식."),
    CT(817, "🌀", "허리케인", "럼", 18, "다크 럼 30ml\n화이트 럼 30ml\n패션프루트 시럽 30ml\n레몬주스 15ml", "재료를 셰이크해 허리케인 글라스에.", "뉴올리언스 버번 스트리트의 상징."),
    CT(818, "🍹", "바카디 칵테일", "럼", 20, "바카디 화이트 럼 45ml\n라임주스 20ml\n그레나딘 10ml", "재료를 셰이크해 쿠페에 스트레인.", "1936년 법원이 '바카디 럼으로만 만들라' 판결한 유일한 칵테일."),
    CT(819, "🔤", "XYZ", "럼", 22, "럼 30ml\n코인트로 30ml\n레몬주스 30ml", "동량 셰이크 후 쿠페에.", "더 이상 없다(끝판왕)는 뜻의 이름. 럼 사이드카."),
    CT(820, "⚓", "네이비 그록", "럼", 16, "다크 럼 60ml\n라임주스 20ml\n흑설탕 시럽 15ml\n물 30ml", "재료를 저어 온더락으로.", "영국 해군 배급 럼에서 유래한 뱃사람의 술."),
    CT(821, "💥", "데킬라 슬래머", "데킬라", 15, "데킬라 30ml\n사이다(스프라이트) 30ml", "샷 글라스에 반반 붓고 냅킨으로 덮어 테이블에 탕! 친 뒤 원샷.", "거품이 솟을 때 마시는 퍼포먼스 샷."),
    CT(822, "🐂", "브레이브 불", "데킬라", 25, "데킬라 45ml\n깔루아 20ml", "온더락 글라스에 얼음과 함께 스터.", "블랙 러시안의 데킬라 버전. 커피+아가베."),
    CT(823, "🍍", "마타도르", "데킬라", 14, "데킬라 45ml\n파인애플주스 90ml\n라임주스 15ml", "재료를 셰이크해 얼음 위에.", "투우사라는 이름의 상큼 트로피컬 데킬라."),
    CT(824, "🔵", "블루 롱아일랜드", "기타", 22, "진·럼·보드카·데킬라 각 15ml\n블루 큐라소 15ml\n레몬주스 25ml\n사이다", "재료를 셰이크해 붓고 사이다로 채운다.", "롱아일랜드의 파란 버전. 도수는 똑같이 흉기니 주의."),
    CT(825, "🇫🇷", "프렌치 커넥션", "기타", 28, "꼬냑 45ml\n디사론노 15ml", "온더락 글라스에 얼음과 함께 스터.", "갓파더의 꼬냑 버전. 영화 제목에서 유래."),
    CT(826, "⛪", "비앤비 (B&B)", "기타", 35, "브랜디 30ml\n베네딕틴 30ml", "스니프터에 반반. 스터도 층도 취향대로.", "브랜디+베네딕틴. 이름 그대로의 정직한 식후주."),
    CT(827, "🌹", "잭 로즈", "기타", 22, "애플 브랜디(칼바도스) 45ml\n라임주스 20ml\n그레나딘 15ml", "재료를 셰이크해 쿠페에 스트레인.", "헤밍웨이 소설에도 나오는 사과 브랜디 클래식."),
    CT(828, "🇵🇪", "피스코 사워", "기타", 20, "피스코 60ml\n라임주스 25ml\n설탕시럽 20ml\n달걀 흰자\n앙고스투라 3방울", "드라이 셰이크 후 얼음과 재셰이크, 거품 위에 비터 점 찍기.", "페루·칠레가 서로 원조라 싸우는 국민 사워."),
    CT(829, "🥂", "샴페인 칵테일", "기타", 12, "샴페인 90ml\n앙고스투라 적신 각설탕 1개\n꼬냑 15ml(선택)", "플루트 바닥에 각설탕을 넣고 샴페인을 붓는다.", "설탕에서 올라오는 기포 기둥이 예술."),
    CT(830, "🍷", "스프리처", "기타", 8, "화이트 와인 90ml\n소다수 60ml", "와인 글라스에 얼음 없이 or 얼음과 함께.", "오스트리아식 와인 소다. 낮술의 품격."),
    CT(831, "🇪🇸", "틴토 데 베라노", "기타", 8, "레드 와인 90ml\n레몬 탄산음료 90ml", "얼음 가득한 글라스에 반반.", "스페인 사람들은 관광객에게 상그리아를, 자기들은 이걸 마셔요."),
    CT(832, "🍇", "포트 토닉", "기타", 10, "화이트 포트 60ml\n토닉워터 120ml\n레몬·민트", "얼음 채운 글라스에 붓고 가볍게 스터.", "포르투갈에서 온 요즘 유럽 대세 아페리티프."),
    CT(833, "🖤", "블랙 벨벳", "기타", 8, "기네스 흑맥주 90ml\n샴페인 90ml", "플루트에 샴페인 먼저, 기네스를 스푼 타고 살살.", "흑맥주+샴페인의 벨벳 같은 층. 빅토리아 시대 추모주."),
    CT(834, "🌶️", "미첼라다", "기타", 4, "멕시칸 라거 1병\n토마토주스 60ml\n라임주스 30ml\n핫소스·우스터\n소금 리밍", "리밍한 글라스에 재료 섞고 맥주를 부어가며.", "멕시코식 해장 맥주 칵테일."),
    CT(835, "👁️", "레드 아이", "기타", 4, "라거 맥주 120ml\n토마토주스 120ml", "차가운 글라스에 반반.", "영화 '칵테일'로 유명해진 아침 해장 맥주."),
    CT(836, "🍺", "샌디 개프", "기타", 3, "라거 맥주 150ml\n진저에일 150ml", "글라스에 반반 살살 붓기.", "맥주+진저의 영국식 반반. 낮 마시기 좋은 저도수."),
    CT(837, "💣", "예거밤", "리큐르", 11, "예거마이스터 30ml(샷)\n에너지드링크 120ml", "에너지드링크 잔에 예거 샷을 퐁당.", "클럽의 상징. 잔이 깨질 수 있으니 튼튼한 잔으로."),
    CT(838, "🍦", "머드슬라이드", "리큐르", 12, "보드카 30ml\n깔루아 30ml\n베일리스 30ml\n생크림 30ml", "재료를 얼음과 블렌딩하거나 셰이크.", "디저트 그 자체. 초코시럽 드리즐로 마무리."),
    CT(839, "🇮🇹", "가리발디", "리큐르", 8, "캄파리 45ml\n오렌지주스 120ml", "얼음 채운 글라스에 붓고 잘 저어 거품 내기.", "쥬스를 강하게 저어 '푹신하게' 만드는 게 모던 스펙."),
    CT(840, "🚗", "골든 캐딜락", "리큐르", 14, "갈리아노 30ml\n크렘 드 카카오 화이트 30ml\n생크림 30ml", "재료를 셰이크해 쿠페에.", "황금빛 크림 디저트 칵테일."),
    CT(841, "🥃", "유자 하이볼", "위스키", 8, "위스키 45ml\n유자청 20g\n탄산수 120ml", "유자청을 위스키에 잘 풀고 얼음·탄산수를 넣는다.", "한국 바 시그니처 스테디셀러. 유자청 브랜드가 맛을 좌우해요."),
    CT(842, "🍵", "얼그레이 하이볼", "위스키", 8, "얼그레이 인퓨징 위스키 45ml\n꿀시럽 10ml\n탄산수 120ml", "홍차를 우린 위스키(3시간 콜드브루)로 하이볼을 만든다.", "인퓨징만 미리 해두면 오퍼레이션 간단. 향 대비 효율 최고."),
    CT(843, "🍋", "레몬 사와", "기타", 7, "소주(증류식) 45ml\n레몬주스 20ml\n설탕시럽 10ml\n탄산수 100ml", "얼음 채운 글라스에 재료를 넣고 탄산수로 채운다.", "일본 이자카야 국민 메뉴. 한국 소주로도 충분히 맛있어요."),
    CT(844, "🍑", "우메슈 소다", "기타", 6, "매실주 60ml\n탄산수 120ml\n우메보시(선택)", "얼음 채운 글라스에 매실주, 탄산수 순으로.", "달콤한 입문용. 식전주로도 좋아요."),
    CT(845, "🍻", "소맥", "기타", 8, "소주 50ml\n맥주 150ml", "맥주잔에 소주를 먼저, 맥주를 부어 자연 믹싱. 수저 타격은 취향.", "대한민국 국민 폭탄주. 황금비율 3:7 논쟁은 여전히 진행 중.")
  );

  SEED_MEETS.push(
    { id: 501, region: "서울", title: "이태원 바 호핑 투어 🍸", date: now + 3 * D, place: "이태원역 2번 출구 집결", max: 8, joined: 5, desc: "이태원 유명 바 3곳을 도는 호핑 투어. 각자 한 잔씩, 좋은 바 공유해요.", host: "익명", hostColor: 0, isJoined: false, comments: [
      { color: 2, text: "코스 미리 알 수 있을까요?", time: now - 6 * H },
      { color: 0, text: "집결 후 공개할게요! 기대하셔도 좋아요", time: now - 5 * H },
    ] },
    { id: 502, region: "서울", title: "성수 내추럴와인 시음회 🍷", date: now + 6 * D, place: "성수동 와인샵 세미나룸", max: 10, joined: 7, desc: "내추럴와인 5종 블라인드 시음. 와인바 근무자 환영, 시음비 각자 부담입니다.", host: "익명", hostColor: 6, isJoined: false, comments: [] },
    { id: 503, region: "인천", title: "조주기능사 실기 스터디 📚", date: now + 4 * D, place: "부평 스터디카페", max: 6, joined: 3, desc: "9월 실기 대비 레시피 암기 + 시연 연습. 기물 있으신 분 환영!", host: "익명", hostColor: 3, isJoined: false, comments: [
      { color: 9, text: "필기만 붙은 상태인데 가도 되나요?", time: now - 8 * H },
    ] },
    { id: 504, region: "대구", title: "대구 바텐더 정기모임 🍻", date: now + 9 * D, place: "동성로 OO펍", max: 12, joined: 8, desc: "대구·경산 바텐더 분기 정모입니다. 신입 환영, 명함 챙겨오세요!", host: "익명", hostColor: 1, isJoined: false, comments: [] },
    { id: 505, region: "광주", title: "광주 칵테일 원데이 클래스", date: now + 12 * D, place: "동명동 카페 2층", max: 6, joined: 2, desc: "사워 3종 만들어보는 원데이 클래스. 재료비 포함, 초보 환영.", host: "익명", hostColor: 7, isJoined: false, comments: [] },
    { id: 506, region: "대전", title: "대전 홈텐딩 모임 🏠", date: now + 8 * D, place: "둔산동 파티룸", max: 8, joined: 4, desc: "각자 자신있는 칵테일 한 잔씩 만들어서 나눠 마셔요. 재료는 공동 구매!", host: "익명", hostColor: 5, isJoined: false, comments: [] }
  );

  SEED_POSTS.push(
    { id: 501, cat: "free", color: 4, nick: "익명", time: now - 2 * H, title: "조주기능사 실기 합격했어요!!", body: "3트만에 드디어 붙었습니다 ㅠㅠ 사이드카에서 계량 실수한 줄 알았는데 합격. 다들 화이팅!", likes: 8, comments: [
      { color: 1, text: "축하드려요!! 저는 다음달 시험", time: now - 100 * M },
      { color: 6, text: "3트 존버 승리 ㅋㅋ 축하합니다", time: now - 80 * M },
      { color: 9, text: "실기 팁 좀 공유해주세요", time: now - 60 * M },
    ], emoji: "🎉" },
    { id: 502, cat: "free", color: 8, nick: "익명", time: now - 3 * H, title: "보스턴 vs 코블러 셰이커", body: "여러분은 어떤 거 쓰세요? 저는 보스턴파인데 신입이 코블러 편하다고 해서 갑자기 궁금해짐", likes: 3, comments: [
      { color: 5, text: "영업은 보스턴, 연습은 코블러요", time: now - 150 * M },
      { color: 2, text: "코블러 거름망 막히는 거 스트레스라 보스턴", time: now - 120 * M },
    ] },
    { id: 503, cat: "free", color: 0, nick: "익명", time: now - 7 * H, title: "오늘 단골손님이 케이크 사옴", body: "우리 바 1주년이라고 케이크 사오셨는데 순간 울컥했다.. 이 맛에 바텐더 하는 듯", likes: 12, comments: [
      { color: 3, text: "이런 손님 진짜 소중해요 ㅠㅠ", time: now - 6 * H },
      { color: 7, text: "1주년 축하드려요!!", time: now - 5 * H },
    ], emoji: "🎂" },
    { id: 504, cat: "free", color: 6, nick: "익명", time: now - 9 * H, title: "발주 실수로 캄파리 12병 옴", body: "3병 시킨다는게 12병 시킴.. 사장님한테 말하기 전에 네그로니 프로모션 기획서부터 쓰는 중 ㅋㅋㅋ", likes: 9, comments: [
      { color: 8, text: "ㅋㅋㅋㅋ위기를 기회로", time: now - 8 * H },
      { color: 4, text: "네그로니 위크 하면 되겠네요", time: now - 7 * H },
      { color: 1, text: "스프리츠도 팔아요 여름이잖아요", time: now - 6 * H },
    ] },
    { id: 505, cat: "free", color: 2, nick: "익명", time: now - 12 * H, title: "얼음 기계 고장났을 때 꿀팁", body: "근처 편의점 각얼음 쓸어오는 것 말고 방법 있나요? 내일 아침에 기사님 오신다는데 오늘 영업이 문제", likes: 2, comments: [
      { color: 0, text: "근처 바에 SOS 쳐보세요. 은근 다 도와줌", time: now - 11 * H },
      { color: 9, text: "제빙기 커뮤니티 카페 있어요. 셀프 수리법도 나옴", time: now - 10 * H },
    ] },
    { id: 506, cat: "hot", color: 3, nick: "익명", time: now - 18 * H, title: "바텐더 월급 공개해봄 (3년차)", body: "세후 280 + 팁 평균 30. 서울 칵테일바 기준이고 주 5일 밤 근무. 다들 어느 정도 받아요?", likes: 15, comments: Array.from({ length: 28 }, (_, i) => ({ color: (i + 2) % 10, text: ["저랑 비슷하네요", "지방은 그거보다 낮아요 ㅠ", "팁 문화 부럽다", "호텔바는 더 줘요", "5년차인데 320이요"][i % 5], time: now - (1000 - i * 30) * M })), emoji: "💰" },
    { id: 507, cat: "hot", color: 9, nick: "익명", time: now - 22 * H, title: "진상 대처법 모음 (댓글로 추가해줘)", body: "1. 목소리는 낮추고 속도는 천천히 2. 동료와 아이컨택 3. 사장 콜은 빠르게. 다들 노하우 공유점", likes: 11, comments: Array.from({ length: 17 }, (_, i) => ({ color: (i + 4) % 10, text: ["물 한잔 먼저 드리면 텐션 내려가요", "CCTV 가리키면 조용해짐 ㅋㅋ", "마지막 잔은 무알콜로 슬쩍", "저장했습니다", "이건 국룰"][i % 5], time: now - (1200 - i * 40) * M })) },
    { id: 508, cat: "free", color: 5, nick: "익명", time: now - 26 * H, title: "시그니처 메뉴 이름 짓는 거 너무 어려움", body: "유자+진+얼그레이 조합인데 이름이 안 떠오름. 공모합니다. 채택되면 오시면 한 잔 쏨", likes: 6, comments: [
      { color: 7, text: "'달빛유자' 어때요", time: now - 25 * H },
      { color: 2, text: "얼그레이서울", time: now - 24 * H },
      { color: 8, text: "시트러스 가든", time: now - 23 * H },
    ], emoji: "🍋" },
    { id: 509, cat: "promo", color: 1, nick: "몰트하우스", time: now - 5 * H, title: "[수원] 위스키 시음회 참가자 모집", body: "이번 주 일요일 셰리 캐스크 특집 시음회. 5종 시음 + 안주 포함, 선착순 10명!", likes: 1, comments: [], emoji: "🥃" },
    { id: 510, cat: "promo", color: 9, nick: "바텐더마켓", time: now - 8 * H, title: "중고 기물 일괄 판매 (폐업 정리)", body: "보스턴 셰이커, 믹싱글라스, 지거 등 일괄 정리합니다. 상태 상급, 직거래 환영.", likes: 0, comments: [
      { color: 4, text: "쪽지 드렸어요!", time: now - 7 * H },
    ], emoji: "🛒" },
    { id: 511, cat: "promo", color: 0, nick: "칵테일챔피언십", time: now - 30 * H, title: "전국 바텐더 칵테일 대회 접수 시작", body: "예선 온라인 레시피 심사 → 본선 라이브 시연. 우승 상금 300만원. 접수는 이달 말까지!", likes: 4, comments: [
      { color: 6, text: "작년에 나갔는데 경험 자체가 큰 도움됐어요", time: now - 28 * H },
    ], emoji: "🏆" },
    { id: 512, cat: "free", color: 7, nick: "익명", time: now - 32 * H, title: "새벽 마감하고 보는 일출", body: "힘든데 이 순간 때문에 버티는 것 같기도. 다들 마감 후 루틴 있어요?", likes: 7, comments: [
      { color: 3, text: "국밥 먹고 자기. 국룰임", time: now - 30 * H },
      { color: 5, text: "저는 무조건 반신욕", time: now - 29 * H },
    ], emoji: "🌅" }
  );

  /* ---------- 상태 ---------- */
  const DEFAULT_USER = {
    nick: "", color: 2, points: 0, onboarded: false,
    myPostIds: [], mySpiritIds: [], favJobs: [], keywords: [], pointLog: [],
    blocked: [], hiddenPosts: [], hiddenSpirits: [],
  };
  let state = {
    user: Object.assign({}, DEFAULT_USER, store.get("user", {})),
    posts: store.get("posts", SEED_POSTS),
    spirits: store.get("spirits", SEED_SPIRITS),
    meets: store.get("meets", SEED_MEETS),
    cart: store.get("cart", []),
    orders: store.get("orders", []),
    worklog: store.get("worklog", []),
    imgCache: store.get("imgCache", {}),
    reports: store.get("reports", []),
    members: store.get("members", []),
    adminLog: store.get("adminLog", []),
    adminMode: false,
    serverReports: [],
    adminStats: null,
    adminUserList: null,
    adminUsersLoading: false,
    adminUserTimer: null,
    adminTab: "dash",
    adminUserQ: "",
    adminUserFilter: "전체",
    noti: store.get("noti", []),
    chats: store.get("chats", []),
    dark: store.get("dark", !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)),
    push: store.get("push", true),
    view: "home",
    commTab: "all",
    writeCat: "free",
    pendingImg: null,
    curPost: null,
    curSpirit: null,
    curMeet: null,
    curChat: null,
    filterRegion: "전체",
    filterJob: "전체",
    dogamKind: "spirit",
    dogamCat: "전체",
    meetRegion: "전체",
    swKind: "spirit",
    swEmoji: 0,
    swCat: null,
    swImg: null,
    mwRegion: null,
    storeCat: "전체",
    curProduct: null,
    pdQty: 1,
    wlOffset: 0,
    dogamSort: "new",
    dogamRegion: "전체",
    dogamTag: "",          // 심층 도감 태그로 좁혀보기 (예: 피트, 셰리, 하이볼)
    dogamAbv: "전체",
    dogamPrice: "전체",
    cellarTab: "tried",
    ctMult: 1,
    replyTo: null,
    editPost: null,
    finderSel: [],
    quiz: null,
    calcRows: [{ name: "", price: "", vol: "", use: "" }, { name: "", price: "", vol: "", use: "" }],
    reviewStars: 5,
    obColor: 2,
    selColor: null,
    agreeWithdraw: false,
    docFrom: "mypage",
  };
  const saveUser = () => store.set("user", state.user);
  const savePosts = () => store.set("posts", state.posts);
  const saveSpirits = () => store.set("spirits", state.spirits);
  const saveMeets = () => store.set("meets", state.meets);
  const saveNoti = () => store.set("noti", state.noti);
  const saveChats = () => store.set("chats", state.chats);

  const saveCart = () => store.set("cart", state.cart);
  const saveOrders = () => store.set("orders", state.orders);
  const saveWorklog = () => store.set("worklog", state.worklog);

  /* ---------- 사용자 필드 보강 (앱 업데이트 시) ---------- */
  state.user.cellar = state.user.cellar || { tried: [], wish: [] };
  state.user.badges = state.user.badges || [];
  state.user.myReviews = state.user.myReviews || 0;
  state.user.myComments = state.user.myComments || 0;
  state.user.lastAttend = state.user.lastAttend || "";
  state.user.attendStreak = state.user.attendStreak || 0;
  state.user.blocked = state.user.blocked || [];
  // 예전 버전은 차단 대상을 숫자로 저장했어요. 문자열 키로 옮겨둡니다.
  if (state.user.blocked.some((b) => typeof b === "number")) {
    state.user.blocked = state.user.blocked.map((b) => (typeof b === "number" ? "local:" + b : b));
    store.set("user", state.user);
  }
  state.user.hiddenPosts = state.user.hiddenPosts || [];
  state.user.hiddenSpirits = state.user.hiddenSpirits || [];

  /* ---------- 시드 병합 (앱 업데이트 시 새 데이터 추가) ---------- */
  const SEED_V = 5;
  if (store.get("seedv", 1) < SEED_V) {
    const mergeSeed = (arr, seed) => {
      const ids = new Set(arr.map((x) => x.id));
      seed.forEach((s) => { if (!ids.has(s.id)) arr.push(s); });
    };
    mergeSeed(state.posts, SEED_POSTS);
    mergeSeed(state.spirits, SEED_SPIRITS);
    mergeSeed(state.meets, SEED_MEETS);
    savePosts(); saveSpirits(); saveMeets();
    store.set("seedv", SEED_V);
  }
  localStorage.removeItem("bartalk_market");

  /* ---------- 유틸 ---------- */
  /* ---------- 전역 고유 ID ----------
   * 기기마다 따로 번호를 매기면 서버에서 충돌하므로 시간 기반 ID를 써요.
   * 숫자로 유지해야 기존 `+el.dataset.id` 코드가 그대로 동작합니다.
   * (밀리초 × 1000 + 난수 → 2255년까지 안전 정수 범위 안)
   */
  let lastId = 0;
  function newId() {
    let id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    if (id <= lastId) id = lastId + 1;   // 같은 밀리초 안에서도 항상 증가
    lastId = id;
    return id;
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // 댓글·리뷰 본문용. esc() 로 이스케이프한 뒤 :bt_xxx: 토큰만 스티커로 바꿉니다.
  // 치환되는 SVG 는 char.js 의 화이트리스트에서만 나오므로 안전해요.
  // char.js 가 없으면 그냥 이스케이프된 원문을 돌려줍니다.
  const escMsg = (s) => (window.BTChar ? window.BTChar.render(esc(s)) : esc(s));
  const has = (hay, q) => String(hay).toLowerCase().includes(String(q).toLowerCase());
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
  function fmtRel(t) {
    const diff = Date.now() - t;
    if (diff < M) return "방금 전";
    if (diff < H) return `${Math.floor(diff / M)}분 전`;
    if (diff < D) return `${Math.floor(diff / H)}시간 전`;
    if (diff < 2 * D) return "어제";
    return `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;
  }
  function fmtDate(t) {
    const d = new Date(t);
    const day = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    let s = `${d.getMonth() + 1}/${d.getDate()}(${day})`;
    if (d.getHours() || d.getMinutes()) {
      const ampm = d.getHours() < 12 ? "오전" : "오후";
      let h = d.getHours() % 12; if (h === 0) h = 12;
      s += ` ${ampm} ${h}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return s;
  }
  const fmtNum = (n) => n.toLocaleString("ko-KR");
  const avgStars = (sp) => sp.reviews.length ? sp.reviews.reduce((a, r) => a + r.stars, 0) / sp.reviews.length : 0;
  const starStr = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2000);
  }

  /* ---------- 알림/포인트 ---------- */
  function addNoti(ic, text) {
    state.noti.unshift({ ic, text, time: Date.now(), read: false });
    if (state.noti.length > 50) state.noti.length = 50;
    saveNoti();
    updateBadge();
  }
  const chatUnread = () => state.chats.reduce((a, c) => a + (c.unread || 0), 0);
  function updateBadge() {
    const n = state.noti.filter((x) => !x.read).length + chatUnread();
    const b = $("#bell-badge");
    b.hidden = n === 0;
    b.textContent = n > 9 ? "9+" : n;
  }
  function addPoints(amt, reason) {
    vibrate(12);
    state.user.points += amt;
    state.user.pointLog.unshift({ amt, reason, time: Date.now() });
    if (state.user.pointLog.length > 50) state.user.pointLog.length = 50;
    saveUser();
    toast(`+${amt}P 적립! (${reason})`);
  }
  function checkKeywords(title, body) {
    const hit = (state.user.keywords || []).find((k) => title.includes(k) || body.includes(k));
    if (hit) addNoti("🔔", `키워드 알림: '${hit}' 이(가) 포함된 새 글이 올라왔어요.`);
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
  const scrollMem = {};
  function rememberScroll(view) {
    const sa = $("#view-" + view + " .scroll-area");
    if (sa) scrollMem[view] = sa.scrollTop;
  }
  const NAV_VIEWS = ["home", "dogam", "meet", "community", "mypage"];
  function show(view, fromPop) {
    if (!fromPop && view !== state.view && view !== "onboard" && view !== "login") {
      try { history.pushState({ view }, "", "#" + view); } catch {}
    }
    state.view = view;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + view; });
    const hideNav = view === "onboard" || view === "login" ||
      (view === "doc" && (state.docFrom === "onboard" || state.docFrom === "login"));
    $("#bottom-nav").style.display = hideNav ? "none" : "";
    const navView = NAV_VIEWS.includes(view) ? view
      : { jobs: "home", alerts: "home", chat: "home", finder: "home", quiz: "home", calc: "home", pay: "home", market: "home", "market-detail": "home", cart: "home", worklog: "home", units: "home", search: "home", timer: "home", taste: "mypage", admin: "mypage", spirit: "dogam", "spirit-write": "dogam", "meet-detail": "meet", "meet-write": "meet", write: "community", post: "community", settings: "mypage", favjobs: "mypage", myposts: "mypage", orders: "mypage", cellar: "mypage", blocked: "mypage", doc: "mypage" }[view] || "home";
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === navView));
    if (view === "home") renderHome();
    if (view === "market") renderStore();
    if (view === "cart") renderCart();
    if (view === "orders") renderOrders();
    if (view === "worklog") renderWorklog();
    if (view === "units") renderUnits();
    if (view === "cellar") renderCellar();
    if (view === "taste") renderTaste();
    if (view === "admin") renderAdmin();
    if (view === "timer") { stopTimer(); timerLeft = timerSel; renderTimer(); }
    if (view === "search") setTimeout(() => $("#global-search").focus(), 50);
    // 목록 스크롤 위치 복원
    if (["community", "dogam", "meet", "market"].includes(view)) {
      const sa = $("#view-" + view + " .scroll-area");
      if (sa) requestAnimationFrame(() => { sa.scrollTop = scrollMem[view] || 0; });
    }
    if (view === "finder") renderFinder();
    if (view === "quiz") renderQuiz();
    if (view === "calc") renderCalc();
    if (view === "pay") renderPay();
    if (view === "jobs") renderJobs();
    if (view === "favjobs") renderFavJobs();
    if (view === "myposts") renderMyPosts();
    if (view === "dogam") renderDogam();
    if (view === "meet") renderMeets();
    if (view === "community") renderPosts();
    if (view === "mypage") renderMyPage();
    if (view === "settings") renderSettings();
    if (view === "alerts") renderNoti();
    if (view === "blocked") renderBlocked();
  }

  /* ---------- 온보딩 ---------- */
  function renderOnboard() {
    $("#ob-colors").innerHTML = COLORS.map((c, i) =>
      `<button class="color-dot ${i === state.obColor ? "selected" : ""}" style="background:${c}" data-i="${i}" aria-label="색상 ${i + 1}"></button>`).join("");
    $$("#ob-colors .color-dot").forEach((d) =>
      d.addEventListener("click", () => { state.obColor = +d.dataset.i; renderOnboard(); }));
    $("#ob-adult").classList.toggle("on", !!state.obAdult);
    const ok = $("#ob-nick").value.trim().length >= 1 && !!state.obAdult;
    $("#ob-start").disabled = !ok;
    $("#ob-start").classList.toggle("ready", ok);
  }
  function startApp() {
    const nick = $("#ob-nick").value.trim();
    if (!nick) return;
    const first = !state.user.nick;
    state.user.nick = nick;
    state.user.color = state.obColor;
    state.user.onboarded = true;
    saveUser();
    startSync();
    Sync.saveProfile(state.user);
    if (first) {
      addPoints(500, "가입 축하");
      addNoti("🎉", `${nick}님, 바텐톡에 오신 걸 환영해요! 가입 축하 500P를 드렸어요.`);
    }
    show("home");
    dailyAttend();
    checkMeetReminders();
  }

  /* ---------- 위스키 지역 분류 ---------- */
  const WREGION = {};
  [["스페이사이드", "글렌피딕 글렌리벳 맥캘란 발베니 글렌알라키 글렌파클라스 아벨라워 크래겐모어 크라겔라키 벤리악 벤로막 글렌그란트 스페이번 모틀락 카듀 싱글톤"],
   ["하이랜드", "글렌모렌지 달모어 글렌고인 글렌드로낙 토마틴 딘스톤 글렌터렛 애버펠디 로크로몬드 인치머린 툴리바딘 에드라두어 안녹 클라이넬리쉬 발블레어 달위니 아드모어 오반"],
   ["아일라", "아드벡 라프로익 라가불린 보모어 브룩라디 옥토모어 쿨일라 부나하벤 킬호만 아드나호"],
   ["아일랜즈", "탈리스커 아란 주라 스카파 토버모리 레첵"],
   ["캠벨타운", "스프링뱅크 헤이즐번 롱로우 킬커란"],
   ["로우랜드", "글렌킨치"],
   ["블렌디드", "조니워커 발렌타인 시바스 듀어스 커티삭 몽키 로얄 윈저 임페리얼 골든블루 스카치 J&B 나이키드 코퍼독 쉬글모어 그란츠 패스포트 화이트"],
   ["아이리시", "제임슨 부시밀즈 레드브레스트 그린 옐로우 털러모어 틸링 코네마라 라이터스 미들턴 파워스"],
   ["아메리칸", "버팔로 블랜튼스 이글 웰러 E.H. 사제락 에반 헨리 엘라이자 러셀즈 와일드 포 놉 베이즐 부커스 베이커스 메이커스 우드포드 올드 미치터스 잭 젠틀맨 불렛 하이 리튼하우스 짐빔 제퍼슨스 엔젤스 크라운 캐나디안 스태그"],
   ["재패니즈", "야마자키 히비키 하쿠슈 산토리 니카 슈퍼 다케츠루 치타 마르스 아카시 이치로즈"],
  ].forEach(([region, brands]) => brands.split(" ").forEach((b) => { WREGION[b] = region; }));
  const TWO_TOKEN_REGION = { "하이랜드 파크": "아일랜즈", "글렌 스코시아": "캠벨타운", "올드 풀트니": "하이랜드", "포트 샬롯": "아일라", "포트 엘렌": "아일라", "페이머스 그라우스": "블렌디드", "몽키 숄더": "블렌디드", "글렌 엘긴": "스페이사이드" };
  // 이름 첫 단어로 추측하는 방식(사용자가 직접 등록한 술처럼 심층 데이터가 없을 때의 대비책)
  function regionByName(name) {
    const t = String(name).split(/\s+/);
    return TWO_TOKEN_REGION[t[0] + " " + (t[1] || "")] || WREGION[t[0]] || "기타";
  }
  // 심층 도감의 type/region 을 필터 카테고리로 환산합니다.
  // 이름 추측과 달리 증류소 실제 정보를 쓰므로 오분류가 없어요.
  function regionByDeep(d) {
    const t = d.type || "", r = d.region || "";
    if (t.includes("아이리시") || r.includes("아일랜드")) return "아이리시";
    if (t.includes("재패니즈") || r.includes("일본")) return "재패니즈";
    if (t.includes("캐나디안") || r.includes("캐나다")) return "캐나디안";
    if (t.includes("버번") || t.includes("테네시") || t.includes("아메리칸") || r.includes("미국")) return "아메리칸";
    if (t.includes("블렌디드 스카치") || t.includes("블렌디드 몰트 스카치")) return "블렌디드";
    if (t.includes("스카치") || r.includes("스코틀랜드")) {
      if (r.includes("스페이사이드")) return "스페이사이드";
      if (r.includes("아일라")) return "아일라";
      if (r.includes("아일랜즈")) return "아일랜즈";
      if (r.includes("캠벨타운")) return "캠벨타운";
      if (r.includes("로우랜드")) return "로우랜드";
      if (r.includes("하이랜드")) return "하이랜드";
      return "블렌디드"; // 지역 표기가 없는 스카치는 블렌디드
    }
    return "월드";
  }
  // sp 객체를 받아 지역을 판정합니다. 심층 데이터가 있으면 그쪽이 우선이에요.
  function regionOfWhisky(sp) {
    if (sp && typeof sp === "object") {
      const d = window.WHISKY_DEEP && window.WHISKY_DEEP[sp.id];
      if (d) return regionByDeep(d);
      return regionByName(sp.name);
    }
    return regionByName(sp); // 문자열이 넘어온 예전 호출 대비
  }
  const WHISKY_REGIONS = ["전체", "스페이사이드", "하이랜드", "아일라", "아일랜즈", "캠벨타운", "로우랜드", "블렌디드", "아이리시", "아메리칸", "캐나디안", "재패니즈", "월드", "기타"];
  function parsePriceMan(price) {
    const m = String(price || "").match(/(\d+)/);
    return m ? +m[1] : null;
  }

  /* ---------- 내 술장 ---------- */
  function inCellar(kind, id) { return state.user.cellar[kind].includes(id); }
  function toggleCellar(kind, id) {
    const arr = state.user.cellar[kind];
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1);
    else {
      arr.push(id);
      toast(kind === "tried" ? "내 술장에 추가했어요. 🥃" : "위시리스트에 담았어요. ⭐");
    }
    saveUser();
    checkBadges();
  }
  function renderCellar() {
    $$("#cellar-seg .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.cellar === state.cellarTab));
    const ids = state.user.cellar[state.cellarTab];
    const list = ids.map((id) => state.spirits.find((s) => s.id === id)).filter(Boolean).reverse();
    $("#cellar-list").innerHTML = list.length
      ? list.map((sp) => `
        <div class="spirit-item" data-id="${sp.id}">
          <span class="spirit-emoji">${thumbHTML(sp)}</span>
          <div class="spirit-info">
            <div class="spirit-name">${esc(sp.name)}</div>
            <div class="spirit-meta">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스" : esc(sp.cat) + " · " + sp.abv + "%"}</div>
          </div>
          <div class="spirit-rate"><div class="stars">★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</div></div>
        </div>`).join("")
      : `<div class="empty-state">${state.cellarTab === "tried" ? "마셔본 술을 술도감에서 추가해보세요!" : "위시리스트가 비어있어요."}</div>`;
    $$("#cellar-list .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
    wireImgFallback("#cellar-list");
  }

  /* ---------- 뱃지 ---------- */
  const BADGES = [
    { id: "start", ic: "🍸", name: "첫 발걸음", desc: "바텐톡 가입", cond: () => true },
    { id: "attend7", ic: "🔥", name: "성실왕", desc: "7일 연속 출석", cond: () => state.user.attendStreak >= 7 },
    { id: "taster", ic: "👅", name: "테이스터", desc: "리뷰 10개 작성", cond: () => state.user.myReviews >= 10 },
    { id: "collector", ic: "📖", name: "도감 수집가", desc: "술/칵테일 5개 등록", cond: () => (state.user.mySpiritIds || []).length >= 5 },
    { id: "cellar20", ic: "🥃", name: "술장 부자", desc: "마셔본 술 20개", cond: () => state.user.cellar.tried.length >= 20 },
    { id: "quizking", ic: "🏆", name: "조주왕", desc: "레시피 퀴즈 만점", cond: () => !!state.user.quizPerfect },
    { id: "writer", ic: "✍️", name: "이야기꾼", desc: "게시글 5개 작성", cond: () => (state.user.myPostIds || []).length >= 5 },
    { id: "chatty", ic: "💬", name: "수다쟁이", desc: "댓글 20개 작성", cond: () => state.user.myComments >= 20 },
    { id: "social", ic: "🍻", name: "인싸 바텐더", desc: "모임 3회 참여", cond: () => state.meets.filter((m) => m.isJoined).length >= 3 },
    { id: "bighand", ic: "🛒", name: "큰손", desc: "스토어 첫 주문", cond: () => state.orders.length >= 1 },
  ];
  function checkBadges() {
    let earned = false;
    BADGES.forEach((b) => {
      if (!state.user.badges.includes(b.id) && b.cond()) {
        state.user.badges.push(b.id);
        earned = true;
        addPoints(50, `뱃지 획득: ${b.name}`);
        addNoti(b.ic, `뱃지 '${b.name}'을(를) 획득했어요! (+50P)`);
      }
    });
    if (earned) saveUser();
  }

  /* ---------- 출석 체크 ---------- */
  function dailyAttend() {
    const today = new Date().toDateString();
    if (state.user.lastAttend === today) return;
    const yesterday = new Date(Date.now() - D).toDateString();
    state.user.attendStreak = state.user.lastAttend === yesterday ? state.user.attendStreak + 1 : 1;
    state.user.lastAttend = today;
    saveUser();
    const bonus = state.user.attendStreak % 7 === 0 ? 50 : 0;
    addPoints(10 + bonus, `출석 체크 ${state.user.attendStreak}일째${bonus ? " (7일 보너스!)" : ""}`);
    checkBadges();
  }

  /* ---------- 모임 리마인더 ---------- */
  function checkMeetReminders() {
    const soon = state.meets.filter((m) =>
      m.isJoined && !m.reminded && m.date > Date.now() && m.date - Date.now() < 24 * H);
    if (!soon.length) return;
    soon.forEach((m) => {
      m.reminded = true;
      addNoti("⏰", `내일 모임이 있어요! '${m.title}' — ${fmtDate(m.date)}, ${m.place}`);
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification("바텐톡 모임 리마인더", { body: `${m.title} — ${fmtDate(m.date)}` }); } catch {}
      }
    });
    saveMeets();
  }

  /* ---------- 햅틱 ---------- */
  const vibrate = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch {} };

  /* ---------- 신고/숨기기 ---------- */
  const saveReports = () => store.set("reports", state.reports);
  const saveMembers = () => store.set("members", state.members);
  const saveAdminLog = () => store.set("adminLog", state.adminLog);
  function logAdmin(action) {
    state.adminLog.unshift({ at: Date.now(), action });
    if (state.adminLog.length > 100) state.adminLog.length = 100;
    saveAdminLog();
  }
  function fileReport(type, targetId, title, reason, mine) {
    const authorMid = authorMidOf(type, targetId, mine);
    state.reports.unshift({
      id: newId(),
      type, targetId, title, reason, authorMid, time: Date.now(), status: "접수",
    });
    if (state.reports.length > 200) state.reports.length = 200;
    const author = state.members.find((m) => m.id === authorMid);
    if (author) { author.reported = (author.reported || 0) + 1; saveMembers(); }
    saveReports();
    // 운영자가 Supabase 대시보드에서 확인할 수 있도록 서버에도 접수해요.
    const target = type === "post" ? state.posts.find((x) => x.id === targetId)
      : type === "spirit" ? state.spirits.find((x) => x.id === targetId) : null;
    Sync.saveReport(type, targetId, title, reason, target && target.authorId);
  }
  function reportPost(p) {
    openSheet("게시글 신고", ["스팸/광고", "욕설/비방", "음란물", "불법 정보", "기타"], null, (reason) => {
      state.user.hiddenPosts = state.user.hiddenPosts || [];
      if (!state.user.hiddenPosts.includes(p.id)) state.user.hiddenPosts.push(p.id);
      saveUser();
      fileReport("post", p.id, p.title, reason, !!p.mine);
      show("community");
      toast(`신고가 접수되었어요 (${reason}). 관리자 확인 후 규정에 따라 처리돼요.`);
    });
  }

  /* ---------- 사용자 차단 ---------- */
  // 익명 커뮤니티라 화면에는 닉네임이 안 보이지만, 글마다 작성자 식별자는 있어요.
  // 서버에 연결돼 있으면 실제 계정 id(uuid), 아니면 기기 안에서만 쓰는 "local:번호"를 씁니다.
  const postAuthorKey = (p) => p.authorId || ("local:" + authorMidOf("post", p.id, !!p.mine));
  const blockedKeys = () => state.user.blocked || [];
  const isBlockedPost = (p) => !p.mine && blockedKeys().includes(postAuthorKey(p));
  const blockedLabel = (key) => "익명 사용자 #" +
    (String(key).indexOf("local:") === 0 ? String(key).slice(6) : String(key).slice(0, 6));

  function blockAuthorOfPost(p) {
    if (p.mine) { toast("내 글은 차단할 수 없어요."); return; }
    const key = postAuthorKey(p);
    if (blockedKeys().includes(key)) { toast("이미 차단한 사용자예요."); return; }
    state.user.blocked.push(key);
    saveUser();
    Sync.setBlock(key, true);
    const n = state.posts.filter((x) => !x.mine && postAuthorKey(x) === key).length;
    show("community");
    toast(`이 작성자를 차단했어요. 글 ${n}개가 목록에서 숨겨져요.`);
  }
  function unblockKey(key) {
    state.user.blocked = blockedKeys().filter((x) => x !== key);
    saveUser();
    Sync.setBlock(key, false);
    renderBlocked();
    toast("차단을 해제했어요.");
  }
  function renderBlocked() {
    const list = blockedKeys();
    $("#blocked-area").innerHTML = `
      <p class="warn-text" style="margin:4px 4px 12px">차단한 사용자의 글은 커뮤니티·홈·검색에서 보이지 않아요. 언제든 해제할 수 있어요.</p>
      ${list.length
        ? list.map((key) => {
            const cnt = state.posts.filter((x) => !x.mine && postAuthorKey(x) === key).length;
            return `
              <div class="card row-link no-tap" style="margin-bottom:8px">
                <span class="avatar" style="background:${COLORS[Math.abs(hashHue(String(key))) % COLORS.length]}"></span>
                <span class="row-label" style="margin-left:10px">${blockedLabel(key)}</span>
                <span class="flex-1"></span>
                <span class="row-value" style="margin-right:10px">숨긴 글 ${cnt}개</span>
                <button class="text-btn strong" data-unblock="${esc(String(key))}">해제</button>
              </div>`;
          }).join("")
        : '<div class="empty-state">차단한 사용자가 없어요.</div>'}`;
    $$("#blocked-area [data-unblock]").forEach((b) =>
      b.addEventListener("click", () => unblockKey(b.dataset.unblock)));
  }

  function reportSpirit(sp) {
    openSheet("도감 항목 신고", ["허위 정보/장난", "스팸/광고", "부적절한 내용", "기타"], null, (reason) => {
      state.user.hiddenSpirits = state.user.hiddenSpirits || [];
      if (!state.user.hiddenSpirits.includes(sp.id)) state.user.hiddenSpirits.push(sp.id);
      saveUser();
      fileReport("spirit", sp.id, sp.name, reason, !!sp.mine);
      show("dogam");
      toast(`신고가 접수되었어요 (${reason}). 관리자 확인 후 규정에 따라 처리돼요.`);
    });
  }
  const hiddenSp = () => state.user.hiddenSpirits || [];

  /* ---------- 장난/도배 방지 ---------- */
  const PROFANITY = /시발|씨발|씨빨|병신|븅신|개새끼|좆|지랄|니미|썅|염병|ㅅㅂ|ㅂㅅ|fuck|shit|bitch/i;
  function isClean(...texts) {
    if (texts.some((t) => PROFANITY.test(String(t || "")))) {
      toast("부적절한 표현이 포함되어 있어요. 수정 후 다시 시도해주세요.");
      return false;
    }
    return true;
  }
  function isBanned() {
    if (state.user.bannedUntil === -1) {
      toast("커뮤니티 이용이 영구 제한된 계정이에요.");
      return true;
    }
    if (state.user.bannedUntil && state.user.bannedUntil > Date.now()) {
      toast(`커뮤니티 이용이 제한 중이에요. (해제: ${fmtDate(state.user.bannedUntil)})`);
      return true;
    }
    return false;
  }
  function overDailyLimit(key, max, label) {
    const today = new Date().toDateString();
    const rl = store.get("ratelimit", {});
    if (rl.date !== today) { rl.date = today; rl.counts = {}; }
    rl.counts = rl.counts || {};
    if ((rl.counts[key] || 0) >= max) {
      toast(`${label}은 하루 ${max}개까지만 가능해요. 내일 다시 만나요!`);
      return true;
    }
    rl.counts[key] = (rl.counts[key] || 0) + 1;
    store.set("ratelimit", rl);
    return false;
  }

  /* ---------- 관리자 ---------- */
  const SANCTION_RULES = [
    ["스팸/광고", "삭제 + 3일 정지"],
    ["욕설/비방", "삭제 + 7일 정지"],
    ["음란물·불법 정보", "삭제 + 30일 정지"],
    ["허위 도감 등록(장난)", "삭제 + 경고"],
    ["누적 3회 이상 위반", "영구 정지"],
  ];
  // 진짜 권한은 서버(admins 테이블)가 판정해요. 이 PIN 은 화면을 여는 자물쇠일 뿐,
  // PIN 을 뚫어도 서버가 삭제·정지를 거부합니다.
  const isAdmin = () => !!Sync.isAdmin;

  function adminEnter() {
    if (!Sync.enabled) {
      toast("서버에 연결된 상태에서만 관리자 기능을 쓸 수 있어요.");
      return;
    }
    if (!isAdmin()) {
      openSheetHTML(`
        <h3>🛡️ 관리자 권한 없음</h3>
        <p class="sheet-note" style="text-align:left">이 계정은 운영자로 등록되어 있지 않아요. 관리자 권한은 <b>서버에서만</b> 부여할 수 있어서, 앱에서는 만들 수 없습니다.</p>
        <p class="sheet-note" style="text-align:left">Supabase 대시보드 &gt; SQL Editor 에서 아래를 실행하면 이 기기가 운영자가 돼요.</p>
        <div class="calc-result show" style="font-family:monospace;font-size:11.5px;word-break:break-all;text-align:left">
          insert into admins (user_id, note)<br>values ('${esc(Sync.uid || "이용자-번호")}', '운영자');
        </div>
        <button class="big-btn" id="copy-admin-sql" style="margin-top:14px">SQL 복사하기</button>`);
      const b = document.querySelector(".sheet #copy-admin-sql");
      if (b) b.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            `insert into admins (user_id, note)\nvalues ('${Sync.uid}', '운영자')\non conflict (user_id) do nothing;`);
          toast("복사했어요. SQL Editor 에 붙여넣고 실행한 뒤 앱을 새로고침하세요.");
        } catch { toast("복사에 실패했어요."); }
      });
      return;
    }
    const saved = store.get("adminPin", null);
    if (!saved) {
      const pin = prompt("관리자 PIN을 설정해주세요 (4자리 이상)");
      if (!pin || pin.length < 4) { toast("PIN은 4자리 이상이어야 해요."); return; }
      store.set("adminPin", pin);
      toast("관리자 모드가 활성화됐어요. 🛡️");
    } else {
      const pin = prompt("관리자 PIN을 입력해주세요");
      if (pin !== saved) { if (pin !== null) toast("PIN이 일치하지 않아요."); return; }
    }
    state.adminMode = true;
    renderMyPage();
    show("admin");
  }

  /* ---------- 관리자 조치 (서버 반영) ---------- */
  const BAN_OPTIONS = [
    ["글만 삭제", 0],
    ["삭제 + 작성자 3일 정지", 3],
    ["삭제 + 작성자 7일 정지", 7],
    ["삭제 + 작성자 30일 정지", 30],
    ["삭제 + 작성자 영구 정지", -1],
  ];

  // kind: post | spirit | meet | comment ...
  function openAdminSheet(kind, id, title, targetUser, afterDone) {
    if (!isAdmin()) return;
    const labels = BAN_OPTIONS.map(([l]) => l);
    openSheet(`🛡️ 관리자 조치 — ${title.slice(0, 18)}${title.length > 18 ? "…" : ""}`,
      labels, null, async (picked) => {
        const days = (BAN_OPTIONS.find(([l]) => l === picked) || [])[1];
        const reason = prompt("사유를 남겨주세요 (기록에 저장됩니다)", "커뮤니티 규칙 위반");
        if (reason === null) return;

        toast("처리 중이에요…");
        const del = await Sync.adminDelete(kind, id, { title, reason, targetUser });
        if (!del.ok) { toast("삭제 실패: " + del.error); return; }

        let msg = "삭제했어요.";
        if (days !== 0) {
          if (!targetUser) {
            msg = "삭제했어요. (작성자를 알 수 없어 정지는 못 했어요)";
          } else {
            const ban = await Sync.adminBan(targetUser, days, reason);
            msg = ban.ok ? `삭제하고 작성자를 ${ban.label} 처리했어요.` : "삭제했지만 정지 실패: " + ban.error;
          }
        }
        toast("🛡️ " + msg);
        await Sync.refresh("admin");
        if (afterDone) afterDone();
      });
  }
  /* ---------- 회원 디렉토리 (서버 연동 전 시뮬레이션) ---------- */
  function genMembers() {
    const NICKS = ["몰트덕후", "진토닉장인", "셰이커왕", "바텐꿈나무", "피트홀릭", "네그로니중독", "하이볼요정", "라임짜는남자", "민트머들러", "온더락파", "쿠페수집가", "비터몇방울", "새벽마감러", "우드포드사랑", "지거계량왕", "스터마스터", "가니시장인", "홈텐딩러", "이자카야알바", "루프탑바텐", "위스키노트", "다이키리생각", "솔티독마니아", "청춘칵테일", "바코스터", "얼음장인", "탄산지킴이", "시럽조절러", "압생트요정", "베르무트덕후", "사워홀릭", "티키러버", "플레어연습생", "조주기능사생", "바스푼돌리기", "믹솔로지스트","글라스닦이", "심야영업러", "라스트오더", "해피아워", "머들링소년", "칵테일일기", "바문화연구", "수원바텐", "홍대셰이커", "강남라운지", "부산오션바", "제주도바텐"];
    return NICKS.map((nick, i) => {
      const id = i + 2;
      const joined = now - ((id * 37) % 300 + 3) * D;
      const posts = (id * 13) % 40;
      const comments = (id * 29) % 120;
      const reported = id % 9 === 0 ? (id % 3) + 1 : 0;
      const m = { id, nick, color: id % 10, joined, posts, comments, reported, sanctions: [], bannedUntil: 0, memo: "" };
      if (id === 11) { m.bannedUntil = now + 5 * D; m.sanctions = [{ label: "7일 정지", reason: "욕설/비방", at: now - 2 * D, until: now + 5 * D }]; }
      if (id === 20) { m.bannedUntil = -1; m.reported = 4; m.sanctions = [{ label: "3일 정지", reason: "스팸/광고", at: now - 40 * D, until: now - 37 * D }, { label: "7일 정지", reason: "스팸/광고", at: now - 20 * D, until: now - 13 * D }, { label: "영구 정지", reason: "누적 3회 위반", at: now - 5 * D, until: -1 }]; }
      if (id === 29) { m.bannedUntil = now + 1 * D; m.sanctions = [{ label: "3일 정지", reason: "도배", at: now - 2 * D, until: now + 1 * D }]; }
      return m;
    });
  }
  if (!state.members || !state.members.length) {
    state.members = [{ id: 1, nick: state.user.nick || "나", color: state.user.color, joined: now - 30 * D, posts: 0, comments: 0, reported: 0, sanctions: [], bannedUntil: 0, memo: "이 기기 사용자 (실계정)" }, ...genMembers()];
    saveMembers();
  }
  // 서버에 연결되지 않은 상태에서만 쓰는 가상 작성자 번호.
  // 서버가 붙어 있으면 글마다 실제 계정(authorId)이 있어 이 값은 쓰이지 않아요.
  function authorMidOf(type, targetId, mine) {
    if (mine) return 1;
    return 2 + ((targetId * 7 + (type === "post" ? 3 : 5)) % (state.members.length - 1));
  }

  /* ---------- 관리자 화면 ---------- */
  function renderAdmin() {
    const my = state.members.find((m) => m.id === 1);
    if (my) { my.nick = state.user.nick; my.color = state.user.color; my.bannedUntil = state.user.bannedUntil || 0; }
    $$("#admin-tabs .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.atab === state.adminTab));
    if (state.adminTab === "dash") renderAdminDash();
    else if (state.adminTab === "reports") renderAdminReports();
    else renderAdminUsers();
    if (state.adminTab === "dash") loadAdminStats();

  }
  function renderAdminDash() {
    const st = state.adminStats;
    if (!st) {
      $("#admin-area").innerHTML = '<div class="empty-state">현황을 불러오는 중이에요…</div>';
      loadAdminStats();
      return;
    }
    const card = (rows) => `
      <div class="stat-row" style="padding:6px 0 0">
        ${rows.map(([v, l, c]) => `<div class="stat"><b${c ? ` style="color:${c}"` : ""}>${fmtNum(v)}</b><span>${l}</span></div>`).join("")}
      </div>`;
    $("#admin-area").innerHTML = `
      <div class="sp-body" style="border-bottom:8px solid var(--bg-gray)">
        <h3>현황 <span style="font-size:12.5px;font-weight:500;color:var(--text-sub)">· 서버 실시간</span></h3>
        ${card([[st.users, "회원"], [st.reports_pending, "미처리 신고", "var(--accent)"], [st.banned, "정지 중"]])}
        ${card([[st.posts, "게시글"], [st.comments, "댓글"], [st.spirits, "등록 도감"]])}
        ${card([[st.meets, "모임"], [st.reviews, "리뷰"], [st.conversations, "1:1 대화"]])}
      </div>
      <div class="sp-body" style="border-bottom:8px solid var(--bg-gray)">
        <h3>오늘</h3>
        ${card([[st.users_today, "신규 가입"], [st.posts_today, "새 글"], [st.meets_upcoming, "예정 모임"]])}
      </div>
      <div class="sp-body" style="border-bottom:8px solid var(--bg-gray)">
        <h3>빠른 작업</h3>
        <div class="pd-actions">
          <button class="mkd-chat-btn outline" id="admin-refresh">현황 새로고침</button>
          <button class="mkd-chat-btn outline" id="admin-log">조치 기록 보기</button>
        </div>
      </div>
      <div style="height:24px"></div>`;
    $("#admin-refresh").addEventListener("click", () => { state.adminStats = null; loadAdminStats(true); });
    $("#admin-log").addEventListener("click", openAdminLogSheet);
  }

  async function loadAdminStats(force) {
    if (!isAdmin()) return;
    if (state.adminStats && !force) return;
    const st = await Sync.adminStats();
    if (!st) {
      $("#admin-area").innerHTML =
        '<div class="empty-state">현황을 불러오지 못했어요.<br>supabase/chat-admin.sql 을 실행했는지 확인해주세요.</div>';
      return;
    }
    state.adminStats = st;
    if (state.view === "admin" && state.adminTab === "dash") renderAdminDash();
  }

  async function openAdminLogSheet() {
    const rows = await Sync.adminLog(50);
    openSheetHTML(`
      <h3>관리자 조치 기록</h3>
      ${rows.length ? rows.map((r) => `
        <div class="sheet-row">
          <span>${esc(r.action)} · ${esc(TYPE_LABEL[r.type] || r.type || "")}</span>
          <span class="r">${fmtRel(r.at)}</span>
        </div>
        ${r.title ? `<div class="market-meta" style="margin:-4px 0 8px">${esc(r.title)}${r.reason ? " — " + esc(r.reason) : ""}</div>` : ""}`).join("")
        : '<p class="sheet-note">아직 조치 기록이 없어요.</p>'}`);
  }
  function exportCSV(name, rows) {
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `${name}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV 파일을 저장했어요. 📄");
  }
  const TYPE_LABEL = { post: "게시글", spirit: "도감", comment: "댓글", meet: "모임", user: "사용자" };

  function renderAdminReports() {
    const list = state.serverReports || [];
    $("#admin-area").innerHTML = `
      <p class="sheet-note" style="margin:0 0 12px">서버에 접수된 실제 신고예요. 처리하면 모든 사용자에게 즉시 반영됩니다.</p>
      ${list.length ? list.map((r) => {
        const target = r.type === "post"
          ? state.posts.find((p) => p.id === r.targetId)
          : r.type === "spirit" ? state.spirits.find((s) => s.id === r.targetId) : null;
        const gone = r.targetId !== null && !target;
        return `
        <div class="order-item">
          <div class="order-head">
            <span class="mk-state ${r.status === "접수" ? "" : "sold"}">${esc(r.status)}</span>
            <span class="order-no">${TYPE_LABEL[r.type] || esc(r.type)}</span>
            <span class="order-date">${fmtTime(r.time)}</span>
          </div>
          <div class="order-title">${esc(r.title || "(제목 없음)")}</div>
          <div class="market-meta">사유: ${esc(r.reason)}${gone ? " · <b>이미 삭제됨</b>" : ""}${r.targetUser ? ` · 작성자 ${esc(r.targetUser.slice(0, 6))}` : ""}</div>
          ${r.status === "접수" ? `
            <div style="display:flex;gap:8px;margin-top:10px">
              ${gone ? "" : `<button class="host-chat-btn" data-proc="${r.id}" style="flex:1">조치하기</button>`}
              <button class="host-chat-btn outline" data-dismiss="${r.id}" style="flex:1">기각</button>
            </div>` : ""}
        </div>`;
      }).join("") : '<div class="empty-state">접수된 신고가 없어요.</div>'}
      <div style="height:24px"></div>`;
    $$("#admin-area [data-proc]").forEach((b) =>
      b.addEventListener("click", () => processReport(+b.dataset.proc)));
    $$("#admin-area [data-dismiss]").forEach((b) =>
      b.addEventListener("click", async () => {
        const res = await Sync.adminResolveReport(+b.dataset.dismiss, "기각");
        toast(res.ok ? "신고를 기각했어요." : "실패: " + res.error);
        if (res.ok) Sync.refresh("admin");
      }));
  }
  function renderAdminUsers() {
    const q = state.adminUserQ || "";
    const f = state.adminUserFilter || "전체";
    const all = state.adminUserList || [];
    let list = all.filter((m) =>
      f === "전체" ? true :
      f === "정지 중" ? (m.bannedUntil && m.bannedUntil > Date.now()) :
      m.reported > 0);
    list = [...list].sort((a, b) => b.reported - a.reported || b.joined - a.joined);

    $("#admin-area").innerHTML = `
      <div class="search-box" style="margin:14px 16px 8px">
        <svg viewBox="0 0 24 24" class="search-ic"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="text" id="admin-user-q" placeholder="닉네임 검색" value="${esc(q)}">
      </div>
      <div class="sort-row">
        ${["전체", "정지 중", "신고 누적"].map((x) =>
          `<button class="chip ${x === f ? "active" : ""}" data-f="${x}">${x}</button>`).join("")}
        <span style="margin-left:auto;font-size:12.5px;color:var(--text-sub);align-self:center">${fmtNum(list.length)}명</span>
      </div>
      ${state.adminUsersLoading ? '<div class="empty-state">불러오는 중이에요…</div>' : ""}
      ${!state.adminUsersLoading && !list.length ? '<div class="empty-state">해당하는 회원이 없어요.</div>' : ""}
      ${list.map((m) => {
        const banned = m.bannedUntil && m.bannedUntil > Date.now();
        const days = banned ? Math.ceil((m.bannedUntil - Date.now()) / 86400000) : 0;
        const label = banned ? (days > 3650 ? "영구 정지" : `정지 ${days}일 남음`) : "정상";
        const me = m.id === Sync.uid;
        return `
        <div class="member-row" data-uid="${esc(m.id)}">
          <span class="avatar md" style="background:${COLORS[m.color] || COLORS[0]}"></span>
          <div class="member-info">
            <div class="member-nick">${esc(m.nick)}${me ? ' <span class="my-tag">나</span>' : ""}</div>
            <div class="market-meta">글 ${m.posts} · 댓글 ${m.comments} · 신고당함 ${m.reported}회 · 가입 ${fmtDate(m.joined)}</div>
          </div>
          <span class="mk-state ${banned ? "sold" : ""}">${label}</span>
        </div>`;
      }).join("")}
      <div style="height:24px"></div>`;

    const qInput = $("#admin-user-q");
    qInput.addEventListener("input", () => {
      state.adminUserQ = qInput.value.trim();
      clearTimeout(state.adminUserTimer);
      state.adminUserTimer = setTimeout(() => loadAdminUsers(), 300);
      const pos = qInput.selectionStart;
      renderAdminUsers();
      const nq = $("#admin-user-q");
      nq.focus();
      nq.setSelectionRange(pos, pos);
    });
    $$("#admin-area .sort-row .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.adminUserFilter = ch.dataset.f; renderAdminUsers(); }));
    $$("#admin-area .member-row").forEach((el) =>
      el.addEventListener("click", () => openUserSheet(el.dataset.uid)));

    if (!state.adminUserList) loadAdminUsers();
  }

  async function loadAdminUsers() {
    if (!isAdmin()) return;
    state.adminUsersLoading = true;
    const rows = await Sync.adminUsers(state.adminUserQ || "", 200);
    state.adminUserList = rows;
    state.adminUsersLoading = false;
    if (state.view === "admin" && state.adminTab === "users") renderAdminUsers();
  }

  // 회원 상세 — 실제로 서버에 정지/해제가 반영됩니다.
  function openUserSheet(uid) {
    const m = (state.adminUserList || []).find((x) => x.id === uid);
    if (!m) return;
    const banned = m.bannedUntil && m.bannedUntil > Date.now();
    const opts = banned
      ? ["정지 해제", "영구 정지로 변경"]
      : ["3일 정지", "7일 정지", "30일 정지", "영구 정지"];
    openSheetHTML(`
      <div class="detail-head" style="margin-bottom:10px">
        <span class="avatar md" style="background:${COLORS[m.color] || COLORS[0]}"></span>
        <div>
          <div class="detail-nick">${esc(m.nick)}</div>
          <div class="detail-time">글 ${m.posts} · 댓글 ${m.comments} · 신고당함 ${m.reported}회</div>
        </div>
      </div>
      <div class="sheet-row"><span>가입</span><span class="r">${fmtDate(m.joined)}</span></div>
      <div class="sheet-row"><span>상태</span><span class="r">${banned ? "정지 중" : "정상"}</span></div>
      <div class="sheet-row"><span>이용자 번호</span><span class="r" style="font-family:monospace;font-size:11.5px">${esc(m.id)}</span></div>
      ${uid === Sync.uid ? '<p class="sheet-note">본인 계정이에요.</p>' :
        opts.map((o) => `<button class="sheet-opt" data-ban="${o}">${o}</button>`).join("")}`);

    document.querySelectorAll(".sheet [data-ban]").forEach((b) =>
      b.addEventListener("click", async () => {
        const label = b.dataset.ban;
        const days = label.includes("해제") ? 0 : label.includes("영구") ? -1 : parseInt(label, 10);
        const reason = prompt("사유를 남겨주세요 (기록에 저장됩니다)", "커뮤니티 규칙 위반");
        if (reason === null) return;
        const bd = document.querySelector(".sheet-backdrop");
        if (bd) bd.remove();
        toast("처리 중이에요…");
        const res = await Sync.adminBan(uid, days, reason);
        toast(res.ok ? `🛡️ ${res.label} 처리했어요.` : "실패: " + res.error);
        if (res.ok) { state.adminUserList = null; loadAdminUsers(); }
      }));
  }
  // 서버에 실제로 반영되는 신고 처리. 실패하면 실패했다고 알려줘요.
  function processReport(rid) {
    const r = (state.serverReports || []).find((x) => x.id === rid);
    if (!r) return;
    openAdminSheet(r.type, r.targetId, r.title || "(제목 없음)", r.targetUser, async () => {
      await Sync.adminResolveReport(rid, "완료");
      Sync.refresh("admin");
      if (state.view === "admin") renderAdmin();
    });
  }

  /* ---------- 바 타이머 ---------- */
  const TIMER_PRESETS = [10, 15, 30, 60];
  let timerLeft = 15, timerSel = 15, timerInt = null;
  function renderTimer() {
    $("#timer-display").textContent = timerLeft.toFixed(1);
    $("#timer-display").classList.toggle("running", !!timerInt);
    $("#timer-presets").innerHTML = TIMER_PRESETS.map((s) =>
      `<button class="chip ${s === timerSel ? "active" : ""}" data-s="${s}">${s}초</button>`).join("");
    $$("#timer-presets .chip").forEach((ch) =>
      ch.addEventListener("click", () => {
        timerSel = +ch.dataset.s;
        stopTimer();
        timerLeft = timerSel;
        renderTimer();
      }));
    $("#timer-toggle").textContent = timerInt ? "정지" : "시작";
  }
  function stopTimer() {
    clearInterval(timerInt);
    timerInt = null;
  }
  function toggleTimer() {
    if (timerInt) { stopTimer(); renderTimer(); return; }
    if (timerLeft <= 0) timerLeft = timerSel;
    timerInt = setInterval(() => {
      timerLeft = Math.max(0, timerLeft - 0.1);
      $("#timer-display").textContent = timerLeft.toFixed(1);
      if (timerLeft <= 0) {
        stopTimer();
        vibrate([200, 100, 200]);
        toast("⏱️ 타이머 종료!");
        renderTimer();
      }
    }, 100);
    renderTimer();
  }

  /* ---------- 랜덤 칵테일 ---------- */
  function randomCocktail() {
    const cts = state.spirits.filter((s) => s.kind === "cocktail");
    if (!cts.length) return;
    const pick = cts[Math.floor(Math.random() * cts.length)];
    vibrate(15);
    toast(`🎲 오늘의 한 잔: ${pick.name}!`);
    openSpirit(pick.id);
  }

  /* ---------- 내 취향 리포트 ---------- */
  function renderTaste() {
    const tried = state.user.cellar.tried.map((id) => state.spirits.find((s) => s.id === id)).filter(Boolean);
    const myReviews = state.spirits.flatMap((s) => s.reviews.filter((r) => r.mine));
    if (!tried.length && !myReviews.length) {
      $("#taste-area").innerHTML = `<div class="empty-state">아직 데이터가 부족해요.<br>술도감에서 '마셔봤어요'를 눌러 술장을 채우고<br>리뷰를 남기면 취향을 분석해드려요! 🥃</div>`;
      return;
    }
    // 카테고리 분포
    const catCount = {};
    tried.forEach((sp) => {
      const key = sp.kind === "cocktail" ? "칵테일" : sp.cat;
      catCount[key] = (catCount[key] || 0) + 1;
    });
    const cats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    // 평균 도수/별점
    const avgAbv = tried.length ? (tried.reduce((a, s) => a + (+s.abv || 0), 0) / tried.length) : 0;
    const avgMyStars = myReviews.length ? (myReviews.reduce((a, r) => a + r.stars, 0) / myReviews.length) : 0;
    // 위스키 지역 취향
    const regions = {};
    tried.filter((s) => s.cat === "위스키").forEach((s) => {
      const r = regionOfWhisky(s);
      regions[r] = (regions[r] || 0) + 1;
    });
    const topRegion = Object.entries(regions).sort((a, b) => b[1] - a[1])[0];
    // 재미 타이틀
    const title = !cats.length ? "탐험을 시작한 바텐더"
      : cats[0][0] === "위스키" ? (topRegion && topRegion[0] === "아일라" ? "피트에 영혼을 판 몰트 러버 🔥" : "묵직한 몰트 러버 🥃")
      : cats[0][0] === "칵테일" ? "믹솔로지 아티스트 🍸"
      : cats[0][0] === "진" ? "보태니컬 헌터 🌿"
      : cats[0][0] === "리큐르" ? "달콤한 밸런서 🍯"
      : cats[0][0] === "전통주" ? "우리 술 지킴이 🍶"
      : `${cats[0][0]} 애호가 🍷`;
    $("#taste-area").innerHTML = `
      <div class="sp-hero" style="border-bottom:8px solid var(--bg-gray)">
        <div style="font-size:44px;margin-bottom:8px">📊</div>
        <h2>${esc(state.user.nick)}님은<br>${title}</h2>
        <div class="sp-sub">마셔본 술 ${tried.length}병 · 내 리뷰 ${myReviews.length}개 기준</div>
      </div>
      <div class="sp-body">
        <h3>카테고리 취향 분포</h3>
        ${cats.slice(0, 6).map(([c, n]) => `
          <div class="taste-row">
            <span class="taste-label">${esc(c)}</span>
            <div class="taste-bar"><div class="taste-fill" style="width:${Math.round(n / maxCat * 100)}%"></div></div>
            <span class="taste-num">${n}</span>
          </div>`).join("")}
      </div>
      <div class="sp-body">
        <h3>나의 지표</h3>
        <div class="calc-result show">
          <div class="cr-row"><span>선호 평균 도수</span><b>${avgAbv ? avgAbv.toFixed(1) + "%" : "-"}</b></div>
          <div class="cr-row"><span>내 리뷰 평균 별점</span><b>${avgMyStars ? "★ " + avgMyStars.toFixed(1) : "-"}</b></div>
          ${topRegion ? `<div class="cr-row"><span>최애 위스키 지역</span><b>${esc(topRegion[0])} (${topRegion[1]}병)</b></div>` : ""}
          <div class="cr-row"><span>위시리스트</span><b>${state.user.cellar.wish.length}병</b></div>
        </div>
      </div>
      <div style="height:24px"></div>`;
  }

  /* ---------- 통합 검색 ---------- */
  function renderSearch() {
    const q = $("#global-search").value.trim();
    // 테이스팅 노트·태그까지 검색하려면 심층 데이터가 필요합니다.
    if (q && !DeepData.settled) {
      DeepData.load().then(() => { if (state.view === "search") renderSearch(); });
    }
    if (q.length < 1) {
      $("#search-results").innerHTML = '<div class="empty-state">술, 칵테일, 게시글, 채용, 모임, 상품을<br>한 번에 검색해보세요.</div>';
      return;
    }
    const sec = (title, items) => items.length
      ? `<div class="comment-sec-title">${title} ${items.length}</div>${items.join("")}` : "";
    // 이름이 먼저 걸린 것을 위로 올리고, 그다음 테이스팅 노트·태그에서 걸린 것을 붙입니다.
    const spAll = state.spirits.filter((s) => !hiddenSp().includes(s.id));
    const byName = spAll.filter((s) => has(s.name, q));
    const byDeep = spAll.filter((s) => !has(s.name, q) && has(searchText(s), q));
    const spHits = byName.concat(byDeep);
    const spirits = spHits.slice(0, 8).map((sp) => {
      // 이름 말고 어디서 걸렸는지 알려주면 "왜 이게 나왔지" 하는 혼란이 없어요.
      const tag = tagsOf(sp).find((t) => has(t, q));
      const why = has(sp.name, q) ? "" : tag ? ` · #${esc(tag)}` : " · 테이스팅 노트";
      return `
      <div class="home-mini" data-go-spirit="${sp.id}">
        <span class="hm-emoji">${sp.kind === "cocktail" ? "🍸" : "🥃"}</span>
        <div class="hm-body"><div class="hm-title">${esc(sp.name)}</div>
        <div class="hm-sub">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스" : esc(sp.cat)} · ★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}${why}</div></div>
      </div>`;
    });
    const posts = state.posts.filter((p) => !(state.user.hiddenPosts || []).includes(p.id) && !isBlockedPost(p) && (has(p.title, q) || has(p.body, q))).slice(0, 5).map((p) => `
      <div class="home-mini" data-go-post="${p.id}">
        <span class="hm-emoji">💬</span>
        <div class="hm-body"><div class="hm-title">${esc(p.title)}</div>
        <div class="hm-sub">공감 ${p.likes} · 댓글 ${p.comments.length}</div></div>
      </div>`);
    const jobs = SEED_JOBS.filter((j) => has(j.title, q) || has(j.shop, q)).slice(0, 4).map((j) => `
      <div class="home-mini" data-go-jobs="1">
        <span class="hm-emoji">💼</span>
        <div class="hm-body"><div class="hm-title">${esc(j.title)}</div>
        <div class="hm-sub">${esc(j.pay)} · ${esc(j.area)}</div></div>
      </div>`);
    const meets = state.meets.filter((m) => has(m.title, q) || has(m.desc, q)).slice(0, 4).map((m) => `
      <div class="home-mini" data-go-meet="${m.id}">
        <span class="hm-emoji">🍻</span>
        <div class="hm-body"><div class="hm-title">${esc(m.title)}</div>
        <div class="hm-sub">${esc(m.region)} · ${fmtDate(m.date)}</div></div>
      </div>`);
    const prods = PRODUCTS.filter((p) => has(p.name, q)).slice(0, 4).map((p) => `
      <div class="home-mini" data-go-product="${p.id}">
        <span class="hm-emoji">${p.emoji}</span>
        <div class="hm-body"><div class="hm-title">${esc(p.name)}</div>
        <div class="hm-sub">${fmtNum(p.price)}원</div></div>
      </div>`);
    const html = sec("🥃 술 · 칵테일", spirits) + sec("💬 커뮤니티", posts) + sec("💼 채용", jobs) + sec("🍻 모임", meets) + sec("🛒 스토어", prods);
    $("#search-results").innerHTML = html || '<div class="empty-state">검색 결과가 없어요.</div>';
    $$("#search-results [data-go-spirit]").forEach((el) => el.addEventListener("click", () => openSpirit(+el.dataset.goSpirit)));
    $$("#search-results [data-go-post]").forEach((el) => el.addEventListener("click", () => openPost(+el.dataset.goPost)));
    $$("#search-results [data-go-meet]").forEach((el) => el.addEventListener("click", () => openMeet(+el.dataset.goMeet)));
    $$("#search-results [data-go-product]").forEach((el) => el.addEventListener("click", () => openProduct(+el.dataset.goProduct)));
    $$("#search-results [data-go-jobs]").forEach((el) => el.addEventListener("click", () => { $("#job-search").value = q; show("jobs"); }));
  }

  /* ---------- 칵테일 배수 ---------- */
  function scaleIngs(ings, mult) {
    if (mult === 1) return ings;
    return String(ings).replace(/(\d+(?:\.\d+)?)(?=\s*(?:ml|개|티스푼|대시|장|방울|큰술|샷))/g,
      (n) => {
        const v = parseFloat(n) * mult;
        return String(Math.round(v * 10) / 10);
      });
  }

  /* ---------- 술 이미지: 칵테일 대표사진 + 병 일러스트 ---------- */
  const saveImgCache = () => store.set("imgCache", state.imgCache);
  // v4: 병/잔 이미지 분류 검증 도입 → 검증 없이 수집된 사진 전부 재수집
  // (칵테일DB 출처 사진은 애초에 칵테일 사진이라 유지)
  if (store.get("imgv", 1) < 4) {
    Object.keys(state.imgCache).forEach((k) => {
      const v = state.imgCache[k];
      if (k.startsWith("b:") || v === "x" || v === "…" ||
        (typeof v === "string" && v.startsWith("http") && !v.includes("thecocktaildb"))) {
        delete state.imgCache[k];
      }
    });
    saveImgCache();
    store.set("imgv", 4);
  }
  const COCKTAIL_EN = {
    "네그로니": "Negroni", "올드 패션드": "Old Fashioned", "모히토": "Mojito", "진 토닉": "Gin And Tonic",
    "위스키 사워": "Whiskey Sour", "마티니": "Dry Martini", "맨해튼": "Manhattan", "다이키리": "Daiquiri",
    "마르가리타": "Margarita", "코스모폴리탄": "Cosmopolitan", "에스프레소 마티니": "Espresso Martini",
    "아페롤 스프리츠": "Aperol Spritz", "피나 콜라다": "Pina Colada", "롱아일랜드 아이스티": "Long Island Iced Tea",
    "사이드카": "Sidecar", "김렛": "Gimlet", "톰 콜린스": "Tom Collins", "프렌치 75": "French 75",
    "미도리 사워": "Midori Sour", "블러디 메리": "Bloody Mary", "모스코 뮬": "Moscow Mule", "쿠바 리브레": "Cuba Libre",
    "섹스 온 더 비치": "Sex on the Beach", "갓파더": "Godfather", "갓마더": "Godmother", "아비에이션": "Aviation",
    "브램블": "Bramble", "클로버 클럽": "Clover Club", "베스퍼": "Vesper", "화이트 레이디": "White Lady",
    "싱가포르 슬링": "Singapore Sling", "다크 앤 스토미": "Dark and Stormy", "플랜터스 펀치": "Planter's Punch",
    "좀비": "Zombie", "사제락": "Sazerac", "불바디에": "Boulevardier", "민트 줄렙": "Mint Julep",
    "러스티 네일": "Rusty Nail", "롭 로이": "Rob Roy", "아이리시 커피": "Irish Coffee",
    "스크루드라이버": "Screwdriver", "솔티 독": "Salty Dog", "시브리즈": "Sea breeze", "카미카제": "Kamikaze",
    "레몬 드롭": "Lemon Drop", "프로즌 마르가리타": "Frozen Margarita", "B-52": "B-52", "그래스호퍼": "Grasshopper",
    "아메리카노": "Americano", "키르": "Kir", "브랜디 알렉산더": "Brandy Alexander", "호스넥": "Horse's Neck",
    "상그리아": "Sangria", "셜리 템플": "Shirley Temple", "하비 월뱅어": "Harvey Wallbanger", "블루 라군": "Blue Lagoon",
    "마이애미 바이스": "Miami Vice", "화이트 러시안": "White Russian", "블랙 러시안": "Black Russian",
    "마이타이": "Mai Tai", "카이피리냐": "Caipirinha", "데킬라 선라이즈": "Tequila Sunrise", "팔로마": "Paloma",
    "미모사": "Mimosa", "벨리니": "Bellini", "아마레또 사워": "Amaretto Sour", "진 피즈": "Gin Fizz",
    "헤밍웨이 다이키리": "Hemingway Special", "핫 토디": "Hot Toddy", "엘 디아블로": "El Diablo",
  };
  // 스피릿 브랜드 → 위키피디아 문서명 (대표 병 사진 소스)
  const BRAND_EN = {
    "글렌피딕": "Glenfiddich", "글렌리벳": "The Glenlivet", "맥캘란": "The Macallan distillery", "발베니": "Balvenie distillery",
    "글렌모렌지": "Glenmorangie", "아드벡": "Ardbeg", "라가불린": "Lagavulin distillery", "라프로익": "Laphroaig",
    "탈리스커": "Talisker distillery", "하이랜드 파크": "Highland Park distillery", "글렌드로낙": "GlenDronach",
    "보모어": "Bowmore", "오반": "Oban distillery", "스프링뱅크": "Springbank distillery", "쿨일라": "Caol Ila",
    "부나하벤": "Bunnahabhain", "킬호만": "Kilchoman distillery", "글렌파클라스": "Glenfarclas distillery",
    "아벨라워": "Aberlour distillery", "글렌고인": "Glengoyne", "크래겐모어": "Cragganmore distillery",
    "달모어": "Dalmore distillery", "클라이넬리쉬": "Clynelish distillery", "올드 풀트니": "Old Pulteney distillery",
    "벤로막": "Benromach distillery", "딘스톤": "Deanston", "토마틴": "Tomatin distillery", "글렌킨치": "Glenkinchie",
    "벤리악": "BenRiach", "달위니": "Dalwhinnie distillery", "카듀": "Cardhu distillery", "글렌그란트": "Glen Grant distillery",
    "조니워커": "Johnnie Walker", "발렌타인": "Ballantine's", "시바스 리갈": "Chivas Regal", "듀어스": "Dewar's",
    "커티삭": "Cutty Sark (whisky)", "페이머스 그라우스": "The Famous Grouse", "몽키 숄더": "Monkey Shoulder",
    "로얄 살루트": "Royal Salute (whisky)", "제임슨": "Jameson Irish Whiskey", "부시밀즈": "Old Bushmills Distillery",
    "레드브레스트": "Redbreast (whiskey)", "털러모어": "Tullamore Dew",
    "버팔로 트레이스": "Buffalo Trace Distillery", "메이커스": "Maker's Mark", "메이커스 마크": "Maker's Mark",
    "와일드 터키": "Wild Turkey (bourbon)", "우드포드": "Woodford Reserve", "잭 다니엘": "Jack Daniel's",
    "짐빔": "Jim Beam", "놉 크릭": "Knob Creek", "포 로지스": "Four Roses", "에반 윌리엄스": "Evan Williams (bourbon)",
    "엘라이자 크레이그": "Elijah Craig", "불렛": "Bulleit Bourbon", "블랜튼스": "Blanton's", "이글 레어": "Eagle Rare",
    "부커스": "Booker's", "올드 포레스터": "Old Forester", "미치터스": "Michter's", "젠틀맨": "Jack Daniel's",
    "크라운 로얄": "Crown Royal", "캐나디안 클럽": "Canadian Club", "엔젤스": "Angel's Envy",
    "야마자키": "Yamazaki distillery", "히비키": "Hibiki (whisky)", "하쿠슈": "Hakushu distillery",
    "산토리": "Suntory", "니카": "Nikka Whisky Distilling", "슈퍼 니카": "Nikka Whisky Distilling",
    "다케츠루": "Nikka Whisky Distilling", "치타": "Suntory", "카발란": "Kavalan Distillery",
    "암룻": "Amrut (whisky)", "폴 존": "Paul John (whisky)", "펜더린": "Penderyn Distillery",
    "탱커레이": "Tanqueray", "봄베이": "Bombay Sapphire", "헨드릭스": "Hendrick's Gin", "몽키": "Monkey 47",
    "몽키 47": "Monkey 47", "비피터": "Beefeater Gin", "고든스": "Gordon's Gin", "플리머스": "Plymouth Gin",
    "로쿠": "Roku (gin)", "더 보타니스트": "The Botanist (gin)", "시프스미스": "Sipsmith",
    "바카디": "Bacardi", "하바나 클럽": "Havana Club", "캡틴 모건": "Captain Morgan", "크라켄": "Kraken Black Spiced Rum",
    "고슬링": "Gosling Brothers", "세일러 제리": "Sailor Jerry", "마이어스": "Myers's Rum",
    "앱솔루트": "Absolut Vodka", "그레이 구스": "Grey Goose (vodka)", "스미노프": "Smirnoff", "시락": "Cîroc",
    "케틀 원": "Ketel One", "벨베디어": "Belvedere (vodka)", "스톨리치나야": "Stolichnaya", "핀란디아": "Finlandia (vodka)",
    "티토스": "Tito's Handmade Vodka", "벨루가": "Beluga Vodka",
    "패트론": "Patrón", "호세 쿠엘보": "Jose Cuervo", "돈 훌리오": "Don Julio", "카사미고스": "Casamigos",
    "캄파리": "Campari", "아페롤": "Aperol", "깔루아": "Kahlúa", "베일리스": "Baileys Irish Cream",
    "코인트로": "Cointreau", "미도리": "Midori (liqueur)", "말리부": "Malibu (rum)", "디사론노": "Disaronno",
    "예거마이스터": "Jägermeister", "드람뷔이": "Drambuie", "베네딕틴": "Bénédictine", "샤르트뢰즈": "Chartreuse (liqueur)",
    "그랑 마니에": "Grand Marnier", "생제르맹": "St-Germain (liqueur)", "갈리아노": "Galliano (liqueur)",
    "프란젤리코": "Frangelico", "삼부카": "Sambuca", "몰리나리": "Sambuca", "리몬첼로": "Limoncello",
    "헤네시": "Hennessy", "레미 마틴": "Rémy Martin", "마르텔": "Martell (cognac)", "꾸르부아지에": "Courvoisier",
    "마티니": "Martini (vermouth)", "릴레": "Lillet", "모엣": "Moët & Chandon", "뵈브": "Veuve Clicquot",
    "예거": "Jägermeister", "진로": "Jinro", "기네스": "Guinness", "앙고스투라": "Angostura bitters",
  };
  function brandOf(name) {
    const t = String(name).split(/\s+/);
    return BRAND_EN[t[0] + " " + (t[1] || "")] ? t[0] + " " + t[1]
      : BRAND_EN[t[0]] ? t[0] : null;
  }
  const imgQueue = [];
  let imgActive = 0;
  function pumpImgQueue() {
    while (imgActive < 5 && imgQueue.length) {
      const job = imgQueue.shift();
      imgActive++;
      job().finally(() => { imgActive--; pumpImgQueue(); });
    }
  }
  const BAD_IMG = /distillery|brewery|building|map|logo|exterior|interior|warehouse|cask|still\b|visitor|centre|center|museum|sign|entrance|landscape|street|house|hall|plant|factory|washback|fermen|mash|tun\b|barrel|advert|poster|portrait|founder|statue|plaque|\.svg$/i;
  const wikiBottleCands = (title) =>
    fetch("https://en.wikipedia.org/api/rest_v1/page/media-list/" + encodeURIComponent(title))
      .then((r) => r.json())
      .then((j) => {
        const items = ((j && j.items) || []).filter((it) =>
          it.type === "image" && it.srcset && it.srcset[0] && !/\.svg|\.gif/i.test(it.title || ""));
        const src = (it) => "https:" + it.srcset[0].src.replace(/^https?:/, "");
        const good = items.filter((it) => /bottle|bottling|flasche|botella/i.test(it.title || "")).map(src);
        const neutral = items.filter((it) => !BAD_IMG.test(it.title || "")).map(src);
        return [...new Set([...good, ...neutral])];
      })
      .catch(() => []);
  function fetchSpiritImg(sp) {
    const brand = brandOf(sp.name);
    if (!brand) return;
    const key = "b:" + brand;
    if (state.imgCache[key] !== undefined) return;
    state.imgCache[key] = "…";
    const clean = BRAND_EN[brand].replace(/\s*\(.*\)/, "").replace(/\s*distillery/i, "");
    imgQueue.push(async () => {
      const cands = [
        ...await wikiBottleCands(BRAND_EN[brand]),
        ...await commonsSearchList(clean + " bottle"),
      ];
      const url = await firstBottleOf([...new Set(cands)]);
      setImgResult(key, url);
    });
    pumpImgQueue();
  }
  function rerenderForImages() {
    if (state.view === "dogam") renderDogam();
    else if (state.view === "spirit") renderSpiritDetail();
    else if (state.view === "home") renderHome();
    else if (state.view === "finder") renderFinder();
  }
  // 칵테일 → 위키 문서 (DB에 없는 것들 2차 소스)
  const COCKTAIL_WIKI = {
    "위스키 하이볼": "Highball", "페니실린": "Penicillin (cocktail)", "뉴욕 사워": "New York sour",
    "라스트 워드": "Last Word (cocktail)", "진 바질 스매시": "Gin Basil Smash", "사우스사이드": "Southside (cocktail)",
    "깁슨": "Gibson (cocktail)", "마티네즈": "Martinez (cocktail)", "진 리키": "Rickey (cocktail)",
    "행키 팽키": "Hanky Panky (cocktail)", "비스 니즈": "Bee's Knees (cocktail)", "페인킬러": "Painkiller (cocktail)",
    "엘 프레지덴테": "El Presidente (cocktail)", "핫 버터드 럼": "Hot buttered rum", "잭콕": "Jack and Coke",
    "페이퍼 플레인": "Paper Plane (cocktail)", "골드 러시": "Gold Rush (cocktail)", "올드 팔": "Old Pal",
    "애플 마티니": "Appletini", "프렌치 마티니": "French martini", "토미스 마르가리타": "Tommy's margarita",
    "네그로니 스바글리아토": "Negroni sbagliato", "휴고 스프리츠": "Hugo (cocktail)", "키르 로얄": "Kir (cocktail)",
    "스팅어": "Stinger (cocktail)", "뱅쇼": "Mulled wine", "블루 하와이": "Blue Hawaii (cocktail)",
    "버진 모히토": "Mojito", "헤밍웨이 다이키리": "Hemingway Special", "위스키 스매시": "Smash (cocktail)",
    "준벅": "June bug (cocktail)", "치치": "Chi chi (cocktail)", "멕시칸 뮬": "Moscow mule",
    "더티 마티니": "Dirty Martini", "브롱크스": "Bronx (cocktail)", "핑크 레이디": "Pink Lady (cocktail)",
    "존 콜린스": "John Collins (cocktail)", "블러드 앤 샌드": "Blood and Sand (cocktail)", "브루클린": "Brooklyn (cocktail)",
    "린치버그 레모네이드": "Lynchburg Lemonade", "프렌치 커넥션": "French Connection (cocktail)",
    "잭 로즈": "Jack Rose (cocktail)", "피스코 사워": "Pisco sour", "샴페인 칵테일": "Champagne cocktail",
    "스프리처": "Spritzer", "틴토 데 베라노": "Tinto de verano", "블랙 벨벳": "Black velvet (beer cocktail)",
    "미첼라다": "Michelada", "예거밤": "Jägerbomb", "머드슬라이드": "Mudslide (cocktail)",
    "가리발디": "Garibaldi (cocktail)", "블러디 시저": "Caesar (cocktail)", "허리케인": "Hurricane (cocktail)",
    "바카디 칵테일": "Bacardi cocktail", "우우 (Woo Woo)": "Woo Woo (cocktail)", "바하마 마마": "Bahama Mama",
    "케이프 코더": "Cape Codder (cocktail)", "베이 브리즈": "Sea Breeze (cocktail)", "깔루아 밀크": "Kahlúa",
    "리몬첼로 스프리츠": "Limoncello", "신데렐라": "Cinderella (cocktail)",
  };
  let imgFetchTimer;
  function setImgResult(key, url) {
    state.imgCache[key] = url || "x";
    saveImgCache();
    clearTimeout(imgFetchTimer);
    imgFetchTimer = setTimeout(rerenderForImages, 600);
  }
  const wikiLead = (title) =>
    fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title))
      .then((r) => r.json())
      .then((j) => (j && j.thumbnail && j.thumbnail.source) || null)
      .catch(() => null);
  const commonsSearchList = (term) =>
    fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=" +
      encodeURIComponent(term) + "&prop=imageinfo&iiprop=url&iiurlwidth=480")
      .then((r) => r.json())
      .then((j) => Object.values((j && j.query && j.query.pages) || {})
        .sort((a, b) => a.index - b.index)
        .filter((p) => p.imageinfo && p.imageinfo[0] && !BAD_IMG.test(p.title) && !/\.svg$|\.pdf$|\.tiff?$|\.webm$|\.ogv$|\.gif$/i.test(p.title))
        .map((p) => p.imageinfo[0].thumburl || p.imageinfo[0].url))
      .catch(() => []);

  /* ---------- 병/잔 이미지 검증 (온디바이스 분류) ---------- */
  let bottleModel = null, bottleModelLoading = null;
  function loadBottleModel() {
    if (bottleModelLoading) return bottleModelLoading;
    bottleModelLoading = new Promise((resolve) => {
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
      s1.onload = () => {
        const s2 = document.createElement("script");
        s2.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";
        s2.onload = () => {
          window.mobilenet.load({ version: 2, alpha: 0.5 })
            .then((m) => { bottleModel = m; resolve(m); })
            .catch(() => resolve(null));
        };
        s2.onerror = () => resolve(null);
        document.head.appendChild(s2);
      };
      s1.onerror = () => resolve(null);
      document.head.appendChild(s1);
    });
    return bottleModelLoading;
  }
  const BOTTLE_LABELS = /bottle|jug|wine|goblet|beer glass|cocktail|eggnog|flask|pitcher|carboy|beaker|whiskey/i;
  async function looksLikeBottle(url) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      if (img.naturalWidth > img.naturalHeight * 1.15) return false; // 가로(풍경) 컷
      await loadBottleModel();
      if (!bottleModel) return true; // 모델 로드 실패 시 기존 필터만으로 통과
      const preds = await bottleModel.classify(img, 5);
      return preds.some((p) => BOTTLE_LABELS.test(p.className));
    } catch { return true; }
  }
  async function firstBottleOf(cands) {
    for (const c of cands.slice(0, 8)) {
      if (c && await looksLikeBottle(c)) return c;
    }
    return null;
  }
  function fetchCocktailImg(sp) {
    if (sp.kind !== "cocktail" || sp.img) return;
    if (state.imgCache[sp.id] !== undefined) return;
    state.imgCache[sp.id] = "…";
    const en = COCKTAIL_EN[sp.name];
    const wikiTitle = COCKTAIL_WIKI[sp.name];
    if (!en && !wikiTitle) { state.imgCache[sp.id] = "x"; saveImgCache(); return; }
    imgQueue.push(async () => {
      let url = null;
      if (en) {
        url = await fetch("https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(en))
          .then((r) => r.json())
          .then((j) => (j && j.drinks && j.drinks[0] && j.drinks[0].strDrinkThumb) || null)
          .catch(() => null);
      }
      if (!url) {
        const cands = [];
        if (wikiTitle) cands.push(await wikiLead(wikiTitle));
        cands.push(...await commonsSearchList((en || wikiTitle.replace(/\s*\(.*\)/, "")) + " cocktail"));
        url = await firstBottleOf(cands.filter(Boolean));
      }
      setImgResult(sp.id, url);
    });
    pumpImgQueue();
  }
  function spiritImgURL(sp) {
    if (sp.img) return sp.img;
    const u = sp.kind === "cocktail"
      ? state.imgCache[sp.id]
      : state.imgCache["b:" + brandOf(sp.name)];
    return u && u !== "x" && u !== "…" ? u : null;
  }
  function hashHue(s) {
    let h = 0;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h % 360;
  }
  function svgBottle(sp) {
    const hue = hashHue(sp.name);
    const GLASS = { "위스키": "35,45%,38%", "브랜디": "28,50%,34%", "럼": "30,45%,30%", "데킬라": "45,40%,55%", "진": "140,20%,52%", "보드카": "210,18%,62%", "와인": "340,40%,26%", "전통주": "45,15%,78%" };
    const g = GLASS[sp.cat] || `${hue},35%,45%`;
    const cap = `hsl(${hue},45%,28%)`;
    const lbl = `hsl(${hue},50%,95%)`;
    const wine = sp.cat === "와인";
    const jar = sp.cat === "전통주";
    const body = jar
      ? `<rect x="26" y="18" width="12" height="16" fill="hsl(${g})"/><rect x="13" y="32" width="38" height="62" rx="12" fill="hsl(${g})"/>`
      : wine
        ? `<path d="M28 12h8v22q12 4 12 16v38q0 6-6 6H26q-6 0-6-6V50q0-12 12-16z" fill="hsl(${g})"/>`
        : `<path d="M26 12h12v16q12 3 12 14v46q0 6-6 6H20q-6 0-6-6V42q0-11 12-14z" fill="hsl(${g})"/>`;
    return `<svg viewBox="0 0 64 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(sp.name)}">
      <rect x="${jar ? 24 : 26}" y="4" width="${jar ? 16 : 12}" height="10" rx="2" fill="${cap}"/>
      ${body}
      <rect x="22" y="16" width="4" height="30" rx="2" fill="rgba(255,255,255,.28)"/>
      <rect x="18" y="52" width="28" height="24" rx="3" fill="${lbl}"/>
      <text x="32" y="62" font-size="6" text-anchor="middle" fill="#3a3f46" font-family="sans-serif" font-weight="700">${esc(sp.name.slice(0, 5))}</text>
      <text x="32" y="71" font-size="5" text-anchor="middle" fill="#8b95a1" font-family="sans-serif">${sp.abv}%</text>
    </svg>`;
  }
  function svgGlass(sp) {
    const hue = hashHue(sp.name);
    return `<svg viewBox="0 0 64 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(sp.name)}">
      <path d="M10 16h44L36 42v34h11v6H17v-6h11V42z" fill="#aeb9c4" opacity=".45"/>
      <path d="M14 19h36L35 41h-6z" fill="hsl(${hue},70%,55%)"/>
      <circle cx="47" cy="14" r="5" fill="hsl(${(hue + 70) % 360},75%,60%)"/>
      <rect x="30" y="42" width="4" height="32" fill="#aeb9c4" opacity=".6"/>
    </svg>`;
  }
  function thumbHTML(sp) {
    const u = spiritImgURL(sp);
    if (u) return `<img class="thumb-img" loading="lazy" src="${esc(u)}" alt="" data-fb="${sp.id}">`;
    if (sp.kind === "cocktail") { fetchCocktailImg(sp); return svgGlass(sp); }
    fetchSpiritImg(sp);
    return svgBottle(sp);
  }
  function wireImgFallback(sel) {
    $$(sel + " img.thumb-img").forEach((img) => {
      const fail = () => {
        const sp = state.spirits.find((s) => s.id === +img.dataset.fb);
        if (sp) {
          if (sp.img) { delete sp.img; saveSpirits(); }
          if (sp.kind === "cocktail") state.imgCache[sp.id] = "x";
          else state.imgCache["b:" + brandOf(sp.name)] = "x";
          saveImgCache();
        }
        const span = document.createElement("span");
        span.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center";
        span.innerHTML = sp ? (sp.kind === "cocktail" ? svgGlass(sp) : svgBottle(sp)) : "🥃";
        img.replaceWith(span);
      };
      img.addEventListener("error", fail, { once: true });
      // 가로(풍경) 사진은 병이 아니라고 판단 → 일러스트로 교체 (직접 등록한 이미지는 예외)
      img.addEventListener("load", () => {
        const sp = state.spirits.find((s) => s.id === +img.dataset.fb);
        if (sp && sp.kind === "spirit" && !sp.img && img.naturalWidth > img.naturalHeight * 1.15) fail();
      }, { once: true });
    });
  }
  function biggerURL(u) {
    if (!u) return u;
    if (u.includes("Special:FilePath")) return u.replace(/width=\d+/, "width=1000");
    return u.replace(/\/(\d+)px-/, "/1000px-");
  }
  function openLightbox(src) {
    const big = biggerURL(src);
    const bd = document.createElement("div");
    bd.className = "lightbox";
    bd.innerHTML = `<img src="${esc(big)}" alt=""><button class="lb-close" aria-label="닫기">✕</button>`;
    bd.addEventListener("click", () => bd.remove());
    if (big !== src)
      bd.querySelector("img").addEventListener("error", function () { this.src = src; }, { once: true });
    $("#app").appendChild(bd);
  }

  /* ---------- 홈 ---------- */
  function renderHome() {
    const h = new Date().getHours();
    const greet = h < 6 ? "새벽 마감까지 고생 많아요 🌙" : h < 12 ? "좋은 아침이에요 ☀️" : h < 18 ? "오픈 준비 잘 되고 있나요? 😊" : "오늘 장사도 화이팅! 🔥";
    const streak = state.user.attendStreak >= 2 ? ` <span class="streak-tag">🔥 ${state.user.attendStreak}일 연속</span>` : "";
    $("#home-greet").innerHTML = `${esc(state.user.nick)}님, 안녕하세요!${streak}<small>${greet}</small>`;

    // 오늘의 칵테일 (날짜 기반 고정 추천)
    const cts = state.spirits.filter((s) => s.kind === "cocktail");
    if (cts.length) {
      const d = new Date();
      const pick = cts[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % cts.length];
      $("#daily-cocktail").innerHTML = `
        <span class="dc-emoji">${thumbHTML(pick)}</span>
        <div class="dc-body">
          <div class="dc-name">${esc(pick.name)}</div>
          <div class="dc-sub">${esc(pick.base)} 베이스 · 오늘 한 잔 어때요?</div>
        </div>
        <svg viewBox="0 0 24 24" class="chev-r"><path d="M9 6l6 6-6 6"/></svg>`;
      $("#daily-cocktail").onclick = () => openSpirit(pick.id);
      wireImgFallback("#daily-cocktail");
    }

    // 스토어 추천 (베스트/신상 우선)
    const picks = [...PRODUCTS].sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0)).slice(0, 6);
    $("#home-store").innerHTML = picks.map((p) => `
      <div class="spirit-card" data-id="${p.id}">
        <span class="sc-emoji">${p.emoji}</span>
        <span class="sc-name">${esc(p.name)}</span>
        <span class="sc-stars">${fmtNum(p.price)}원</span>
        <span class="sc-meta">${p.tag ? esc(p.tag) : esc(p.cat)}</span>
      </div>`).join("");
    $$("#home-store .spirit-card").forEach((el) =>
      el.addEventListener("click", () => openProduct(+el.dataset.id)));

    const top = [...state.spirits]
      .sort((a, b) => (b.reviews.length * 10 + avgStars(b)) - (a.reviews.length * 10 + avgStars(a)))
      .slice(0, 6);
    $("#home-spirits").innerHTML = top.map((sp) => `
      <div class="spirit-card pressable" data-id="${sp.id}">
        <span class="sc-emoji">${thumbHTML(sp)}</span>
        <span class="sc-name">${esc(sp.name)}</span>
        <span class="sc-stars">★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</span>
        <span class="sc-meta">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스" : esc(sp.cat)}</span>
      </div>`).join("");
    $$("#home-spirits .spirit-card").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
    wireImgFallback("#home-spirits");

    const meets = [...state.meets].filter((m) => m.date > Date.now() - D).sort((a, b) => a.date - b.date).slice(0, 3);
    $("#home-meets").innerHTML = meets.map((m) => `
      <div class="home-mini" data-id="${m.id}">
        <span class="hm-emoji">🍻</span>
        <div class="hm-body">
          <div class="hm-title">${esc(m.title)}</div>
          <div class="hm-sub">${esc(m.region)} · ${fmtDate(m.date)}</div>
        </div>
        <span class="hm-right">${m.joined}/${m.max}명</span>
      </div>`).join("") || '<div class="empty-state" style="padding:26px 0">예정된 모임이 없어요.</div>';
    $$("#home-meets .home-mini").forEach((el) =>
      el.addEventListener("click", () => openMeet(+el.dataset.id)));

    const hot = state.posts.filter((p) => !(state.user.hiddenPosts || []).includes(p.id) && !isBlockedPost(p))
      .sort((a, b) => (b.likes + b.comments.length) - (a.likes + a.comments.length)).slice(0, 3);
    $("#home-posts").innerHTML = hot.map((p) => `
      <div class="home-mini" data-id="${p.id}">
        <span class="hm-emoji">${p.img ? `<img src="${p.img}" alt="">` : (p.emoji || "💬")}</span>
        <div class="hm-body">
          <div class="hm-title">${esc(p.title)}</div>
          <div class="hm-sub">공감 ${p.likes} · 댓글 ${p.comments.length}</div>
        </div>
      </div>`).join("");
    $$("#home-posts .home-mini").forEach((el) =>
      el.addEventListener("click", () => openPost(+el.dataset.id)));
  }

  /* ---------- 채용정보 ---------- */
  function jobItemHTML(j) {
    const fav = state.user.favJobs.includes(j.id);
    return `
      <div class="job-item" data-id="${j.id}">
        <div class="job-thumb" style="background:${THUMB_COLORS[j.id % THUMB_COLORS.length]}">${esc(j.shop)}</div>
        <div class="job-info">
          <div class="job-meta"><span class="job-badge">🟡</span><span class="job-name">${esc(j.shop)}</span><span class="job-days">· ${j.days}일째 광고중</span></div>
          <div class="job-title">${esc(j.title)}</div>
          <div class="job-sub"><b>${esc(j.pay)}</b> · ${esc(j.area)} · ${esc(j.type)}</div>
        </div>
        <button class="job-heart ${fav ? "on" : ""}" data-id="${j.id}" aria-label="관심알바 저장">
          <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>
        </button>
      </div>`;
  }
  function bindJobHearts(root, rerender) {
    root.querySelectorAll(".job-heart").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = +b.dataset.id;
        const i = state.user.favJobs.indexOf(id);
        if (i >= 0) { state.user.favJobs.splice(i, 1); toast("관심알바에서 삭제했어요."); }
        else { state.user.favJobs.push(id); toast("관심알바에 저장했어요. ❤️"); }
        saveUser();
        rerender();
      }));
  }
  function renderJobs() {
    const q = $("#job-search").value.trim();
    const list = SEED_JOBS.filter((j) =>
      (state.filterRegion === "전체" || j.region === state.filterRegion) &&
      (state.filterJob === "전체" || j.type === state.filterJob) &&
      (!q || has(j.title, q) || has(j.shop, q))
    );
    $("#job-list").innerHTML = list.length
      ? list.map(jobItemHTML).join("")
      : '<div class="empty-state">검색 결과가 없어요.</div>';
    bindJobHearts($("#job-list"), renderJobs);
  }
  function renderFavJobs() {
    const list = SEED_JOBS.filter((j) => state.user.favJobs.includes(j.id));
    $("#favjob-list").innerHTML = list.length
      ? list.map(jobItemHTML).join("")
      : '<div class="empty-state">저장한 알바가 없어요.<br>채용정보에서 ❤️를 눌러 저장해보세요.</div>';
    bindJobHearts($("#favjob-list"), renderFavJobs);
  }

  /* ---------- 술도감 ---------- */
  function renderDogam() {
    const cats = state.dogamKind === "spirit" ? ["전체", ...SPIRIT_CATS] : ["전체", ...COCKTAIL_BASES];
    if (!cats.includes(state.dogamCat)) state.dogamCat = "전체";
    $("#dogam-cats").innerHTML = cats.map((c) =>
      `<button class="chip ${c === state.dogamCat ? "active" : ""}" data-c="${c}">${c}</button>`).join("");
    $$("#dogam-cats .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.dogamCat = ch.dataset.c; renderDogam(); }));

    const SORTS = [["new", "최신순"], ["stars", "별점순"], ["reviews", "리뷰순"]];
    const isWhisky = state.dogamKind === "spirit" && state.dogamCat === "위스키";
    $("#dogam-sort").innerHTML = SORTS.map(([k, l]) =>
      `<button class="chip ${k === state.dogamSort ? "active" : ""}" data-s="${k}">${l}</button>`).join("") +
      (state.dogamKind === "spirit" ? `
        <button class="chip ${state.dogamAbv !== "전체" ? "active" : ""}" id="dogam-abv">도수 ${state.dogamAbv === "전체" ? "▾" : state.dogamAbv}</button>
        <button class="chip ${state.dogamPrice !== "전체" ? "active" : ""}" id="dogam-price">가격 ${state.dogamPrice === "전체" ? "▾" : state.dogamPrice}</button>` : "");
    $$("#dogam-sort .chip[data-s]").forEach((ch) =>
      ch.addEventListener("click", () => { state.dogamSort = ch.dataset.s; renderDogam(); }));
    const abvBtn = $("#dogam-abv");
    if (abvBtn) abvBtn.addEventListener("click", () =>
      openSheet("도수 필터", ["전체", "40% 이하", "40~46%", "46% 이상"], state.dogamAbv, (v) => { state.dogamAbv = v; renderDogam(); }));
    const priceBtn = $("#dogam-price");
    if (priceBtn) priceBtn.addEventListener("click", () =>
      openSheet("가격대 필터", ["전체", "5만원 이하", "5~10만원", "10~20만원", "20만원 이상"], state.dogamPrice, (v) => { state.dogamPrice = v; renderDogam(); }));

    // 태그로 좁혀본 상태면 맨 위에 지울 수 있는 칩을 띄웁니다.
    const tagBar = $("#dogam-tag");
    if (tagBar) {
      tagBar.hidden = !state.dogamTag;
      if (state.dogamTag) {
        tagBar.innerHTML = `<button class="chip active" id="dogam-tag-clear">#${esc(state.dogamTag)} ✕</button>`;
        $("#dogam-tag-clear").addEventListener("click", () => { state.dogamTag = ""; renderDogam(); });
      }
    }

    // 위스키 지역 필터 — 실제로 술이 있는 지역만 개수와 함께 보여줍니다.
    // 지역 판정에 심층 데이터가 필요하므로, 없으면 받아온 뒤 다시 그려요.
    if ((isWhisky || state.dogamTag) && !DeepData.settled) {
      DeepData.load().then(() => { if (state.view === "dogam") renderDogam(); });
    }
    $("#dogam-region").hidden = !isWhisky;
    if (isWhisky) {
      const rCount = {};
      state.spirits.forEach((s) => {
        if (s.kind !== "spirit" || s.cat !== "위스키" || hiddenSp().includes(s.id)) return;
        const r = regionOfWhisky(s);
        rCount[r] = (rCount[r] || 0) + 1;
      });
      const shown = WHISKY_REGIONS.filter((r) => r === "전체" || rCount[r] || r === state.dogamRegion);
      $("#dogam-region").innerHTML = shown.map((r) =>
        `<button class="chip ${r === state.dogamRegion ? "active" : ""}" data-r="${r}">${r}${r === "전체" ? "" : ` ${rCount[r] || 0}`}</button>`).join("");
      $$("#dogam-region .chip").forEach((ch) =>
        ch.addEventListener("click", () => { state.dogamRegion = ch.dataset.r; renderDogam(); }));
    }

    const abvOk = (sp) =>
      state.dogamAbv === "전체" ? true :
      state.dogamAbv === "40% 이하" ? sp.abv <= 40 :
      state.dogamAbv === "40~46%" ? sp.abv > 40 && sp.abv <= 46 :
      sp.abv > 46;
    const priceOk = (sp) => {
      if (state.dogamPrice === "전체") return true;
      const p = parsePriceMan(sp.price);
      if (p === null) return false;
      return state.dogamPrice === "5만원 이하" ? p <= 5 :
        state.dogamPrice === "5~10만원" ? p > 5 && p <= 10 :
        state.dogamPrice === "10~20만원" ? p > 10 && p <= 20 : p > 20;
    };
    const q = $("#spirit-search").value.trim();
    const list = state.spirits.filter((sp) =>
      !hiddenSp().includes(sp.id) &&
      sp.kind === state.dogamKind &&
      (state.dogamCat === "전체" || (sp.kind === "spirit" ? sp.cat : sp.base) === state.dogamCat) &&
      (!isWhisky || state.dogamRegion === "전체" || regionOfWhisky(sp) === state.dogamRegion) &&
      (state.dogamKind !== "spirit" || (abvOk(sp) && priceOk(sp))) &&
      (!state.dogamTag || tagsOf(sp).includes(state.dogamTag)) &&
      (!q || has(searchText(sp), q))
    ).sort((a, b) => {
      // 검색 중이면 적합도(이름 > 태그 > 본문)를 먼저 봅니다.
      if (q) {
        const r = matchRank(a, q) - matchRank(b, q);
        if (r) return r;
      }
      return state.dogamSort === "stars" ? avgStars(b) - avgStars(a) :
        state.dogamSort === "reviews" ? b.reviews.length - a.reviews.length :
        b.time - a.time;
    });

    // 점진 렌더: 필터가 바뀌면 100개부터 다시
    const sig = [state.dogamKind, state.dogamCat, state.dogamRegion, state.dogamAbv, state.dogamPrice, state.dogamSort, state.dogamTag, q].join("|");
    if (sig !== state._dogamSig) { state._dogamSig = sig; state.dogamLimit = 100; }
    const full = list.length;
    if (full > state.dogamLimit) list.length = state.dogamLimit;

    $("#spirit-list").innerHTML = (list.length
      ? list.map((sp) => `
        <div class="spirit-item" data-id="${sp.id}">
          <span class="spirit-emoji">${thumbHTML(sp)}</span>
          <div class="spirit-info">
            <div class="spirit-name">${esc(sp.name)}</div>
            <div class="spirit-meta">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스 · 약 " + sp.abv + "%" : esc(sp.cat) + " · " + sp.abv + "%" + (sp.price ? " · " + esc(sp.price) : "")}</div>
          </div>
          <div class="spirit-rate">
            <div class="stars">★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</div>
            <div class="cnt">리뷰 ${sp.reviews.length}</div>
          </div>
        </div>`).join("")
      : '<div class="empty-state">아직 등록된 항목이 없어요.<br>오른쪽 아래 + 버튼으로 등록해보세요!</div>') +
      (full > state.dogamLimit ? `<button class="host-chat-btn" id="dogam-more" style="margin:12px 16px;width:calc(100% - 32px)">더 보기 (${fmtNum(full - state.dogamLimit)}개 남음)</button>` : "");
    $$("#spirit-list .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
    const moreBtn = $("#dogam-more");
    if (moreBtn) moreBtn.addEventListener("click", () => {
      state.dogamLimit += 100;
      const keep = $("#view-dogam .scroll-area").scrollTop;
      renderDogam();
      $("#view-dogam .scroll-area").scrollTop = keep;
    });
    wireImgFallback("#spirit-list");
  }

  /* ---------- 심층 도감 데이터 지연 로딩 ---------- */
  // 두 데이터 파일을 합치면 500KB 가 넘습니다. 첫 화면에서 이걸 붙들고 있으면
  // 모바일에서 앱이 뜨는 게 늦어져서, 도감에 들어갈 때 불러오도록 분리했어요.
  // 앱이 뜬 뒤 한가할 때 미리 받아두기 때문에 실제로 기다리는 일은 거의 없습니다.
  const DeepData = (() => {
    let promise = null, settled = false;
    const inject = (src) => new Promise((done) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      // 못 받아도 앱은 그대로 동작해야 하므로 성공/실패 모두 통과시켜요.
      s.onload = s.onerror = () => done();
      document.head.appendChild(s);
    });
    return {
      // 데이터가 실제로 올라왔는지
      get ready() { return !!(window.WHISKY_DEEP && window.COCKTAIL_DEEP); },
      // 시도가 끝났는지 (실패로 끝나도 true — 무한 재시도를 막습니다)
      get settled() { return settled; },
      load() {
        if (!promise) {
          promise = Promise.all([inject("js/cocktail-deep.js"), inject("js/whisky-deep.js")])
            .then(() => { settled = true; });
        }
        return promise;
      },
    };
  })();

  /* ---------- 심층 도감 렌더링 ---------- */
  // 칵테일/위스키 심층 데이터는 별도 파일(cocktail-deep.js / whisky-deep.js)에 있어요.
  // localStorage 에 저장된 시드와 무관하게 매번 코드에서 읽으므로 항상 최신입니다.
  const deepOf = (sp) => {
    const src = sp.kind === "cocktail" ? window.COCKTAIL_DEEP : window.WHISKY_DEEP;
    return (src && src[sp.id]) || null;
  };
  const hasDeep = (sp) => !!deepOf(sp);
  // 심층 도감의 태그 목록 (없으면 빈 배열)
  const tagsOf = (sp) => { const d = deepOf(sp); return (d && d.tags) || []; };

  // 검색용 텍스트.
  // 이름만 훑으면 "피트" "셰리" "하이볼" 같은 말로는 아무것도 못 찾습니다.
  // 심층 도감의 태그·테이스팅 노트까지 합쳐서 검색되게 해요.
  // 항목이 300개가 넘으므로 한 번 만든 문자열은 재사용합니다.
  const _searchTextCache = new Map();
  function searchText(sp) {
    const c = _searchTextCache.get(sp.id);
    // 심층 데이터가 뒤늦게 도착하면 그때 한 번 다시 만듭니다.
    if (c && c.deep === DeepData.ready) return c.text;
    const d = deepOf(sp);
    const parts = [sp.name, sp.cat || "", sp.base || "", sp.note || "", sp.ings || ""];
    if (d) parts.push(
      d.type || "", d.region || "", d.family || "",
      d.nose || "", d.palate || "", d.finish || "", d.flavor || "",
      d.pairing || "", d.best || "", d.cocktail || "",
      (d.tags || []).join(" ")
      // tagline/story/serve 는 일부러 뺐습니다. "얼굴" 이 "굴" 로 걸리는 식의
      // 오탐이 많아서, 술의 성질을 설명하는 필드만 검색 대상으로 둡니다.
    );
    const text = parts.join(" ").toLowerCase();
    _searchTextCache.set(sp.id, { deep: DeepData.ready, text });
    return text;
  }

  // 검색 적합도: 이름에 있으면 0, 태그에 있으면 1, 본문이면 2.
  // 300개가 넘는 목록에서 본문 매칭이 최신순으로 섞여 나오면 엉뚱해 보여서,
  // 검색어가 있을 때는 이 순서를 먼저 적용합니다.
  function matchRank(sp, q) {
    if (has(sp.name, q)) return 0;
    if (tagsOf(sp).some((t) => has(t, q))) return 1;
    return 2;
  }

  // 섹션 껍데기
  const dpSec = (id, ic, title, sub, inner) => `
    <div class="dp-sec" id="dp-${id}">
      <div class="dp-h"><span class="dp-h-ic">${ic}</span>${esc(title)}
        ${sub ? `<span class="dp-h-sub">${esc(sub)}</span>` : ""}</div>
      ${inner}
    </div>`;

  // 여러 문단(\n\n 구분) → <p>
  const dpParas = (txt) =>
    String(txt || "").split("\n\n").filter(Boolean)
      .map((t) => `<p class="dp-p">${esc(t)}</p>`).join("");

  // 접히는 긴 글
  const dpFold = (key, txt) => `
    <div class="dp-fold closed" data-fold="${key}">
      <div class="dp-fold-body">${dpParas(txt)}</div>
      <button class="dp-fold-btn" data-foldbtn="${key}">전문 보기 ▾</button>
    </div>`;

  // 핵심 정보 카드 — [라벨, 값] 배열
  const dpFacts = (pairs) => `
    <div class="dp-facts">
      ${pairs.filter((p) => p && p[1]).map(([k, v, wide]) => `
        <div class="dp-fact${wide ? " wide" : ""}">
          <div class="dp-fact-k">${esc(k)}</div>
          <div class="dp-fact-v">${esc(v)}</div>
        </div>`).join("")}
    </div>`;

  // 맛 프로필 막대 (0~5)
  const PROFILE_LABEL = { sweet: "단맛", sour: "산미", strong: "도수", body: "바디", aroma: "향", peat: "피트", smoke: "스모크", fruit: "과실", spice: "스파이스" };
  const dpBars = (profile) => `
    <div class="dp-bars">
      ${Object.keys(profile).map((k) => {
        const v = Math.max(0, Math.min(5, +profile[k] || 0));
        return `<div class="dp-bar-row">
          <span class="dp-bar-label">${esc(PROFILE_LABEL[k] || k)}</span>
          <span class="dp-bar-track"><span class="dp-bar-fill" style="width:${(v / 5) * 100}%"></span></span>
          <span class="dp-bar-val">${v}</span>
        </div>`;
      }).join("")}
    </div>`;

  // 노즈 / 팔레트 / 피니시
  const dpNPF = (d) => `
    <div class="dp-npf">
      ${d.nose ? `<div class="dp-npf-item nose"><span class="dp-npf-ic">👃</span>
        <div class="dp-npf-body"><div class="dp-npf-t">NOSE · 향</div><div class="dp-npf-d">${esc(d.nose)}</div></div></div>` : ""}
      ${d.palate ? `<div class="dp-npf-item palate"><span class="dp-npf-ic">👅</span>
        <div class="dp-npf-body"><div class="dp-npf-t">PALATE · 맛</div><div class="dp-npf-d">${esc(d.palate)}</div></div></div>` : ""}
      ${d.finish ? `<div class="dp-npf-item finish"><span class="dp-npf-ic">🌬️</span>
        <div class="dp-npf-body"><div class="dp-npf-t">FINISH · 여운</div><div class="dp-npf-d">${esc(d.finish)}</div></div></div>` : ""}
    </div>`;

  // 단계별 리스트
  const dpSteps = (arr) => `
    <div class="dp-steps">
      ${arr.map((s, i) => `<div class="dp-step${i === arr.length - 1 ? " end" : ""}">
        <span class="dp-step-no"></span><div class="dp-step-t">${esc(s)}</div></div>`).join("")}
    </div>`;

  // 팁 / 실수
  const dpList = (arr, kind) => `
    <div class="dp-list">
      ${arr.map((t) => `<div class="dp-li ${kind}"><span class="dp-li-ic">${kind === "tip" ? "✓" : "✕"}</span><span>${esc(t)}</span></div>`).join("")}
    </div>`;

  // 변형 카드
  const dpVars = (arr) => `
    <div class="dp-vars">
      ${arr.map((v) => `<div class="dp-var">
        <div class="dp-var-n">${esc(v.n)}</div>
        <div class="dp-var-d">${esc(v.d)}</div></div>`).join("")}
    </div>`;

  // 태그를 누르면 같은 태그가 붙은 술만 도감에서 모아 보여줍니다.
  const dpTags = (arr) => `<div class="dp-tags">${arr.map((t) =>
    `<button class="dp-tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>`;

  // 상단 점프 목차
  const dpToc = (items) =>
    items.length < 2 ? "" : `
    <div class="dp-toc">
      ${items.map((it) => `<button class="dp-toc-btn" data-jump="dp-${it[0]}">${esc(it[1])}</button>`).join("")}
    </div>`;

  /* ----- 칵테일 심층 블록 ----- */
  function deepCocktailHTML(sp, d) {
    const s = d.spec || {};
    const toc = [];
    const out = [];

    toc.push(["facts", "한눈에"]);
    out.push(dpSec("facts", "📌", "한눈에 보기", "", dpFacts([
      ["탄생", d.origin],
      ["계열", d.family],
      ["글라스", s.glass],
      ["얼음", s.ice],
      ["기법", s.method],
      ["가니시", s.garnish],
      ["바텐더 기준", s.pro, true],
    ])));

    if (d.profile || d.flavor) {
      toc.push(["taste", "맛 프로필"]);
      out.push(dpSec("taste", "🎯", "맛 프로필", "0~5 기준",
        (d.profile ? dpBars(d.profile) : "") +
        (d.flavor ? `<div style="height:14px"></div><p class="dp-p">${esc(d.flavor)}</p>` : "")));
    }
    if (d.steps) {
      toc.push(["steps", "만드는 법"]);
      out.push(dpSec("steps", "🍸", "제대로 만드는 법", `${d.steps.length}단계`, dpSteps(d.steps)));
    }
    if (d.story) {
      toc.push(["story", "유래"]);
      out.push(dpSec("story", "📖", "유래와 역사", "", dpFold("story", d.story)));
    }
    if (d.tips) {
      toc.push(["tips", "프로 팁"]);
      out.push(dpSec("tips", "💡", "프로 팁", `${d.tips.length}가지`, dpList(d.tips, "tip")));
    }
    if (d.mistakes) {
      toc.push(["miss", "흔한 실수"]);
      out.push(dpSec("miss", "⚠️", "흔한 실수", `${d.mistakes.length}가지`, dpList(d.mistakes, "warn")));
    }
    if (d.variations) {
      toc.push(["vars", "변형"]);
      out.push(dpSec("vars", "🔀", "변형 레시피", `${d.variations.length}종`, dpVars(d.variations)));
    }
    if (d.pairing) {
      toc.push(["pair", "페어링"]);
      out.push(dpSec("pair", "🍽", "어울리는 안주", "",
        `<div class="dp-pair"><span class="dp-pair-ic">🍽</span><span>${esc(d.pairing)}</span></div>`));
    }
    if (d.serve) {
      toc.push(["serve", "서빙 노하우"]);
      out.push(dpSec("serve", "🗣", "손님에게 낼 때", "", `<div class="dp-quote">${esc(d.serve)}</div>`));
    }
    return { toc: dpToc(toc), html: out.join("") };
  }

  /* ----- 위스키(스피릿) 심층 블록 ----- */
  function deepWhiskyHTML(sp, d) {
    const toc = [];
    const out = [];

    toc.push(["facts", "한눈에"]);
    // 위스키가 아닌 술은 "캐스크/냉각여과" 라벨이 맞지 않아서
    // 데이터에서 라벨을 지정할 수 있게 해뒀습니다. (진이면 "주요 보태니컬" 처럼)
    out.push(dpSec("facts", "📌", "한눈에 보기", "", dpFacts([
      ["종류", d.type],
      [d.regionLabel || "지역", d.region],
      [d.ageLabel || "숙성", d.age],
      ["도수", sp.abv ? sp.abv + "%" : ""],
      [d.caskLabel || "캐스크", d.cask, true],
      ["가격대", sp.price],
      [d.filterLabel || "냉각여과·착색", d.filter],
      ["추천 음용법", d.best, true],
    ])));

    if (d.nose || d.palate || d.finish) {
      toc.push(["npf", "테이스팅"]);
      out.push(dpSec("npf", "🥃", "테이스팅 노트", "노즈 · 팔레트 · 피니시", dpNPF(d)));
    }
    if (d.profile) {
      toc.push(["taste", "맛 프로필"]);
      out.push(dpSec("taste", "🎯", "맛 프로필", "0~5 기준", dpBars(d.profile)));
    }
    if (d.story) {
      toc.push(["story", "증류소 이야기"]);
      out.push(dpSec("story", "📖", "증류소와 배경", "", dpFold("story", d.story)));
    }
    if (d.tips) {
      toc.push(["tips", "즐기는 법"]);
      out.push(dpSec("tips", "💡", "더 맛있게 즐기는 법", `${d.tips.length}가지`, dpList(d.tips, "tip")));
    }
    if (d.cocktail) {
      toc.push(["ct", "칵테일 활용"]);
      out.push(dpSec("ct", "🍸", "칵테일로 쓸 때", "", `<p class="dp-p">${esc(d.cocktail)}</p>`));
    }
    if (d.similar) {
      toc.push(["sim", "비슷한 술"]);
      out.push(dpSec("sim", "🔀", "이거 좋아하면 이것도", "", dpVars(d.similar)));
    }
    if (d.pairing) {
      toc.push(["pair", "페어링"]);
      out.push(dpSec("pair", "🍽", "어울리는 안주", "",
        `<div class="dp-pair"><span class="dp-pair-ic">🍽</span><span>${esc(d.pairing)}</span></div>`));
    }
    if (d.serve) {
      toc.push(["serve", "서빙 노하우"]);
      out.push(dpSec("serve", "🗣", "손님에게 낼 때", "", `<div class="dp-quote">${esc(d.serve)}</div>`));
    }
    if (d.tags) out.push(dpSec("tags", "🏷", "키워드", "", dpTags(d.tags)));

    return { toc: dpToc(toc), html: out.join("") };
  }

  // 접기 버튼 · 목차 점프 배선
  function wireDeep(root) {
    $$(root + " .dp-fold-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const box = b.closest(".dp-fold");
        const open = box.classList.toggle("closed");
        b.textContent = open ? "전문 보기 ▾" : "접기 ▴";
      }));
    $$(root + " .dp-toc-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const el = document.getElementById(b.dataset.jump);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    // 태그 → 같은 태그를 가진 술 목록으로
    $$(root + " .dp-tag[data-tag]").forEach((b) =>
      b.addEventListener("click", () => {
        state.dogamTag = b.dataset.tag;
        state.dogamKind = "spirit";
        state.dogamCat = "전체";
        state.dogamRegion = "전체";
        state.dogamAbv = "전체";
        state.dogamPrice = "전체";
        $("#spirit-search").value = "";
        renderDogam();
        show("dogam");
      }));
  }

  /* ---------- 술 상세 ---------- */
  function openSpirit(id) {
    rememberScroll("dogam");
    state.curSpirit = id;
    state.reviewStars = 5;
    state.ctMult = 1;
    renderSpiritDetail();
    renderStarPick();
    show("spirit");
    // 심층 데이터가 아직 안 왔으면 받은 뒤 한 번 더 그립니다.
    // (그 사이에 다른 술로 넘어갔으면 다시 그리지 않아요)
    if (!DeepData.settled) {
      DeepData.load().then(() => { if (state.curSpirit === id) renderSpiritDetail(); });
    }
  }
  function renderSpiritDetail() {
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    const avg = avgStars(sp);
    const isCt = sp.kind === "cocktail";
    const deep = deepOf(sp);
    // 심층 데이터가 있으면 목차 + 상세 섹션을 만들어 둡니다.
    const dp = deep ? (isCt ? deepCocktailHTML(sp, deep) : deepWhiskyHTML(sp, deep)) : null;
    $("#spirit-detail").innerHTML = `
      <div class="sp-hero-media">${thumbHTML(sp)}</div>
      <div class="sp-hero">
        <h2>${esc(sp.name)}</h2>
        <div class="sp-sub">${isCt ? esc(sp.base) + " 베이스 칵테일 · 약 " + sp.abv + "%" : esc(sp.cat) + " · " + sp.abv + "%" + (sp.price ? " · " + esc(sp.price) : "")}</div>
        <div class="sp-stars">${starStr(avg)} ${avg ? avg.toFixed(1) : ""} <small>(리뷰 ${sp.reviews.length})</small></div>
        ${deep ? '<div><span class="dp-badge">📚 심층 도감</span></div>' : ""}
        <div class="cellar-row">
          <button class="cellar-btn ${inCellar("tried", sp.id) ? "on" : ""}" id="cellar-tried">🥃 마셔봤어요</button>
          <button class="cellar-btn ${inCellar("wish", sp.id) ? "on" : ""}" id="cellar-wish">⭐ 위시리스트</button>
        </div>
      </div>
      ${deep && deep.tagline ? `<div class="dp-tagline">${esc(deep.tagline)}</div>` : ""}
      ${dp ? dp.toc : ""}
      ${isCt ? `
      <div class="sp-body">
        <h3>재료 🧾
          <span class="mult-seg">
            ${[1, 2, 4].map((m) => `<button class="mult-btn ${state.ctMult === m ? "on" : ""}" data-m="${m}">${m}잔</button>`).join("")}
          </span>
        </h3>
        <p>${esc(scaleIngs(sp.ings, state.ctMult))}</p>
      </div>
      ${deep && deep.steps ? "" : `
      <div class="sp-body">
        <h3>만드는 법 🍸</h3>
        <p>${esc(sp.recipe)}</p>
      </div>`}` : ""}
      ${dp ? dp.html : ""}
      <div class="sp-body">
        <h3>${isCt ? "한 줄 메모" : "한 줄 요약"} 📝</h3>
        <p>${esc(sp.note || (deep ? deep.tagline : "") || "아직 설명이 없어요.")}</p>
        <div class="sp-by">등록 · ${esc(sp.by)} · ${fmtTime(sp.time)}</div>
      </div>
      <div class="comment-sec-title">리뷰 ${sp.reviews.length}</div>
      ${sp.reviews.map((r, vi) => `
        <div class="review-item">
          <span class="avatar" style="background:${COLORS[r.color]}"></span>
          <div class="review-body">
            <div class="review-head">
              <span class="review-nick">익명${r.mine ? " (나)" : ""}</span>
              <span class="review-stars">${starStr(r.stars)}</span>
              ${r.mine ? `<button class="cmt-del" data-vi="${vi}">삭제</button>` : ""}
              <span class="review-time">${fmtTime(r.time)}</span>
            </div>
            ${r.text ? `<div class="review-text">${escMsg(r.text)}</div>` : ""}
            ${r.img ? `<img class="cmt-img" src="${r.img}" alt="리뷰 사진">` : ""}
          </div>
        </div>`).join("") || '<div class="empty-state" style="padding:32px 0">첫 리뷰를 남겨보세요!</div>'}
      <div style="height:24px"></div>`;
    wireImgFallback("#spirit-detail");
    wireDeep("#spirit-detail");
    $$("#spirit-detail .cmt-img").forEach((im) =>
      im.addEventListener("click", () => openLightbox(im.src)));
    $("#cellar-tried").addEventListener("click", () => { toggleCellar("tried", sp.id); renderSpiritDetail(); });
    $("#cellar-wish").addEventListener("click", () => { toggleCellar("wish", sp.id); renderSpiritDetail(); });
    $$("#spirit-detail .cmt-del").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirm("리뷰를 삭제할까요?")) return;
        sp.reviews.splice(+b.dataset.vi, 1);
        saveSpirits();
        renderSpiritDetail();
      }));
    $("#spirit-delete").hidden = !sp.mine;
    $("#spirit-report").hidden = !!sp.mine;
    $$("#spirit-detail .mult-btn").forEach((b) =>
      b.addEventListener("click", () => { state.ctMult = +b.dataset.m; renderSpiritDetail(); }));
    const hero = $("#spirit-detail .sp-hero-media img.thumb-img");
    if (hero) {
      hero.style.cursor = "zoom-in";
      hero.addEventListener("click", (e) => { e.stopPropagation(); openLightbox(hero.src); });
    }
  }
  function renderStarPick() {
    $("#star-pick").innerHTML = [1, 2, 3, 4, 5].map((n) =>
      `<button class="${n <= state.reviewStars ? "on" : ""}" data-n="${n}">⭐</button>`).join("");
    $$("#star-pick button").forEach((b) =>
      b.addEventListener("click", () => { state.reviewStars = +b.dataset.n; renderStarPick(); }));
  }
  /* ---------- 댓글/리뷰 사진 첨부 상태 ---------- */
  const CMT_KEY = { "comment": "post", "meet-comment": "meet", "review": "review" };
  const pendingImg = { post: null, meet: null, review: null };
  function clearCmtAttach(prefix) {
    pendingImg[CMT_KEY[prefix]] = null;
    $("#" + prefix + "-attach").hidden = true;
    $("#" + prefix + "-file").value = "";
  }

  function addReview() {
    const text = $("#review-input").value.trim();
    if (!text && !pendingImg.review) return;
    if (isBanned() || !isClean(text)) return;
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    const rv = { id: newId(), color: state.user.color, stars: state.reviewStars, text, time: Date.now(), mine: true };
    if (pendingImg.review) rv.img = pendingImg.review;
    sp.reviews.push(rv);
    state.user.myReviews++;
    saveSpirits(); saveUser();
    Sync.saveReview(sp.id, rv);
    $("#review-input").value = "";
    clearCmtAttach("review");
    renderSpiritDetail();
    addPoints(30, "리뷰 작성");
    checkBadges();
  }

  /* ---------- 술/칵테일 등록 ---------- */
  function renderSpiritWrite() {
    $("#sw-heading").textContent = state.swKind === "spirit" ? "술 등록" : "칵테일 등록";
    $$("#sw-kind .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.kind === state.swKind));
    $("#sw-cat-label").textContent = state.swKind === "spirit" ? "종류" : "베이스";
    $("#sw-note-label").textContent = state.swKind === "spirit" ? "테이스팅 노트 / 설명" : "메모 / 팁";
    $("#sw-name").placeholder = state.swKind === "spirit" ? "예) 글렌피딕 12년" : "예) 네그로니";
    $("#sw-price-wrap").style.display = state.swKind === "spirit" ? "" : "none";
    $("#sw-cocktail-fields").hidden = state.swKind === "spirit";

    $("#sw-emoji").innerHTML = EMOJIS.map((e, i) =>
      `<button class="emoji-opt ${i === state.swEmoji ? "sel" : ""}" data-i="${i}">${e}</button>`).join("");
    $$("#sw-emoji .emoji-opt").forEach((b) =>
      b.addEventListener("click", () => { state.swEmoji = +b.dataset.i; renderSpiritWrite(); }));

    const cats = state.swKind === "spirit" ? SPIRIT_CATS : COCKTAIL_BASES;
    if (!cats.includes(state.swCat)) state.swCat = null;
    $("#sw-cat").innerHTML = cats.map((c) =>
      `<button class="chip ${c === state.swCat ? "active" : ""}" data-c="${c}">${c}</button>`).join("");
    $$("#sw-cat .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.swCat = ch.dataset.c; renderSpiritWrite(); }));
    updateSwSubmit();
  }
  function setSwImg(dataUrl) {
    state.swImg = dataUrl;
    $("#sw-img-preview").hidden = !dataUrl;
    $("#sw-photo-btn").style.display = dataUrl ? "none" : "";
    if (dataUrl) $("#sw-img-el").src = dataUrl;
  }
  function updateSwSubmit() {
    const baseOk = $("#sw-name").value.trim() && state.swCat && $("#sw-abv").value !== "";
    const ctOk = state.swKind === "spirit" || ($("#sw-ings").value.trim() && $("#sw-recipe").value.trim());
    const ok = baseOk && ctOk;
    $("#sw-submit").disabled = !ok;
    $("#sw-submit").classList.toggle("ready", !!ok);
  }
  function submitSpirit() {
    if ($("#sw-submit").disabled) return;
    const newName = $("#sw-name").value.trim();
    // 장난 등록 방지: 정지·금칙어·도수 범위·이름 길이·하루 등록 제한
    if (isBanned()) return;
    if (!isClean(newName, $("#sw-note").value, $("#sw-ings").value, $("#sw-recipe").value)) return;
    if (newName.length < 2) { toast("이름은 2자 이상 입력해주세요."); return; }
    const abvVal = +$("#sw-abv").value;
    if (isNaN(abvVal) || abvVal < 0 || abvVal > 99) { toast("도수는 0~99% 사이로 입력해주세요."); return; }
    if (state.spirits.some((s) => s.name === newName) &&
      !confirm(`'${newName}'은(는) 이미 도감에 있어요. 그래도 등록할까요?`)) return;
    if (overDailyLimit("spirit", 5, "도감 등록")) return;
    const id = newId();
    const item = {
      id, kind: state.swKind, emoji: EMOJIS[state.swEmoji],
      name: newName, abv: abvVal,
      note: $("#sw-note").value.trim(), by: "익명", time: Date.now(), reviews: [], mine: true,
    };
    const imgUrl = $("#sw-img").value.trim();
    if (state.swImg) item.img = state.swImg;
    else if (/^https?:\/\//.test(imgUrl)) item.img = imgUrl;
    if (state.swKind === "spirit") {
      item.cat = state.swCat;
      item.price = $("#sw-price").value.trim();
    } else {
      item.base = state.swCat;
      item.ings = $("#sw-ings").value.trim();
      item.recipe = $("#sw-recipe").value.trim();
    }
    state.spirits.push(item);
    state.user.mySpiritIds.push(id);
    saveSpirits(); saveUser();
    Sync.saveSpirit(item);
    checkKeywords(item.name, item.note || "");
    ["sw-name", "sw-abv", "sw-price", "sw-note", "sw-ings", "sw-recipe", "sw-img"].forEach((i) => { $("#" + i).value = ""; });
    setSwImg(null);
    $("#sw-file").value = "";
    state.dogamKind = state.swKind;
    state.dogamCat = "전체";
    $$("#dogam-seg .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.kind === state.dogamKind));
    show("dogam");
    addPoints(50, state.swKind === "spirit" ? "술 등록" : "칵테일 등록");
    addNoti(state.swKind === "spirit" ? "🥃" : "🍸", `'${item.name}' 을(를) 술도감에 등록했어요.`);
  }

  /* ---------- 모임 ---------- */
  function renderMeets() {
    $("#meet-regions").innerHTML = REGIONS.map((r) =>
      `<button class="chip ${r === state.meetRegion ? "active" : ""}" data-r="${r}">${r}</button>`).join("");
    $$("#meet-regions .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.meetRegion = ch.dataset.r; renderMeets(); }));

    const isPast = (m) => m.date < Date.now();
    const list = state.meets
      .filter((m) => state.meetRegion === "전체" || m.region === state.meetRegion)
      .sort((a, b) => (isPast(a) - isPast(b)) || (isPast(a) ? b.date - a.date : a.date - b.date));
    $("#meet-list").innerHTML = list.length
      ? list.map((m) => {
        const past = isPast(m);
        const full = m.joined >= m.max;
        return `
        <div class="meet-item ${past ? "past" : ""}" data-id="${m.id}">
          <div class="meet-top">
            <span class="meet-region">${esc(m.region)}</span>
            <span class="meet-state ${past || full ? "closed" : ""}">${past ? "종료" : full ? "마감" : "모집중"}</span>
            ${m.mine ? '<span class="my-tag">내 모임</span>' : ""}
          </div>
          <div class="meet-title">${esc(m.title)}</div>
          <div class="meet-info">📅 ${fmtDate(m.date)}<br>📍 ${esc(m.place)}</div>
          <div class="meet-foot">
            <span class="avatar" style="background:${COLORS[m.hostColor]}"></span>
            <span style="font-size:13.5px;color:var(--text-sub)">${esc(m.host)}</span>
            <span class="meet-people"><b>${m.joined}</b>/${m.max}명</span>
          </div>
        </div>`;
      }).join("")
      : '<div class="empty-state">이 지역엔 아직 모임이 없어요.<br>오른쪽 아래 + 버튼으로 첫 모임을 만들어보세요!</div>';
    $$("#meet-list .meet-item").forEach((el) =>
      el.addEventListener("click", () => openMeet(+el.dataset.id)));
  }

  function openMeet(id) {
    rememberScroll("meet");
    state.curMeet = id;
    renderMeetDetail();
    show("meet-detail");
  }
  function renderMeetDetail() {
    const m = state.meets.find((x) => x.id === state.curMeet);
    if (!m) return;
    const full = m.joined >= m.max && !m.isJoined;
    $("#meet-detail").innerHTML = `
      <div class="md-wrap">
        <div class="meet-top">
          <span class="meet-region">${esc(m.region)}</span>
          <span class="meet-state ${m.joined >= m.max ? "closed" : ""}">${m.joined >= m.max ? "마감" : "모집중"}</span>
          ${m.mine ? '<span class="my-tag">내 모임</span>' : ""}
        </div>
        <div class="md-title">${esc(m.title)}</div>
        <div class="md-info-card">
          <div class="md-info-row"><span class="ic">📅</span><span>${fmtDate(m.date)}</span></div>
          <div class="md-info-row"><span class="ic">📍</span><span>${esc(m.place)}</span></div>
          <div class="md-info-row"><span class="ic">👥</span><span><b>${m.joined}</b>/${m.max}명 참여중</span></div>
          <div class="md-info-row"><span class="ic">👤</span><span>주최 · ${esc(m.host)}</span></div>
        </div>
        <div class="md-desc">${esc(m.desc)}</div>
        ${m.mine ? `
        <button class="join-btn joined" id="meet-delete">모임 삭제하기</button>` : m.date < Date.now() ? `
        <button class="join-btn full" disabled>종료된 모임이에요</button>` : `
        <button class="join-btn ${m.isJoined ? "joined" : ""} ${full ? "full" : ""}" id="meet-join">
          ${m.isJoined ? "참여 취소하기" : full ? "모집이 마감되었어요" : "참여하기 🙋"}
        </button>
        <button class="host-chat-btn" id="meet-host-chat">💬 주최자에게 1:1 채팅</button>`}
      </div>
      <div class="comment-sec-title">댓글 ${m.comments.length}</div>
      ${m.comments.map((c, mi) => `
        <div class="comment-item">
          <span class="avatar" style="background:${COLORS[c.color]}"></span>
          <div class="comment-body">
            <div class="comment-head"><span class="comment-nick">익명${c.mine ? " (나)" : ""}</span><span class="comment-time">${fmtTime(c.time)}</span>${c.mine ? `<button class="cmt-del" data-mi="${mi}">삭제</button>` : ""}</div>
            ${c.text ? `<div class="comment-text">${escMsg(c.text)}</div>` : ""}
            ${c.img ? `<img class="cmt-img" src="${c.img}" alt="댓글 사진">` : ""}
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    $$("#meet-detail .cmt-img").forEach((im) =>
      im.addEventListener("click", () => openLightbox(im.src)));
    $$("#meet-detail .cmt-del").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        m.comments.splice(+b.dataset.mi, 1);
        saveMeets();
        renderMeetDetail();
      }));
    const joinBtn = $("#meet-join");
    if (joinBtn) joinBtn.addEventListener("click", () => {
      if (full) return;
      m.isJoined = !m.isJoined;
      m.joined += m.isJoined ? 1 : -1;
      saveMeets();
      Sync.joinMeet(m.id, m.isJoined);
      renderMeetDetail();
      if (m.isJoined) {
        toast("모임에 참여했어요! 🎉");
        addNoti("🍻", `'${m.title}' 모임에 참여했어요. ${fmtDate(m.date)} 잊지 마세요!`);
        if ("Notification" in window && Notification.permission === "default")
          Notification.requestPermission().catch(() => {});
        checkBadges();
      } else toast("참여를 취소했어요.");
    });
    const chatBtn = $("#meet-host-chat");
    if (chatBtn) chatBtn.addEventListener("click", () =>
      openChatWith(m.hostColor, `meet:${m.id}`, `모임 '${m.title}' 주최자`, m.authorId));
    const delMeet = $("#meet-delete");
    if (delMeet) delMeet.addEventListener("click", () => {
      if (!confirm("모임을 삭제할까요? 참여자들에게는 취소로 표시돼요.")) return;
      state.meets = state.meets.filter((x) => x.id !== m.id);
      saveMeets();
      show("meet");
      toast("모임을 삭제했어요.");
    });
  }
  function addMeetComment() {
    const text = $("#meet-comment-input").value.trim();
    if (!text && !pendingImg.meet) return;
    if (isBanned() || !isClean(text)) return;
    const m = state.meets.find((x) => x.id === state.curMeet);
    if (!m) return;
    const c = { id: newId(), color: state.user.color, text, time: Date.now(), mine: true };
    if (pendingImg.meet) c.img = pendingImg.meet;
    m.comments.push(c);
    state.user.myComments++;
    saveMeets(); saveUser();
    Sync.saveMeetComment(m.id, c);
    $("#meet-comment-input").value = "";
    clearCmtAttach("meet-comment");
    renderMeetDetail();
    checkBadges();
  }

  /* ---------- 모임 만들기 ---------- */
  function renderMeetWrite() {
    const regions = REGIONS.slice(1);
    $("#mw-region").innerHTML = regions.map((r) =>
      `<button class="chip ${r === state.mwRegion ? "active" : ""}" data-r="${r}">${r}</button>`).join("");
    $$("#mw-region .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.mwRegion = ch.dataset.r; renderMeetWrite(); }));
    updateMwSubmit();
  }
  function updateMwSubmit() {
    const ok = $("#mw-title").value.trim() && state.mwRegion && $("#mw-date").value &&
      $("#mw-place").value.trim() && +$("#mw-max").value >= 2;
    $("#mw-submit").disabled = !ok;
    $("#mw-submit").classList.toggle("ready", !!ok);
  }
  function submitMeet() {
    if ($("#mw-submit").disabled) return;
    if (isBanned() || !isClean($("#mw-title").value, $("#mw-desc").value)) return;
    if (overDailyLimit("meet", 3, "모임 만들기")) return;
    const dateStr = $("#mw-date").value + "T" + ($("#mw-time").value || "19:00");
    const id = newId();
    const meet = {
      id, region: state.mwRegion, title: $("#mw-title").value.trim(),
      date: new Date(dateStr).getTime(), place: $("#mw-place").value.trim(),
      max: +$("#mw-max").value, joined: 1, desc: $("#mw-desc").value.trim(),
      host: "익명(나)", hostColor: state.user.color, isJoined: true, mine: true, comments: [],
    };
    state.meets.push(meet);
    saveMeets();
    Sync.saveMeet(meet);
    checkKeywords(meet.title, meet.desc);
    ["mw-title", "mw-date", "mw-time", "mw-place", "mw-max", "mw-desc"].forEach((i) => { $("#" + i).value = ""; });
    state.mwRegion = null;
    show("meet");
    addPoints(50, "모임 개설");
    addNoti("🍻", `'${meet.title}' 모임을 만들었어요. ${fmtDate(meet.date)}`);
  }

  /* ---------- 커뮤니티 ---------- */
  function renderPosts() {
    const q = $("#post-search").value.trim();
    const hidden = state.user.hiddenPosts || [];
    let list = state.posts.filter((p) => !hidden.includes(p.id) && !isBlockedPost(p));
    if (state.commTab === "hot") list = list.filter((p) => p.cat === "hot" || p.likes + p.comments.length >= 10);
    else if (state.commTab !== "all") list = list.filter((p) => p.cat === state.commTab);
    if (q) list = list.filter((p) => has(p.title, q) || has(p.body, q));
    const isBoost = (x) => x.boostUntil && x.boostUntil > Date.now() ? 1 : 0;
    list.sort((a, b) => isBoost(b) - isBoost(a) || b.time - a.time);

    const ph = { all: "커뮤니티 전체 검색", hot: "커뮤니티 인기 검색", free: "커뮤니티 자유 검색", promo: "커뮤니티 홍보 검색" };
    $("#post-search").placeholder = ph[state.commTab];

    $("#post-list").innerHTML = list.length
      ? list.map(postItemHTML).join("")
      : '<div class="empty-state">게시글이 없어요.</div>';
    $$("#post-list .post-item").forEach((el) =>
      el.addEventListener("click", () => openPost(+el.dataset.id)));
  }
  function postItemHTML(p) {
    return `
      <div class="post-item" data-id="${p.id}">
        <div class="post-main">
          <div class="post-head">
            <span class="avatar" style="background:${COLORS[p.color]}"></span>
            ${p.boostUntil && p.boostUntil > Date.now() ? '<span class="boost-tag">📌 AD</span>' : ""}
            ${p.cat === "promo" ? `<span class="post-nick">📢 ${esc(p.nick)}</span>` : ""}
            <span class="post-time">· ${fmtTime(p.time)}</span>
            ${p.mine ? '<span class="my-tag">내 글</span>' : ""}
          </div>
          <div class="post-title">${esc(p.title)}</div>
          <div class="post-preview">${esc(p.body)}</div>
          <div class="post-counts">
            <span class="count ${p.likedByMe ? "liked" : ""}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>${p.likes}</span>
            <span class="count"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg>${p.comments.length}</span>
          </div>
        </div>
        <div class="post-side">
          <span class="cat-tag">${CAT_LABEL[p.cat] || "자유"}</span>
          ${p.img ? `<span class="post-thumb"><img src="${p.img}" alt=""></span>` : p.emoji ? `<span class="post-thumb">${p.emoji}</span>` : ""}
        </div>
      </div>`;
  }
  function renderMyPosts() {
    const list = state.posts.filter((p) => p.mine).sort((a, b) => b.time - a.time);
    $("#mypost-list").innerHTML = list.length
      ? list.map(postItemHTML).join("")
      : '<div class="empty-state">아직 작성한 글이 없어요.<br>커뮤니티에 첫 글을 남겨보세요!</div>';
    $$("#mypost-list .post-item").forEach((el) =>
      el.addEventListener("click", () => openPost(+el.dataset.id)));
  }

  /* ---------- 게시글 상세 ---------- */
  function openBizSheet(nick) {
    const posts = state.posts.filter((x) => x.cat === "promo" && x.nick === nick);
    const views = posts.reduce((a, x) => a + (x.views || 0), 0);
    const type = (posts.find((x) => x.biz) || {}).biz || "비즈니스";
    const color = posts.length ? posts[0].color : 3;
    openSheetHTML(`
      <div class="detail-head" style="margin-bottom:10px">
        <span class="avatar md" style="background:${COLORS[color]}"></span>
        <div><div class="detail-nick">${esc(nick)} <span class="biz-tag">📢 ${esc(type)}</span></div>
        <div class="detail-time">홍보 글 ${posts.length}개 · 총 조회 ${fmtNum(views)}</div></div>
      </div>
      <h3 style="margin:8px 0">올린 홍보 글</h3>
      ${posts.slice(0, 6).map((x) => `
        <button class="sheet-opt" data-bizpost="${x.id}">${esc(x.title)} <small style="color:var(--text-sub)">· 조회 ${x.views || 0}</small></button>`).join("") || '<p class="sheet-note">홍보 글이 없어요.</p>'}
      <button class="big-btn accent ready" id="biz-chat" style="margin-top:14px">💬 1:1 문의하기</button>`);
    $$(".sheet [data-bizpost]").forEach((b) =>
      b.addEventListener("click", () => {
        const bd = document.querySelector(".sheet-backdrop");
        if (bd) bd.remove();
        openPost(+b.dataset.bizpost);
      }));
    const chatB = document.querySelector(".sheet #biz-chat");
    if (chatB) chatB.addEventListener("click", () => {
      const bd = document.querySelector(".sheet-backdrop");
      if (bd) bd.remove();
      openChatWith(color, "biz:" + nick, `${nick} 문의`, (posts.find((x) => x.authorId) || {}).authorId);
    });
  }
  function openPost(id) {
    rememberScroll("community");
    state.curPost = id;
    const p = state.posts.find((x) => x.id === id);
    if (p) { p.views = (p.views || 0) + 1; savePosts(); if (p.remote) Sync.bumpViews(p.id, p.views); }
    renderPostDetail();
    show("post");
  }
  function renderPostDetail() {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    $("#post-delete").hidden = !p.mine;
    $("#post-edit").hidden = !p.mine;
    $("#post-chat").hidden = !!p.mine;
    state.replyTo = null;
    $("#reply-bar").hidden = true;
    $("#post-detail").innerHTML = `
      <div class="detail-wrap">
        <div class="detail-head">
          <span class="avatar md" style="background:${COLORS[p.color]}"></span>
          <div><div class="detail-nick">${p.cat === "promo" ? `<span class="biz-link" id="biz-link">${esc(p.nick)}</span>` : esc(p.nick)}${p.cat === "promo" ? ` <span class="biz-tag">📢 ${esc(p.biz || "비즈니스")}</span>` : ""}${p.mine ? ' <span class="my-tag">내 글</span>' : ""}</div><div class="detail-time">${fmtTime(p.time)}${p.edited ? " · 수정됨" : ""} · 조회 ${p.views || 0}</div></div>
          <span class="cat-tag detail-cat">${CAT_LABEL[p.cat] || "자유"}</span>
        </div>
        <div class="detail-title">${esc(p.title)}</div>
        ${p.img ? `<img class="detail-img" src="${p.img}" alt="첨부 이미지">` : ""}
        <div class="detail-body">${esc(p.body)}</div>
        ${p.contact ? `<a class="host-chat-btn" style="display:block;text-align:center;text-decoration:none;margin-bottom:14px" href="${p.contact.startsWith("http") ? esc(p.contact) : "tel:" + esc(p.contact.replace(/-/g, ""))}" ${p.contact.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>📞 연락하기 (${esc(p.contact.startsWith("http") ? "링크 열기" : p.contact)})</a>` : ""}
        ${p.mine && p.cat === "promo" ? (p.boostUntil && p.boostUntil > Date.now()
          ? `<p class="sheet-note" style="text-align:center">📌 상단 고정 중 (~${fmtTime(p.boostUntil)})</p>`
          : `<button class="host-chat-btn" id="boost-btn" style="margin-bottom:14px">📌 상단 고정 24시간 (300P)</button>`) : ""}
        <div class="detail-actions">
          <button class="like-btn ${p.likedByMe ? "liked" : ""}" id="detail-like">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>공감 ${p.likes}
          </button>
          <span class="count"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></svg> 댓글 ${p.comments.length}</span>
        </div>
      </div>
      <div class="comment-sec-title">댓글 ${p.comments.length}</div>
      ${p.comments.map((c, ci) => `
        <div class="comment-item">
          <span class="avatar" style="background:${COLORS[c.color]}"></span>
          <div class="comment-body">
            <div class="comment-head"><span class="comment-nick">익명${c.mine ? " (나)" : ""}</span><span class="comment-time">${fmtTime(c.time)}</span>
              <button class="reply-btn" data-ci="${ci}">답글</button>${c.mine ? `<button class="cmt-del" data-ci="${ci}">삭제</button>` : ""}</div>
            ${c.text ? `<div class="comment-text">${escMsg(c.text)}</div>` : ""}
            ${c.img ? `<img class="cmt-img" src="${c.img}" alt="댓글 사진">` : ""}
            ${(c.replies || []).map((rp, ri) => `
              <div class="reply-item">
                <span class="avatar" style="background:${COLORS[rp.color]}"></span>
                <div class="comment-body">
                  <div class="comment-head"><span class="comment-nick">익명${rp.mine ? " (나)" : ""}</span><span class="comment-time">${fmtTime(rp.time)}</span>${rp.mine ? `<button class="cmt-del" data-ci="${ci}" data-ri="${ri}">삭제</button>` : ""}</div>
                  ${rp.text ? `<div class="comment-text">${escMsg(rp.text)}</div>` : ""}
                  ${rp.img ? `<img class="cmt-img" src="${rp.img}" alt="댓글 사진">` : ""}
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    const boostBtn = $("#boost-btn");
    if (boostBtn) boostBtn.addEventListener("click", () => {
      if (state.user.points < 300) { toast(`포인트가 부족해요. (보유 ${fmtNum(state.user.points)}P / 필요 300P)`); return; }
      if (!confirm("300P로 이 홍보 글을 24시간 상단에 고정할까요?")) return;
      state.user.points -= 300;
      state.user.pointLog.unshift({ amt: -300, reason: "홍보 글 상단 고정", time: Date.now() });
      p.boostUntil = Date.now() + 24 * H;
      saveUser(); savePosts();
      addNoti("📌", `'${p.title.slice(0, 16)}' 홍보 글이 24시간 상단 고정됐어요.`);
      renderPostDetail();
      toast("📌 24시간 상단 고정을 시작했어요!");
    });
    const bizLink = $("#biz-link");
    if (bizLink) bizLink.addEventListener("click", (e) => { e.stopPropagation(); openBizSheet(p.nick); });
    $$("#post-detail .reply-btn").forEach((b) =>
      b.addEventListener("click", () => {
        state.replyTo = +b.dataset.ci;
        $("#reply-bar").hidden = false;
        $("#comment-input").focus();
      }));
    $$("#post-detail .cmt-del").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        const ci = +b.dataset.ci;
        if (b.dataset.ri !== undefined) p.comments[ci].replies.splice(+b.dataset.ri, 1);
        else p.comments.splice(ci, 1);
        savePosts();
        renderPostDetail();
      }));
    $$("#post-detail .cmt-img").forEach((im) =>
      im.addEventListener("click", () => openLightbox(im.src)));
    const dImg = $("#post-detail .detail-img");
    if (dImg) {
      dImg.style.cursor = "zoom-in";
      dImg.addEventListener("click", () => openLightbox(dImg.src));
    }
    $("#detail-like").addEventListener("click", () => {
      p.likedByMe = !p.likedByMe;
      p.likes += p.likedByMe ? 1 : -1;
      savePosts();
      Sync.toggleLike(p.id, p.likedByMe);
      renderPostDetail();
    });
  }
  function addComment() {
    const text = $("#comment-input").value.trim();
    if (!text && !pendingImg.post) return;
    if (isBanned() || !isClean(text)) return;
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    const c = { id: newId(), color: state.user.color, text, time: Date.now(), mine: true };
    if (pendingImg.post) c.img = pendingImg.post;
    let parentCid = null;
    if (state.replyTo !== null && p.comments[state.replyTo]) {
      const parent = p.comments[state.replyTo];
      parent.replies = parent.replies || [];
      parent.replies.push(c);
      parentCid = parent.id || null;   // 서버에 없는 옛 댓글이면 최상위로 저장돼요
    } else {
      p.comments.push(c);
    }
    state.replyTo = null;
    $("#reply-bar").hidden = true;
    state.user.myComments++;
    savePosts(); saveUser();
    Sync.saveComment(p.id, c, parentCid);
    $("#comment-input").value = "";
    clearCmtAttach("comment");
    renderPostDetail();
    checkBadges();
  }
  function deletePost() {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p || !p.mine) return;
    if (!confirm("이 글을 삭제할까요?")) return;
    state.posts = state.posts.filter((x) => x.id !== p.id);
    state.user.myPostIds = state.user.myPostIds.filter((i) => i !== p.id);
    savePosts(); saveUser();
    Sync.deletePost(p.id);
    show("community");
    toast("글을 삭제했어요.");
  }

  /* ---------- 글쓰기 ---------- */
  function updateSubmit() {
    const ok = $("#write-title").value.trim() && $("#write-body").value.trim();
    const btn = $("#write-submit");
    btn.disabled = !ok;
    btn.classList.toggle("ready", !!ok);
  }
  function setPendingImg(dataUrl) {
    state.pendingImg = dataUrl;
    $("#write-img-preview").hidden = !dataUrl;
    $("#write-img").classList.toggle("has-img", !!dataUrl);
    if (dataUrl) $("#write-img-el").src = dataUrl;
  }
  function compressImage(file, cb, maxSize = 900, quality = 0.72) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const draw = (max, q) => {
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        return cv.toDataURL("image/jpeg", q);
      };
      let out = draw(maxSize, quality);
      // 저장소 보호: 압축 결과가 크면 한 단계 더 줄임
      if (out.length > 400000) out = draw(Math.min(maxSize, 560), 0.55);
      cb(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast("이미지를 불러올 수 없어요."); };
    img.src = url;
  }
  function submitPost() {
    const title = $("#write-title").value.trim();
    const body = $("#write-body").value.trim();
    if (!title || !body) return;
    if (isBanned() || !isClean(title, body)) return;
    // 홍보 글은 비즈니스 프로필 필수 (익명 홍보 금지)
    if (state.writeCat === "promo" && !state.user.bizProfile) {
      if (confirm("홍보 글은 익명이 아닌 비즈니스 프로필(상호명)로만 쓸 수 있어요.\n지금 등록하러 갈까요?")) show("settings");
      return;
    }
    const contact = state.writeCat === "promo" ? $("#write-contact").value.trim() : "";
    if (contact && !CONTACT_RE.test(contact)) {
      toast("연락 방법은 전화번호 또는 https:// 링크만 가능해요.");
      return;
    }
    if (state.editPost === null && overDailyLimit("post", 10, "게시글 작성")) return;
    if (state.editPost !== null) {
      // 글 수정 모드
      const p = state.posts.find((x) => x.id === state.editPost);
      if (p) {
        p.title = title; p.body = body; p.cat = state.writeCat; p.edited = true;
        if (state.writeCat === "promo") {
          p.nick = state.user.bizProfile.name; p.biz = state.user.bizProfile.type;
          if (contact) p.contact = contact; else delete p.contact;
        } else { p.nick = "익명"; delete p.biz; delete p.contact; }
        if (state.pendingImg) p.img = state.pendingImg;
        savePosts();
        Sync.savePost(p);
      }
      state.editPost = null;
      $("#view-write .topbar-title").textContent = "글쓰기";
      $("#write-title").value = "";
      $("#write-body").value = "";
      $("#write-contact").value = "";
      setPendingImg(null);
      $("#write-file").value = "";
      updateSubmit();
      if (p) { openPost(p.id); toast("게시글을 수정했어요."); }
      else show("community");
      return;
    }
    const id = newId();
    const post = {
      id, cat: state.writeCat, color: state.user.color,
      nick: state.writeCat === "promo" ? state.user.bizProfile.name : "익명",
      time: Date.now(), title, body, likes: 0, comments: [], mine: true,
    };
    if (state.writeCat === "promo") {
      post.biz = state.user.bizProfile.type;
      if (contact) post.contact = contact;
    }
    if (state.pendingImg) post.img = state.pendingImg;
    state.posts.push(post);
    state.user.myPostIds.push(id);
    savePosts(); saveUser();
    Sync.savePost(post);
    checkBadges();
    checkKeywords(title, body);
    store.set("draft", null);
    $("#write-title").value = "";
    $("#write-body").value = "";
    $("#write-contact").value = "";
    setPendingImg(null);
    $("#write-file").value = "";
    updateSubmit();
    state.commTab = state.writeCat;
    $$("#community-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === state.commTab));
    show("community");
    addPoints(30, "게시글 작성");
  }

  /* ---------- 알림/채팅 ---------- */
  function renderNoti() {
    $("#noti-list").innerHTML = `
      <button class="banner" id="kw-banner">
        <span class="banner-ic">🔔</span>
        <span class="banner-txt">키워드알림 설정${state.user.keywords.length ? ` (${state.user.keywords.length})` : ""}</span>
        <svg viewBox="0 0 24 24" class="chev-r"><path d="M9 6l6 6-6 6"/></svg>
      </button>
      ${state.noti.length
        ? state.noti.map((n) => `
          <div class="noti-item">
            <span class="noti-ic">${n.ic}</span>
            <div class="noti-body">
              <div class="noti-text">${esc(n.text)}</div>
              <div class="noti-time">${fmtRel(n.time)}</div>
            </div>
          </div>`).join("")
        : '<div class="empty-state">알림이 없어요.</div>'}`;
    $("#kw-banner").addEventListener("click", openKeywordSheet);
    state.noti.forEach((n) => { n.read = true; });
    saveNoti();
    updateBadge();
    renderChatList();
  }
  function renderChatList() {
    const list = [...state.chats].sort((a, b) => b.time - a.time);
    $("#chat-list").innerHTML = list.length
      ? list.map((c) => {
        const last = c.msgs[c.msgs.length - 1];
        return `
        <div class="chat-item" data-id="${c.id}">
          <span class="avatar md" style="background:${COLORS[c.color]}"></span>
          <div class="chat-body">
            <div class="chat-nick">익명 <span style="font-weight:500;color:var(--text-sub);font-size:13px">· ${esc(c.ctx)}</span></div>
            <div class="chat-last">${last ? esc(last.text) : "대화를 시작해보세요."}</div>
          </div>
          <div class="chat-right">
            <span class="chat-time">${fmtRel(c.time)}</span>
            ${c.unread ? `<span class="chat-unread">${c.unread > 99 ? "99+" : c.unread}</span>` : ""}
          </div>
        </div>`;
      }).join("")
      : '<div class="empty-state">채팅이 없어요.<br>게시글이나 모임에서 1:1 채팅을 시작해보세요.</div>';
    $$("#chat-list .chat-item").forEach((el) =>
      el.addEventListener("click", () => openChat(+el.dataset.id)));
  }
  async function openChatWith(color, key, ctx, peerId) {
    // 상대 계정을 아는 경우엔 서버 대화방을 씁니다 (상대에게 실제로 전달돼요).
    if (peerId && Sync.ready()) {
      const exist = state.chats.find((x) => x.peerId === peerId);
      if (exist) { openChat(exist.id); return; }
      toast("대화방을 여는 중이에요…");
      const res = await Sync.openConversation(peerId, ctx, state.user.color, color);
      if (!res.ok) { toast("대화를 시작하지 못했어요: " + res.error); return; }
      let c = state.chats.find((x) => x.id === res.conversation.id);
      if (!c) { c = res.conversation; state.chats.push(c); saveChats(); }
      openChat(c.id);
      return;
    }
    // 상대를 특정할 수 없는 문의(스토어 등)는 이 기기에만 남습니다.
    let c = state.chats.find((x) => x.key === key);
    if (!c) {
      const id = newId();
      c = { id, key, color, ctx, msgs: [], time: Date.now(), local: true };
      state.chats.push(c);
      saveChats();
    }
    openChat(c.id);
  }
  function markChatRead(c) {
    if (!c || !c.unread) return;
    c.unread = 0;
    saveChats();
    if (c.remote) Sync.markRead(c.id);
  }
  function openChat(id) {
    state.curChat = id;
    markChatRead(state.chats.find((x) => x.id === id));
    renderChatMsgs();
    show("chat");
  }
  function renderChatMsgs() {
    const c = state.chats.find((x) => x.id === state.curChat);
    if (!c) return;
    $("#chat-avatar").style.background = COLORS[c.color];
    $("#chat-title").textContent = "익명 · " + c.ctx;
    $("#chat-msgs").innerHTML = `
      <div class="chat-hint">${c.remote
        ? "상대방도 익명으로 표시돼요.<br>메시지는 두 사람만 볼 수 있어요. 운영자도 볼 수 없습니다."
        : "이 문의는 이 기기에만 저장돼요."}</div>
      ${c.msgs.map((m) => `
        <div class="bubble-row ${m.me ? "me" : ""}">
          ${m.me ? `<span class="bubble-time">${fmtTime(m.time)}</span>` : ""}
          <div class="bubble">${esc(m.text)}</div>
          ${m.me ? "" : `<span class="bubble-time">${fmtTime(m.time)}</span>`}
        </div>`).join("")}`;
    const area = $("#chat-msgs");
    area.scrollTop = area.scrollHeight;
  }
  function sendChat() {
    const text = $("#chat-input").value.trim();
    if (!text) return;
    const c = state.chats.find((x) => x.id === state.curChat);
    if (!c) return;
    const msg = { id: newId(), me: true, text, time: Date.now() };
    c.msgs.push(msg);
    c.time = msg.time;
    saveChats();
    if (c.remote) Sync.sendMessage(c.id, msg);
    $("#chat-input").value = "";
    renderChatMsgs();
  }

  /* ---------- 마이페이지 ---------- */
  function renderMyPage() {
    $("#my-avatar").style.background = COLORS[state.user.color];
    $("#my-nick").textContent = state.user.nick;
    $("#my-points").textContent = fmtNum(state.user.points) + "P";
    $("#stat-spirits").textContent = state.user.mySpiritIds.length;
    $("#stat-meets").textContent = state.meets.filter((m) => m.isJoined).length;
    $("#stat-posts").textContent = state.posts.filter((p) => p.mine).length;
    $("#favjob-cnt").textContent = state.user.favJobs.length ? state.user.favJobs.length + "개" : "";
    const cel = state.user.cellar.tried.length + state.user.cellar.wish.length;
    $("#cellar-cnt").textContent = cel ? cel + "병" : "";
    $("#blocked-cnt").textContent = blockedKeys().length ? blockedKeys().length + "명" : "";
    checkBadges();
    $("#badge-count").textContent = `${state.user.badges.length}/${BADGES.length}`;
    $("#badge-grid").innerHTML = BADGES.map((b) => {
      const on = state.user.badges.includes(b.id);
      return `<div class="badge-item ${on ? "on" : ""}" title="${esc(b.desc)}">
        <span class="badge-ic">${on ? b.ic : "🔒"}</span>
        <span class="badge-name">${b.name}</span>
      </div>`;
    }).join("");
    $("#btn-admin").hidden = !(state.adminMode || isAdmin());
    const pendingR = (state.serverReports || []).filter((r) => r.status === "접수").length;
    $("#admin-report-cnt").textContent = pendingR ? `신고 ${pendingR}건` : "";
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
    $("#nick-input").value = state.user.nick;
    updateNickBtn();
    renderColorGrid();
    renderBizProfile();
  }

  /* ---------- 비즈니스 프로필 (홍보 계정) ---------- */
  const BIZ_TYPES = ["주류회사", "바/펍", "학원", "용품샵", "기타"];
  function renderBizProfile() {
    const biz = state.user.bizProfile;
    $("#biz-name").value = biz ? biz.name : "";
    state.bizTypeSel = biz ? biz.type : state.bizTypeSel || null;
    $("#biz-type").innerHTML = BIZ_TYPES.map((t) =>
      `<button class="chip ${t === state.bizTypeSel ? "active" : ""}" data-t="${t}">${t}</button>`).join("");
    $$("#biz-type .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.bizTypeSel = ch.dataset.t; renderBizProfile(); updateBizBtn(); }));
    $("#btn-biz-save").textContent = biz ? "비즈니스 프로필 수정" : "비즈니스 프로필 등록";
    $("#btn-biz-remove").hidden = !biz;
    updateBizBtn();
  }
  function updateBizBtn() {
    const ok = $("#biz-name").value.trim().length >= 2 && !!state.bizTypeSel;
    $("#btn-biz-save").disabled = !ok;
    $("#btn-biz-save").classList.toggle("ready", ok);
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
  function updateNickBtn() {
    const v = $("#nick-input").value.trim();
    const ok = v.length >= 1 && v !== state.user.nick;
    $("#btn-nick-save").disabled = !ok;
    $("#btn-nick-save").classList.toggle("ready", ok);
  }

  /* ---------- 바텀시트 ---------- */
  function openSheetHTML(html, onOpen) {
    const bd = document.createElement("div");
    bd.className = "sheet-backdrop";
    bd.innerHTML = `<div class="sheet">${html}</div>`;
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.remove(); });
    $("#app").appendChild(bd);
    if (onOpen) onOpen(bd);
    return bd;
  }
  function openSheet(title, options, selected, onPick) {
    openSheetHTML(
      `<h3>${title}</h3>${options.map((o) => `<button class="sheet-opt ${o === selected ? "sel" : ""}">${o}</button>`).join("")}`,
      (bd) => bd.querySelectorAll(".sheet-opt").forEach((b) =>
        b.addEventListener("click", () => { onPick(b.textContent); bd.remove(); }))
    );
  }
  function openKeywordSheet() {
    const render = (bd) => {
      bd.querySelector(".sheet").innerHTML = `
        <h3>키워드알림 설정</h3>
        <div class="kw-add-row">
          <input type="text" id="kw-input" placeholder="예) 위스키, 강남, 번개" maxlength="12">
          <button class="kw-add-btn" id="kw-add">추가</button>
        </div>
        <div>${state.user.keywords.map((k, i) =>
          `<span class="kw-chip">${esc(k)}<button data-i="${i}" aria-label="삭제">✕</button></span>`).join("") || '<p class="sheet-note">등록한 키워드가 없어요.</p>'}</div>
        <p class="sheet-note">등록한 키워드가 포함된 새 글·모임·술이 등록되면 알림을 보내드려요.</p>`;
      bd.querySelector("#kw-add").addEventListener("click", () => {
        const v = bd.querySelector("#kw-input").value.trim();
        if (!v) return;
        if (state.user.keywords.includes(v)) { toast("이미 등록된 키워드예요."); return; }
        if (state.user.keywords.length >= 10) { toast("키워드는 10개까지 등록할 수 있어요."); return; }
        state.user.keywords.push(v);
        saveUser();
        render(bd);
      });
      bd.querySelector("#kw-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") bd.querySelector("#kw-add").click();
      });
      bd.querySelectorAll(".kw-chip button").forEach((b) =>
        b.addEventListener("click", () => {
          state.user.keywords.splice(+b.dataset.i, 1);
          saveUser();
          render(bd);
        }));
    };
    const bd = openSheetHTML("", render);
    render(bd);
  }
  function openPointSheet() {
    openSheetHTML(`
      <h3>포인트 <span style="color:var(--accent)">${fmtNum(state.user.points)}P</span></h3>
      ${state.user.pointLog.length
        ? state.user.pointLog.map((l) => `
          <div class="sheet-row"><span>${esc(l.reason)}</span><span class="r">${fmtRel(l.time)}</span><span class="amt ${l.amt > 0 ? "plus" : ""}" style="margin-left:12px">${l.amt > 0 ? "+" : ""}${fmtNum(l.amt)}P</span></div>`).join("")
        : '<p class="sheet-note">아직 포인트 내역이 없어요.</p>'}
      <p class="sheet-note">글 작성 +30P · 리뷰 작성 +30P · 술/칵테일 등록 +50P · 모임 개설 +50P</p>`);
  }
  function openSupportSheet() {
    // 익명 서비스라 문의·삭제요청 때 본인을 특정할 수단이 필요해요.
    const uid = Sync.uid;
    openSheetHTML(`
      <h3>고객센터</h3>
      <div class="sheet-row"><span>📧 이메일 문의</span><span class="r">${SUPPORT_EMAIL}</span></div>
      <div class="sheet-row"><span>🕐 운영 시간</span><span class="r">평일 10:00 ~ 19:00</span></div>
      <div class="sheet-row"><span>📱 앱 버전</span><span class="r">v${APP_VER}</span></div>
      ${uid ? `
      <div class="sheet-row"><span>🆔 이용자 번호</span><span class="r" style="font-family:monospace;font-size:12.5px">${esc(uid)}</span></div>
      <button class="big-btn" id="copy-uid" style="margin-top:12px">이용자 번호 복사</button>` : ""}
      <p class="sheet-note">신고·건의사항은 이메일로 보내주시면 영업일 기준 3일 이내에 답변드려요. 커뮤니티 규칙 위반 게시물은 신고 접수 후 24시간 이내에 검토합니다.${uid ? " 게시글 전체 삭제를 요청하실 땐 위 이용자 번호를 함께 보내주세요." : ""}</p>`);
    const btn = document.querySelector(".sheet #copy-uid");
    if (btn) btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(uid);
        toast("이용자 번호를 복사했어요.");
      } catch {
        toast("복사에 실패했어요. 번호를 직접 적어주세요.");
      }
    });
  }

  /* ---------- 약관·정책 문서 (js/legal.js 가 단일 원본) ---------- */
  const DOCS = (window.BARTALK_LEGAL && window.BARTALK_LEGAL.docs) || {};
  function openDoc(key) {
    const d = DOCS[key];
    if (!d) return;
    // 온보딩 중에도 약관을 볼 수 있어야 해서 돌아갈 화면을 기억해둬요.
    state.docFrom = state.view === "doc" ? state.docFrom : state.view;
    $("#view-doc .back-btn").dataset.back = state.docFrom;
    $("#doc-title").textContent = d.title;
    $("#doc-area").innerHTML = `<div class="doc">${d.html}<div style="height:32px"></div></div>`;
    show("doc");
    const sa = $("#view-doc .scroll-area");
    if (sa) sa.scrollTop = 0;
  }
  function openRulesSheet() {
    openSheetHTML(`
      <h3>커뮤니티 이용규칙</h3>
      <div class="sheet-row"><span>1. 서로 존중하는 언어를 사용해주세요.</span></div>
      <div class="sheet-row"><span>2. 광고·도배성 글은 홍보 게시판만 이용해주세요.</span></div>
      <div class="sheet-row"><span>3. 개인정보(실명·연락처·매장 실명 비방)는 올리지 마세요.</span></div>
      <div class="sheet-row"><span>4. 불법 정보, 성적 콘텐츠는 즉시 삭제·제재됩니다.</span></div>
      <div class="sheet-row"><span>5. 모임은 공개된 장소에서, 안전하게 진행해주세요.</span></div>
      <h3 style="margin-top:18px">제재 기준</h3>
      ${SANCTION_RULES.map(([a, b]) => `<div class="sheet-row"><span>${a}</span><b style="margin-left:auto;font-size:13.5px">${b}</b></div>`).join("")}
      <p class="sheet-note">위반 콘텐츠는 상세 화면의 🚩 신고 버튼으로 알려주세요. 관리자가 확인 후 규정에 따라 처리해요.</p>`);
  }

  /* ---------- 스토어 ---------- */
  const cartCount = () => state.cart.reduce((a, c) => a + c.qty, 0);
  const product = (pid) => PRODUCTS.find((p) => p.id === pid);
  function updateCartBadges() {
    const n = cartCount();
    ["cart-badge", "cart-badge2"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.hidden = n === 0;
      el.textContent = n > 99 ? "99+" : n;
    });
  }
  function renderStore() {
    if (!FEATURES.STORE_LIVE) {
      $("#store-banner-ic").textContent = "🚧";
      $("#store-banner-txt").textContent = "정식 오픈 준비 중이에요. 지금은 사전 신청만 받고 있어요.";
    }
    if (!STORE_CATS.includes(state.storeCat)) state.storeCat = "전체";
    $("#store-cats").innerHTML = STORE_CATS.map((c) =>
      `<button class="chip ${c === state.storeCat ? "active" : ""}" data-c="${c}">${c}</button>`).join("");
    $$("#store-cats .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.storeCat = ch.dataset.c; renderStore(); }));

    const q = $("#store-search").value.trim();
    const list = PRODUCTS.filter((p) =>
      (state.storeCat === "전체" || p.cat === state.storeCat) &&
      (!q || has(p.name, q) || has(p.desc, q)));

    $("#product-grid").innerHTML = list.length
      ? list.map((p) => `
        <div class="product-card" data-id="${p.id}">
          <div class="pc-thumb">${p.emoji}${p.tag ? `<span class="pc-tag ${p.tag === "신상" ? "new" : ""}">${p.tag}</span>` : ""}</div>
          <div class="pc-body">
            <div class="pc-name">${esc(p.name)}</div>
            <div class="pc-price">${fmtNum(p.price)}원</div>
            <button class="pc-add" data-add="${p.id}">🛒 담기</button>
          </div>
        </div>`).join("")
      : '<div class="empty-state" style="grid-column:1/-1">검색 결과가 없어요.</div>';
    $$("#product-grid .product-card").forEach((el) =>
      el.addEventListener("click", () => openProduct(+el.dataset.id)));
    $$("#product-grid .pc-add").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(+b.dataset.add, 1);
      }));
    updateCartBadges();
  }

  function openProduct(id) {
    state.curProduct = id;
    state.pdQty = 1;
    renderProductDetail();
    show("market-detail");
  }
  function renderProductDetail() {
    const p = product(state.curProduct);
    if (!p) return;
    $("#product-detail").innerHTML = `
      <div class="pd-hero">${p.emoji}</div>
      <div class="pd-body">
        <div class="market-badges">
          <span class="cat-tag">${esc(p.cat)}</span>
          ${p.tag ? `<span class="pc-tag ${p.tag === "신상" ? "new" : ""}" style="position:static">${p.tag}</span>` : ""}
        </div>
        <div class="pd-name">${esc(p.name)}</div>
        <div class="pd-price">${fmtNum(p.price)}원</div>
        <div class="pd-desc">${esc(p.desc)}</div>
        <div class="qty-row">
          <div class="qty-stepper">
            <button id="pd-minus" ${state.pdQty <= 1 ? "disabled" : ""}>−</button>
            <span>${state.pdQty}</span>
            <button id="pd-plus">+</button>
          </div>
          <span class="pd-total">${fmtNum(p.price * state.pdQty)}원</span>
        </div>
        <div class="pd-actions">
          <button class="mkd-chat-btn outline" id="pd-add">장바구니 담기</button>
          <button class="mkd-chat-btn" id="pd-buy">${FEATURES.STORE_LIVE ? "바로 구매" : "바로 신청"}</button>
        </div>
        <button class="host-chat-btn" id="pd-ask" style="margin-top:12px">💬 상품 문의하기</button>
      </div>
      <div style="height:24px"></div>`;
    $("#pd-minus").addEventListener("click", () => { if (state.pdQty > 1) { state.pdQty--; renderProductDetail(); } });
    $("#pd-plus").addEventListener("click", () => { state.pdQty++; renderProductDetail(); });
    $("#pd-add").addEventListener("click", () => addToCart(p.id, state.pdQty));
    $("#pd-buy").addEventListener("click", () => { addToCart(p.id, state.pdQty, true); show("cart"); });
    $("#pd-ask").addEventListener("click", () =>
      openChatWith(3, "store", `스토어 문의 · ${p.name.slice(0, 12)}${p.name.length > 12 ? "…" : ""}`));
    updateCartBadges();
  }
  function addToCart(pid, qty, silent) {
    const row = state.cart.find((c) => c.pid === pid);
    if (row) row.qty += qty;
    else state.cart.push({ pid, qty });
    saveCart();
    updateCartBadges();
    if (!silent) toast("장바구니에 담았어요. 🛒");
  }

  function renderCart() {
    state.cart = state.cart.filter((c) => product(c.pid));
    const subtotal = state.cart.reduce((a, c) => a + product(c.pid).price * c.qty, 0);
    if (!state.cart.length) {
      $("#cart-area").innerHTML = `
        <div class="empty-state">장바구니가 비어있어요.</div>
        <div style="padding:0 20px"><button class="big-btn accent ready" id="cart-go-store">스토어 구경하기</button></div>`;
      $("#cart-go-store").addEventListener("click", () => show("market"));
      return;
    }
    const ship = subtotal >= 30000 ? 0 : 3000;
    const maxP = Math.min(state.user.points, subtotal + ship);
    const ship0 = store.get("shipInfo", {});
    $("#cart-area").innerHTML = `
      ${state.cart.map((c) => {
        const p = product(c.pid);
        return `
        <div class="cart-item" data-pid="${p.id}">
          <span class="cart-thumb">${p.emoji}</span>
          <div class="cart-info">
            <div class="cart-name">${esc(p.name)}</div>
            <div class="cart-price">${fmtNum(p.price * c.qty)}원</div>
          </div>
          <div class="qty-stepper">
            <button data-d="-1" ${c.qty <= 1 ? "disabled" : ""}>−</button>
            <span>${c.qty}</span>
            <button data-d="1">+</button>
          </div>
          <button class="cart-rm" aria-label="삭제">✕</button>
        </div>`;
      }).join("")}
      <div class="cart-summary">
        ${FEATURES.STORE_LIVE ? "" : `
        <div class="banner static" style="margin:0 0 16px">
          <span class="banner-ic">🚧</span>
          <span class="banner-txt">스토어는 정식 오픈 준비 중이에요. 지금은 <b>사전 신청</b>만 받고 있어요.</span>
        </div>`}
        <label class="form-label">받는 분</label>
        <input type="text" class="input" id="ship-name" placeholder="이름" value="${esc(ship0.name || "")}">
        <label class="form-label">연락처</label>
        <input type="tel" class="input" id="ship-phone" placeholder="010-0000-0000" value="${esc(ship0.phone || "")}">
        <label class="form-label">배송지 주소</label>
        <input type="text" class="input" id="ship-addr" placeholder="주소를 입력해주세요" value="${esc(ship0.addr || "")}">
        <label class="form-label" style="${FEATURES.STORE_LIVE ? "" : "display:none"}">포인트 사용 (보유 ${fmtNum(state.user.points)}P)</label>
        <input type="number" class="input" id="cart-points" placeholder="0" min="0" max="${maxP}" inputmode="numeric" style="${FEATURES.STORE_LIVE ? "" : "display:none"}">
        <div class="calc-result show" id="cart-total"></div>
        <button class="big-btn accent ready" id="cart-order" style="margin-top:16px">${FEATURES.STORE_LIVE ? "주문하기" : "사전 신청하기"}</button>
        <p class="sheet-note">${FEATURES.STORE_LIVE
          ? "주문 후 안내되는 계좌로 입금하면 배송이 시작돼요."
          : "지금은 결제가 진행되지 않아요. 사전 신청만 접수되며, 정식 오픈 시 입력하신 연락처로 안내드려요. 포인트도 차감되지 않아요."} 입력하신 배송 정보는 이 기기에만 저장돼요. 🔒</p>
      </div>
      <div style="height:24px"></div>`;
    const renderTotal = () => {
      let used = Math.floor(+$("#cart-points").value || 0);
      used = FEATURES.STORE_LIVE ? Math.max(0, Math.min(used, maxP)) : 0;
      $("#cart-total").innerHTML = `
        <div class="cr-row"><span>상품 합계</span><b>${fmtNum(subtotal)}원</b></div>
        <div class="cr-row"><span>배송비 ${ship === 0 ? "(3만원 이상 무료)" : ""}</span><b>${ship === 0 ? "무료" : fmtNum(ship) + "원"}</b></div>
        ${FEATURES.STORE_LIVE ? `<div class="cr-row"><span>포인트 할인</span><b>-${fmtNum(used)}P</b></div>` : ""}
        <div class="cr-row hl"><span>${FEATURES.STORE_LIVE ? "결제 예정 금액" : "예상 금액"}</span><b>${fmtNum(subtotal + ship - used)}원</b></div>`;
      return used;
    };
    renderTotal();
    $("#cart-points").addEventListener("input", renderTotal);
    $$("#cart-area .cart-item").forEach((el) => {
      const pid = +el.dataset.pid;
      const row = state.cart.find((c) => c.pid === pid);
      el.querySelectorAll(".qty-stepper button").forEach((b) =>
        b.addEventListener("click", () => {
          row.qty = Math.max(1, row.qty + (+b.dataset.d));
          saveCart(); renderCart();
        }));
      el.querySelector(".cart-rm").addEventListener("click", () => {
        state.cart = state.cart.filter((c) => c.pid !== pid);
        saveCart(); renderCart(); updateCartBadges();
      });
    });
    $("#cart-order").addEventListener("click", () => {
      const shipInfo = {
        name: $("#ship-name").value.trim(),
        phone: $("#ship-phone").value.trim(),
        addr: $("#ship-addr").value.trim(),
      };
      if (!shipInfo.name || !shipInfo.phone || !shipInfo.addr) {
        toast("배송 정보(이름·연락처·주소)를 모두 입력해주세요.");
        return;
      }
      store.set("shipInfo", shipInfo);
      const used = renderTotal();
      const id = Math.max(0, ...state.orders.map((o) => o.id)) + 1;
      state.orders.push({
        id,
        items: state.cart.map((c) => ({ name: product(c.pid).name, price: product(c.pid).price, qty: c.qty })),
        subtotal, ship, used, total: subtotal + ship - used,
        shipTo: shipInfo,
        time: Date.now(), status: FEATURES.STORE_LIVE ? "입금 대기" : "사전 신청",
      });
      saveOrders();
      if (used > 0) {
        state.user.points -= used;
        state.user.pointLog.unshift({ amt: -used, reason: "스토어 주문 사용", time: Date.now() });
        saveUser();
      }
      state.cart = [];
      saveCart();
      updateCartBadges();
      addNoti("📦", FEATURES.STORE_LIVE
        ? `주문 #BT${String(id).padStart(4, "0")}이 접수됐어요. 입금 확인 후 배송이 시작돼요!`
        : `사전 신청 #BT${String(id).padStart(4, "0")}이 접수됐어요. 스토어 정식 오픈 시 안내드릴게요!`);
      show("orders");
      toast(FEATURES.STORE_LIVE ? "주문이 접수되었어요! 📦" : "사전 신청이 접수되었어요! 📦");
    });
  }

  function renderOrders() {
    const list = [...state.orders].sort((a, b) => b.time - a.time);
    $("#orders-area").innerHTML = (FEATURES.STORE_LIVE ? "" : `
      <p class="sheet-note" style="margin:0 0 12px">스토어 정식 오픈 전이라 결제·배송은 진행되지 않아요. 아래는 사전 신청 내역이에요.</p>`)
      + (list.length
      ? list.map((o) => `
        <div class="order-item">
          <div class="order-head">
            <span class="order-no">#BT${String(o.id).padStart(4, "0")}</span>
            <span class="mk-state reserved">${esc(o.status)}</span>
            <span class="order-date">${fmtTime(o.time)}</span>
          </div>
          <div class="order-title">${esc(o.items[0].name)}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}</div>
          <div class="order-total">${fmtNum(o.total)}원 ${o.used ? `<small style="color:var(--text-sub);font-weight:500">(${fmtNum(o.used)}P 할인)</small>` : ""}</div>
        </div>`).join("")
      : `<div class="empty-state">${FEATURES.STORE_LIVE ? "주문 내역이" : "사전 신청 내역이"} 없어요.</div>`);
  }

  /* ---------- 근무일지 ---------- */
  function wlMonth() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + state.wlOffset, 1);
  }
  function renderWorklog() {
    const m = wlMonth();
    const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    $("#wl-month").textContent = `${m.getFullYear()}년 ${m.getMonth() + 1}월`;
    $("#wl-next").disabled = state.wlOffset >= 0;
    if (!$("#wl-date").value) $("#wl-date").value = new Date(now - new Date().getTimezoneOffset() * M).toISOString().slice(0, 10);
    const wage = +($("#wl-wage").value || store.get("wage", ""));
    if (!$("#wl-wage").value && wage) $("#wl-wage").value = wage;

    const entries = state.worklog.filter((w) => w.date.startsWith(ym)).sort((a, b) => b.date.localeCompare(a.date));
    const hours = entries.reduce((a, w) => a + w.hours, 0);
    const tips = entries.reduce((a, w) => a + (w.tip || 0), 0);
    $("#wl-summary").innerHTML = `
      <div class="cr-row"><span>근무 일수</span><b>${entries.length}일</b></div>
      <div class="cr-row"><span>총 근무시간</span><b>${Math.round(hours * 10) / 10}시간</b></div>
      <div class="cr-row"><span>팁 합계</span><b>${fmtNum(tips)}원</b></div>
      <div class="cr-row hl"><span>예상 수입 ${wage ? "" : "(시급 입력 필요)"}</span><b>${wage ? fmtNum(Math.round(hours * wage + tips)) + "원" : "-"}</b></div>`;
    $("#wl-list").innerHTML = entries.length
      ? entries.map((w) => `
        <div class="wl-item" data-id="${w.id}">
          <span class="wl-date">${w.date.slice(5).replace("-", "/")}</span>
          <div class="wl-info">
            <div class="wl-hours">${w.hours}시간 ${w.tip ? `<span class="wl-tip">+팁 ${fmtNum(w.tip)}원</span>` : ""}</div>
            ${w.memo ? `<div class="wl-memo">${esc(w.memo)}</div>` : ""}
          </div>
          <button class="cart-rm" aria-label="삭제">✕</button>
        </div>`).join("")
      : '<div class="empty-state" style="padding:30px 0">이 달의 기록이 없어요.</div>';
    $$("#wl-list .cart-rm").forEach((b) =>
      b.addEventListener("click", () => {
        const id = +b.closest(".wl-item").dataset.id;
        state.worklog = state.worklog.filter((w) => w.id !== id);
        saveWorklog(); renderWorklog();
      }));
    updateWlAdd();
  }
  function updateWlAdd() {
    const ok = $("#wl-date").value && +$("#wl-hours").value > 0;
    $("#wl-add").disabled = !ok;
    $("#wl-add").classList.toggle("ready", !!ok);
  }
  function addWorklog() {
    if ($("#wl-add").disabled) return;
    const id = newId();
    state.worklog.push({
      id, date: $("#wl-date").value, hours: +$("#wl-hours").value,
      tip: +$("#wl-tip").value || 0, memo: $("#wl-memo").value.trim(),
    });
    saveWorklog();
    $("#wl-hours").value = ""; $("#wl-tip").value = ""; $("#wl-memo").value = "";
    const d = new Date($("#wl-date").value + "T00:00");
    const today = new Date();
    state.wlOffset = (d.getFullYear() - today.getFullYear()) * 12 + d.getMonth() - today.getMonth();
    renderWorklog();
    toast("근무 기록을 저장했어요. 📅");
  }

  /* ---------- 단위 변환 ---------- */
  const OZ = 29.57;
  function renderUnits() {
    const rows = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5]
      .map((oz) => `<div class="cr-row"><span>${oz} oz</span><b>${Math.round(oz * OZ * 10) / 10} ml <small style="color:var(--text-sub);font-weight:500">(현장 ${Math.round(oz * 30)}ml)</small></b></div>`).join("");
    $("#unit-table").innerHTML = rows;
  }

  /* ---------- 데이터 백업/복원 ---------- */
  function exportData() {
    const data = {};
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bartalk_"))
      .forEach((k) => { data[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify({ app: "bartalk", ver: 1, exportedAt: Date.now(), data })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `bartalk-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("백업 파일을 저장했어요. 💾");
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.app !== "bartalk" || !parsed.data) throw new Error("bad");
        if (!confirm("백업 데이터로 복원할까요? 현재 데이터는 백업 내용으로 바뀌어요.")) return;
        Object.entries(parsed.data).forEach(([k, v]) => {
          if (k.startsWith("bartalk_")) localStorage.setItem(k, v);
        });
        location.reload();
      } catch {
        toast("올바른 바텐톡 백업 파일이 아니에요.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- 도구: 공통 ---------- */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function ingName(line) {
    const words = line.replace(/\(선택\)/g, "").trim().split(/\s+/);
    const idx = words.findIndex((w) => /^\d/.test(w) || /^(반|한|두)$/.test(w));
    return (idx > 0 ? words.slice(0, idx) : words).join(" ");
  }
  const cocktailIngs = (sp) => (sp.ings || "").split("\n").map((l) => ingName(l)).filter(Boolean);

  /* ---------- 재료로 칵테일 찾기 ---------- */
  function renderFinder() {
    const cts = state.spirits.filter((s) => s.kind === "cocktail");
    const all = [...new Set(cts.flatMap(cocktailIngs))].sort((a, b) => a.localeCompare(b, "ko"));
    state.finderSel = state.finderSel.filter((x) => all.includes(x));
    $("#finder-ings").innerHTML = all.map((ing) =>
      `<button class="chip ${state.finderSel.includes(ing) ? "active" : ""}" data-ing="${esc(ing)}">${esc(ing)}</button>`).join("");
    $$("#finder-ings .chip").forEach((ch) =>
      ch.addEventListener("click", () => {
        const v = ch.dataset.ing;
        const i = state.finderSel.indexOf(v);
        if (i >= 0) state.finderSel.splice(i, 1); else state.finderSel.push(v);
        renderFinder();
      }));

    if (!state.finderSel.length) {
      $("#finder-result-title").textContent = "";
      $("#finder-results").innerHTML = '<div class="empty-state" style="padding:40px 20px">재료를 선택하면 결과가 나와요.</div>';
      return;
    }
    const matches = cts.map((c) => {
      const ings = cocktailIngs(c);
      const have = ings.filter((i) => state.finderSel.includes(i)).length;
      return { c, have, total: ings.length };
    }).filter((m) => m.have > 0)
      .sort((a, b) => (b.have / b.total) - (a.have / a.total) || b.have - a.have);
    $("#finder-result-title").textContent = `만들 수 있는 칵테일 ${matches.filter((m) => m.have === m.total).length}개 · 아쉽게 부족 ${matches.filter((m) => m.have < m.total).length}개`;
    $("#finder-results").innerHTML = matches.length
      ? matches.map((m) => `
        <div class="spirit-item" data-id="${m.c.id}">
          <span class="spirit-emoji">${thumbHTML(m.c)}</span>
          <div class="spirit-info">
            <div class="spirit-name">${esc(m.c.name)}</div>
            <div class="spirit-meta">${esc(cocktailIngs(m.c).join(", "))}</div>
          </div>
          <span class="finder-match">${m.have === m.total ? "✅ 완성 가능" : `${m.have}/${m.total} 보유`}</span>
        </div>`).join("")
      : '<div class="empty-state" style="padding:40px 20px">선택한 재료로 만들 수 있는 칵테일이 없어요.</div>';
    $$("#finder-results .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
    wireImgFallback("#finder-results");
  }

  /* ---------- 레시피 퀴즈 ---------- */
  function renderQuiz() {
    state.quiz = null;
    $("#quiz-area").innerHTML = `
      <div class="quiz-start">
        <div class="qs-emoji">🎯</div>
        <h2>레시피 퀴즈</h2>
        <p>재료를 보고 어떤 칵테일인지 맞혀보세요.<br>5문제 · 하루 첫 완료 시 +20P!</p>
        <button class="big-btn accent ready" id="quiz-start-btn">시작하기</button>
      </div>`;
    $("#quiz-start-btn").addEventListener("click", startQuiz);
  }
  function startQuiz() {
    const cts = state.spirits.filter((s) => s.kind === "cocktail" && s.ings);
    if (cts.length < 4) {
      toast("칵테일이 4개 이상 등록되어야 퀴즈를 풀 수 있어요.");
      return;
    }
    const qs = shuffle(cts).slice(0, 5).map((c) => ({
      c,
      options: shuffle([c.name, ...shuffle(cts.filter((x) => x.id !== c.id)).slice(0, 3).map((x) => x.name)]),
    }));
    state.quiz = { qs, i: 0, score: 0, answered: false };
    renderQuizQ();
  }
  function renderQuizQ() {
    const qz = state.quiz;
    const q = qz.qs[qz.i];
    $("#quiz-area").innerHTML = `
      <div class="quiz-box">
        <div class="quiz-progress"><b>${qz.i + 1}</b> / ${qz.qs.length} · 맞힌 개수 ${qz.score}</div>
        <div class="quiz-q">
          <h3>이 재료로 만드는 칵테일은? 🍸</h3>
          <p>${esc(q.c.ings)}</p>
        </div>
        ${q.options.map((o) => `<button class="quiz-opt" data-name="${esc(o)}">${esc(o)}</button>`).join("")}
      </div>`;
    qz.answered = false;
    $$("#quiz-area .quiz-opt").forEach((b) =>
      b.addEventListener("click", () => {
        if (qz.answered) return;
        qz.answered = true;
        const right = b.dataset.name === q.c.name;
        if (right) qz.score++;
        $$("#quiz-area .quiz-opt").forEach((x) => {
          if (x.dataset.name === q.c.name) x.classList.add("correct");
          else if (x === b) x.classList.add("wrong");
        });
        setTimeout(() => {
          qz.i++;
          if (qz.i < qz.qs.length) renderQuizQ();
          else finishQuiz();
        }, 900);
      }));
  }
  function finishQuiz() {
    const qz = state.quiz;
    const today = new Date().toDateString();
    let bonus = "";
    if (store.get("quizDay", "") !== today) {
      store.set("quizDay", today);
      addPoints(20, "퀴즈 완료");
      bonus = "오늘의 첫 퀴즈 완료로 20P를 받았어요!";
    }
    if (qz.score === qz.qs.length) {
      state.user.quizPerfect = true;
      saveUser();
      checkBadges();
    }
    const msg = qz.score === qz.qs.length ? "완벽해요! 진짜 바텐더시네요 🏆"
      : qz.score >= 3 ? "좋아요! 조금만 더 연습해봐요 💪"
      : "레시피를 술도감에서 복습해보세요 📖";
    $("#quiz-area").innerHTML = `
      <div class="quiz-result">
        <div class="qs-emoji">${qz.score === qz.qs.length ? "🏆" : "🎯"}</div>
        <div class="qr-score">${qz.score} / ${qz.qs.length}</div>
        <p>${msg}${bonus ? "<br>" + bonus : ""}</p>
        <button class="big-btn accent ready" id="quiz-retry">다시 풀기</button>
        <button class="big-btn" id="quiz-home" style="margin-top:10px">홈으로</button>
      </div>`;
    $("#quiz-retry").addEventListener("click", startQuiz);
    $("#quiz-home").addEventListener("click", () => show("home"));
  }

  /* ---------- 원가 계산기 ---------- */
  function renderCalc() {
    $("#calc-rows").innerHTML = `
      <div class="calc-head"><span>재료명</span><span>병 가격(원)</span><span>용량(ml)</span><span>사용(ml)</span><span></span></div>
      ${state.calcRows.map((r, i) => `
        <div class="calc-row">
          <input type="text" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="진">
          <input type="number" data-i="${i}" data-f="price" value="${esc(r.price)}" placeholder="40000" inputmode="numeric">
          <input type="number" data-i="${i}" data-f="vol" value="${esc(r.vol)}" placeholder="700" inputmode="numeric">
          <input type="number" data-i="${i}" data-f="use" value="${esc(r.use)}" placeholder="45" inputmode="decimal">
          <button class="rm" data-i="${i}" aria-label="삭제">✕</button>
        </div>`).join("")}`;
    $$("#calc-rows input").forEach((inp) =>
      inp.addEventListener("input", () => {
        state.calcRows[+inp.dataset.i][inp.dataset.f] = inp.value;
        calcCompute();
      }));
    $$("#calc-rows .rm").forEach((b) =>
      b.addEventListener("click", () => {
        if (state.calcRows.length <= 1) return;
        state.calcRows.splice(+b.dataset.i, 1);
        renderCalc();
      }));
    calcCompute();
  }
  function calcCompute() {
    const valid = state.calcRows.filter((r) => +r.price > 0 && +r.vol > 0 && +r.use > 0);
    const box = $("#calc-result");
    if (!valid.length) { box.classList.remove("show"); return; }
    const total = valid.reduce((a, r) => a + (+r.price / +r.vol) * +r.use, 0);
    const sell = +$("#calc-price").value;
    const suggest = Math.ceil(total / 0.2 / 100) * 100;
    box.classList.add("show");
    box.innerHTML = `
      <div class="cr-row hl"><span>잔당 원가</span><b>${fmtNum(Math.round(total))}원</b></div>
      ${sell > 0 ? `
      <div class="cr-row"><span>원가율 (판매가 ${fmtNum(sell)}원)</span><b>${(total / sell * 100).toFixed(1)}%</b></div>
      <div class="cr-row"><span>잔당 마진</span><b>${fmtNum(Math.round(sell - total))}원</b></div>` : ""}
      <div class="cr-row"><span>추천 판매가 (원가율 20%)</span><b>${fmtNum(suggest)}원</b></div>
      <div class="cr-note">가니시·얼음·인건비는 포함되지 않은 재료 원가 기준이에요.</div>`;
  }

  /* ---------- 급여 계산기 ---------- */
  function renderPay() { payCompute(); }
  function payCompute() {
    const wage = +$("#pay-wage").value;
    const hours = +$("#pay-hours").value;
    const days = +$("#pay-days").value;
    const box = $("#pay-result");
    if (!(wage > 0 && hours > 0 && days > 0 && days <= 7)) { box.classList.remove("show"); return; }
    const weeklyHours = hours * days;
    const jhu = weeklyHours >= 15 ? wage * Math.min(hours, 8) : 0;
    const weekly = wage * weeklyHours + jhu;
    const monthly = Math.round(weekly * 4.345);
    box.classList.add("show");
    box.innerHTML = `
      <div class="cr-row"><span>주 근무시간</span><b>${weeklyHours}시간</b></div>
      <div class="cr-row"><span>주휴수당 (주)</span><b>${jhu ? fmtNum(jhu) + "원" : "해당 없음"}</b></div>
      <div class="cr-row"><span>주급 (주휴 포함)</span><b>${fmtNum(weekly)}원</b></div>
      <div class="cr-row hl"><span>월급 예상</span><b>${fmtNum(monthly)}원</b></div>`;
  }

  /* ---------- 레시피 공유 ---------- */
  function shareSpirit() {
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    const text = sp.kind === "cocktail"
      ? `🍸 ${sp.name} (${sp.base} 베이스 · 약 ${sp.abv}%)\n\n[재료]\n${sp.ings}\n\n[만드는 법]\n${sp.recipe}${sp.note ? "\n\n💡 " + sp.note : ""}\n\n- 바텐톡`
      : `🥃 ${sp.name} (${sp.cat} · ${sp.abv}%${sp.price ? " · " + sp.price : ""})\n\n${sp.note || ""}\n\n- 바텐톡`;
    if (navigator.share) {
      navigator.share({ title: sp.name, text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast("레시피를 클립보드에 복사했어요."));
    }
  }

  /* ---------- 이벤트 바인딩 ---------- */
  $$(".nav-btn").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
  $$(".back-btn").forEach((b) => b.addEventListener("click", () => show(b.dataset.back)));
  $("#btn-alerts").addEventListener("click", () => show("alerts"));

  // 온보딩
  $("#ob-nick").addEventListener("input", renderOnboard);
  $("#ob-adult").addEventListener("click", () => { state.obAdult = !state.obAdult; renderOnboard(); });
  $("#ob-start").addEventListener("click", startApp);
  $("#ob-nick").addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("#ob-start").disabled) startApp(); });
  $("#ob-terms").addEventListener("click", () => openDoc("terms"));
  $("#ob-privacy").addEventListener("click", () => openDoc("privacy"));

  /* ---------- 로그인 화면 ---------- */
  $("#login-terms").addEventListener("click", () => openDoc("terms"));
  $("#login-privacy").addEventListener("click", () => openDoc("privacy"));

  $$("#view-login [data-login]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.login;
      setLoginBusy(true);
      setLoginStatus("로그인 창을 여는 중이에요…");
      const res = await Sync.signInWith(provider);
      if (!res.ok) {
        setLoginBusy(false);
        setLoginStatus(res.error === "not-enabled"
          ? "이 로그인 방법은 아직 준비 중이에요. 다른 방법으로 시작해주세요."
          : "로그인에 실패했어요: " + res.error, "err");
      }
      // 성공하면 브라우저가 이동하므로 여기서 할 일이 없어요.
    }));

  $("#login-email-toggle").addEventListener("click", () => {
    const box = $("#login-email-box");
    box.hidden = !box.hidden;
    if (!box.hidden) $("#login-email").focus();
  });
  const updateEmailBtn = () => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#login-email").value.trim());
    $("#login-email-send").disabled = !ok;
    $("#login-email-send").classList.toggle("ready", ok);
  };
  $("#login-email").addEventListener("input", updateEmailBtn);
  $("#login-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#login-email-send").disabled) $("#login-email-send").click();
  });
  $("#login-email-send").addEventListener("click", async () => {
    const email = $("#login-email").value.trim();
    setLoginBusy(true);
    setLoginStatus("메일을 보내는 중이에요…");
    const res = await Sync.signInWithEmail(email);
    setLoginBusy(false);
    updateEmailBtn();
    if (res.ok) {
      setLoginStatus(`${email} 로 로그인 링크를 보냈어요.\n메일함(스팸함도 확인)에서 링크를 눌러주세요.`, "ok");
    } else {
      setLoginStatus("메일 발송 실패: " + res.error, "err");
    }
  });

  // 술도감
  $$("#dogam-seg .seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.dogamKind = b.dataset.kind;
      state.dogamCat = "전체";
      $$("#dogam-seg .seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      renderDogam();
    })
  );
  let dogamSearchTimer;
  $("#spirit-search").addEventListener("input", () => {
    clearTimeout(dogamSearchTimer);
    dogamSearchTimer = setTimeout(renderDogam, 150);
  });
  $("#fab-spirit").addEventListener("click", () => {
    state.swKind = state.dogamKind;
    renderSpiritWrite();
    show("spirit-write");
  });
  $$("#sw-kind .seg-btn").forEach((b) =>
    b.addEventListener("click", () => { state.swKind = b.dataset.kind; renderSpiritWrite(); })
  );
  ["sw-name", "sw-abv", "sw-ings", "sw-recipe"].forEach((i) =>
    $("#" + i).addEventListener("input", updateSwSubmit));
  $("#sw-submit").addEventListener("click", submitSpirit);
  $("#sw-photo-btn").addEventListener("click", () => $("#sw-file").click());
  $("#sw-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast("이미지 파일만 첨부할 수 있어요."); e.target.value = ""; return; }
    compressImage(f, setSwImg, 800, 0.7);
  });
  $("#sw-img-remove").addEventListener("click", () => { setSwImg(null); $("#sw-file").value = ""; });
  $("#spirit-report").addEventListener("click", () => {
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    if (isAdmin() && sp.remote) {
      openSheet("이 도감 항목", ["🚩 신고하기", "🛡️ 관리자 조치 (삭제·정지)"], null, (v) => {
        if (v.includes("신고")) reportSpirit(sp);
        else openAdminSheet("spirit", sp.id, sp.name, sp.authorId, () => show("dogam"));
      });
      return;
    }
    if (sp.mine) { toast("내가 등록한 항목은 신고할 수 없어요."); return; }
    reportSpirit(sp);
  });
  $("#review-send").addEventListener("click", addReview);
  $("#review-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addReview(); });
  $("#spirit-share").addEventListener("click", shareSpirit);
  $("#spirit-delete").addEventListener("click", () => {
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp || !sp.mine) return;
    if (!confirm(`'${sp.name}'을(를) 도감에서 삭제할까요?`)) return;
    state.spirits = state.spirits.filter((x) => x.id !== sp.id);
    state.user.cellar.tried = state.user.cellar.tried.filter((i) => i !== sp.id);
    state.user.cellar.wish = state.user.cellar.wish.filter((i) => i !== sp.id);
    state.user.mySpiritIds = state.user.mySpiritIds.filter((i) => i !== sp.id);
    saveSpirits(); saveUser();
    show("dogam");
    toast("도감에서 삭제했어요.");
  });

  // 스토어
  $("#store-search").addEventListener("input", renderStore);
  $("#store-cart-btn").addEventListener("click", () => show("cart"));
  $("#pd-cart-btn").addEventListener("click", () => show("cart"));
  $("#btn-orders").addEventListener("click", () => show("orders"));

  // 새 도구/신고/리포트
  $("#tool-random").addEventListener("click", randomCocktail);
  $("#timer-toggle").addEventListener("click", toggleTimer);
  $("#timer-reset").addEventListener("click", () => { stopTimer(); timerLeft = timerSel; renderTimer(); });
  $("#btn-taste").addEventListener("click", () => show("taste"));
  $("#post-report").addEventListener("click", () => {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    const opts = [];
    if (!p.mine) opts.push("🚩 신고하기", "🚫 이 작성자 차단하기");
    if (isAdmin() && p.remote) opts.push("🛡️ 관리자 조치 (삭제·정지)");
    if (!opts.length) { toast("내 글은 신고·차단할 수 없어요."); return; }
    openSheet("이 게시글", opts, null, (v) => {
      if (v.includes("신고")) reportPost(p);
      else if (v.includes("차단")) blockAuthorOfPost(p);
      else openAdminSheet("post", p.id, p.title, p.authorId, () => show("community"));
    });
  });

  // 데이터 백업/복원
  $("#btn-backup").addEventListener("click", () => {
    let bytes = 0;
    Object.keys(localStorage).filter((k) => k.startsWith("bartalk_"))
      .forEach((k) => { bytes += (localStorage.getItem(k) || "").length * 2; });
    const usage = bytes > 1048576 ? (bytes / 1048576).toFixed(1) + "MB" : Math.round(bytes / 1024) + "KB";
    openSheet(`데이터 백업/복원 (사용량 ${usage} / 약 5MB)`, ["📤 백업 파일 내려받기", "📥 백업 파일에서 복원"], null, (v) => {
      if (v.includes("내려받기")) exportData();
      else $("#restore-file").click();
    });
  });
  $("#restore-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importData(f);
    e.target.value = "";
  });

  // 근무일지
  $("#wl-prev").addEventListener("click", () => { state.wlOffset--; renderWorklog(); });
  $("#wl-next").addEventListener("click", () => { if (state.wlOffset < 0) { state.wlOffset++; renderWorklog(); } });
  $("#wl-wage").addEventListener("input", () => { store.set("wage", +$("#wl-wage").value || ""); renderWorklog(); });
  ["wl-date", "wl-hours"].forEach((i) => $("#" + i).addEventListener("input", updateWlAdd));
  $("#wl-add").addEventListener("click", addWorklog);

  // 단위 변환
  $("#unit-oz").addEventListener("input", () => {
    const v = parseFloat($("#unit-oz").value);
    $("#unit-ml").value = isNaN(v) ? "" : Math.round(v * 29.57 * 10) / 10;
  });
  $("#unit-ml").addEventListener("input", () => {
    const v = parseFloat($("#unit-ml").value);
    $("#unit-oz").value = isNaN(v) ? "" : Math.round(v / 29.57 * 100) / 100;
  });

  // 도구
  $("#calc-add-row").addEventListener("click", () => {
    state.calcRows.push({ name: "", price: "", vol: "", use: "" });
    renderCalc();
  });
  $("#calc-price").addEventListener("input", calcCompute);
  ["pay-wage", "pay-hours", "pay-days"].forEach((i) =>
    $("#" + i).addEventListener("input", payCompute));

  // 모임
  $("#fab-meet").addEventListener("click", () => { renderMeetWrite(); show("meet-write"); });
  ["mw-title", "mw-date", "mw-place", "mw-max"].forEach((i) =>
    $("#" + i).addEventListener("input", updateMwSubmit));
  $("#mw-submit").addEventListener("click", submitMeet);
  $("#meet-comment-send").addEventListener("click", addMeetComment);
  $("#meet-comment-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addMeetComment(); });

  // 커뮤니티
  $$("#community-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => {
      state.commTab = t.dataset.tab;
      $$("#community-tabs .tab").forEach((x) => x.classList.toggle("active", x === t));
      renderPosts();
    })
  );
  $("#post-search").addEventListener("input", renderPosts);
  $("#rules-banner").addEventListener("click", openRulesSheet);
  // 관리자 진입: 버전 문구 7연타 → PIN
  let verTaps = 0, verTapTimer;
  $("#app-ver").addEventListener("click", () => {
    verTaps++;
    clearTimeout(verTapTimer);
    verTapTimer = setTimeout(() => { verTaps = 0; }, 1500);
    if (verTaps >= 7) { verTaps = 0; adminEnter(); }
  });
  $("#btn-admin").addEventListener("click", () => {
    if (!isAdmin()) { adminEnter(); return; }   // 권한 안내 시트를 띄워줘요
    state.adminMode = true;
    show("admin");
  });
  $$("#admin-tabs .seg-btn").forEach((b) =>
    b.addEventListener("click", () => { state.adminTab = b.dataset.atab; renderAdmin(); }));
  $("#fab-write").addEventListener("click", () => {
    state.editPost = null;
    $("#view-write .topbar-title").textContent = "글쓰기";
    // 임시저장 복원
    const d = store.get("draft", null);
    if (d && !$("#write-title").value && !$("#write-body").value) {
      $("#write-title").value = d.title || "";
      $("#write-body").value = d.body || "";
      state.writeCat = d.cat || "free";
      $$(".cat-chip").forEach((x) => x.classList.toggle("active", x.dataset.cat === state.writeCat));
      updateSubmit();
      toast("작성 중이던 글을 불러왔어요. ✍️");
    }
    updateBizHint();
    show("write");
  });
  let draftTimer;
  const saveDraft = () => {
    if (state.editPost !== null) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const t = $("#write-title").value, b = $("#write-body").value;
      store.set("draft", t.trim() || b.trim() ? { title: t, body: b, cat: state.writeCat } : null);
    }, 400);
  };
  $("#write-title").addEventListener("input", saveDraft);
  $("#write-body").addEventListener("input", saveDraft);

  // 알림 탭
  $$("[data-atab]").forEach((t) =>
    t.addEventListener("click", () => {
      $$("[data-atab]").forEach((x) => x.classList.toggle("active", x === t));
      $("#alerts-noti").hidden = t.dataset.atab !== "noti";
      $("#alerts-chat").hidden = t.dataset.atab !== "chat";
    })
  );

  // 채팅
  $("#chat-send").addEventListener("click", sendChat);
  $("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

  // 채용
  $("#job-search").addEventListener("input", renderJobs);
  $("#filter-region").addEventListener("click", () =>
    openSheet("지역 선택", REGIONS, state.filterRegion, (v) => {
      state.filterRegion = v;
      $("#filter-region-value").textContent = v;
      renderJobs();
    })
  );
  $("#filter-job").addEventListener("click", () =>
    openSheet("직종 선택", JOB_TYPES, state.filterJob, (v) => {
      state.filterJob = v;
      $("#filter-job-value").textContent = v;
      renderJobs();
    })
  );

  // 글쓰기
  function updateBizHint() {
    const el = $("#write-biz-hint");
    $("#write-promo-fields").hidden = state.writeCat !== "promo";
    if (state.writeCat !== "promo") { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = state.user.bizProfile
      ? `📢 '<b>${esc(state.user.bizProfile.name)}</b>' (${esc(state.user.bizProfile.type)}) 이름으로 게시돼요.`
      : "⚠️ 홍보 글은 비즈니스 프로필 등록 후 작성할 수 있어요. (계정설정에서 등록)";
  }
  const CONTACT_RE = /^(01[016789]-?\d{3,4}-?\d{4}|0\d{1,2}-?\d{3,4}-?\d{4}|https?:\/\/\S+)$/;
  $$(".cat-chip").forEach((c) =>
    c.addEventListener("click", () => {
      state.writeCat = c.dataset.cat;
      $$(".cat-chip").forEach((x) => x.classList.toggle("active", x === c));
      updateBizHint();
    })
  );
  $("#write-title").addEventListener("input", updateSubmit);
  $("#write-body").addEventListener("input", updateSubmit);
  $("#write-submit").addEventListener("click", submitPost);
  $("#write-img").addEventListener("click", () => $("#write-file").click());
  $("#write-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast("이미지 파일만 첨부할 수 있어요."); return; }
    compressImage(f, setPendingImg);
  });
  $("#write-img-remove").addEventListener("click", () => { setPendingImg(null); $("#write-file").value = ""; });

  // 댓글/리뷰 사진 첨부 (자동 압축)
  Object.keys(CMT_KEY).forEach((prefix) => {
    $("#" + prefix + "-img-btn").addEventListener("click", () => $("#" + prefix + "-file").click());
    $("#" + prefix + "-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) { toast("이미지 파일만 첨부할 수 있어요."); e.target.value = ""; return; }
      compressImage(f, (d) => {
        pendingImg[CMT_KEY[prefix]] = d;
        $("#" + prefix + "-attach-img").src = d;
        $("#" + prefix + "-attach").hidden = false;
      }, 640, 0.6);
    });
    $("#" + prefix + "-attach-rm").addEventListener("click", () => clearCmtAttach(prefix));
  });

  // 통합 검색 / 내 술장 / 답글 / 글 수정
  $("#home-search-btn").addEventListener("click", () => show("search"));
  $("#global-search").addEventListener("input", renderSearch);
  $("#btn-cellar").addEventListener("click", () => show("cellar"));
  $$("#cellar-seg .seg-btn").forEach((b) =>
    b.addEventListener("click", () => { state.cellarTab = b.dataset.cellar; renderCellar(); }));
  $("#reply-cancel").addEventListener("click", () => {
    state.replyTo = null;
    $("#reply-bar").hidden = true;
  });
  $("#post-edit").addEventListener("click", () => {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p || !p.mine) return;
    state.editPost = p.id;
    $("#write-title").value = p.title;
    $("#write-body").value = p.body;
    state.writeCat = p.cat === "promo" ? "promo" : "free";
    $$(".cat-chip").forEach((x) => x.classList.toggle("active", x.dataset.cat === state.writeCat));
    $("#view-write .topbar-title").textContent = "글 수정";
    updateSubmit();
    updateBizHint();
    show("write");
  });

  // 게시글 상세
  $("#comment-send").addEventListener("click", addComment);
  $("#comment-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addComment(); });
  $("#post-delete").addEventListener("click", deletePost);
  $("#post-chat").addEventListener("click", () => {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p || p.mine) return;
    openChatWith(p.color, `post:${p.id}`, `글 '${p.title.slice(0, 12)}${p.title.length > 12 ? "…" : ""}'`, p.authorId);
  });

  // 마이페이지
  $("#btn-settings").addEventListener("click", () => show("settings"));
  $("#btn-favjobs").addEventListener("click", () => show("favjobs"));
  $("#btn-myposts").addEventListener("click", () => show("myposts"));
  $("#btn-support").addEventListener("click", openSupportSheet);
  $("#btn-points").addEventListener("click", openPointSheet);
  $("#btn-blocked").addEventListener("click", () => show("blocked"));
  $("#btn-rules").addEventListener("click", openRulesSheet);
  $("#btn-terms").addEventListener("click", () => openDoc("terms"));
  $("#btn-privacy").addEventListener("click", () => openDoc("privacy"));
  $("#btn-opensource").addEventListener("click", () => openDoc("opensource"));
  $("#btn-deletion-doc").addEventListener("click", () => openDoc("deletion"));
  $("#btn-logout").addEventListener("click", async () => {
    if (!confirm("로그아웃할까요? 다시 로그인하면 내 글과 기록이 그대로 돌아와요.")) return;
    if (Sync.enabled) {
      await Sync.signOut();
      show("login");
      setLoginStatus("");
      setLoginBusy(false);
      toast("로그아웃했어요.");
      return;
    }
    state.user.onboarded = false;
    saveUser();
    $("#ob-nick").value = "";
    state.obColor = state.user.color;
    renderOnboard();
    show("onboard");
  });
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
  $("#nick-input").addEventListener("input", updateNickBtn);
  $("#btn-nick-save").addEventListener("click", () => {
    const v = $("#nick-input").value.trim();
    if (!v || v === state.user.nick) return;
    state.user.nick = v;
    saveUser();
    Sync.saveProfile(state.user);
    updateNickBtn();
    toast("닉네임이 변경되었어요.");
  });
  // 비즈니스 프로필
  $("#biz-name").addEventListener("input", updateBizBtn);
  $("#btn-biz-save").addEventListener("click", () => {
    const name = $("#biz-name").value.trim();
    if (name.length < 2 || !state.bizTypeSel) return;
    if (!isClean(name)) return;
    state.user.bizProfile = { name, type: state.bizTypeSel, since: state.user.bizProfile ? state.user.bizProfile.since : Date.now() };
    saveUser();
    Sync.saveProfile(state.user);
    renderBizProfile();
    toast(`'${name}' 비즈니스 프로필이 등록됐어요. 📢 홍보 글은 이 이름으로 게시돼요.`);
  });
  $("#btn-biz-remove").addEventListener("click", () => {
    if (!confirm("비즈니스 프로필을 해제할까요? 홍보 글을 더 이상 쓸 수 없어요.")) return;
    state.user.bizProfile = null;
    saveUser();
    Sync.saveProfile(state.user);
    renderBizProfile();
    toast("비즈니스 프로필을 해제했어요.");
  });
  $("#btn-profile-save").addEventListener("click", () => {
    state.user.color = state.selColor;
    saveUser();
    Sync.saveProfile(state.user);
    $("#btn-profile-save").disabled = true;
    $("#btn-profile-save").classList.remove("ready");
    toast("프로필이 변경되었어요.");
  });
  $("#withdraw-agree").addEventListener("click", () => {
    state.agreeWithdraw = !state.agreeWithdraw;
    $("#withdraw-agree").classList.toggle("on", state.agreeWithdraw);
    $("#btn-withdraw").disabled = !state.agreeWithdraw;
    $("#btn-withdraw").classList.toggle("ready", state.agreeWithdraw);
  });
  $("#btn-withdraw").addEventListener("click", async () => {
    if (!state.agreeWithdraw) return;
    if (!confirm("정말 탈퇴하시겠어요? 이 기기의 모든 데이터가 삭제돼요.")) return;
    // 서버에 올린 글은 본인이 개별 삭제하거나 고객센터로 요청해야 해요.
    // 그 안내를 한 번 더 확인받습니다.
    if (Sync.enabled && Sync.signedIn) {
      const ok = confirm(
        "커뮤니티에 올린 글·댓글은 탈퇴만으로는 삭제되지 않아요.\n" +
        "전체 삭제를 원하시면 탈퇴 전에 고객센터로 요청해주세요.\n\n" +
        "그래도 지금 탈퇴할까요?");
      if (!ok) return;
      await Sync.signOut();
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bartalk_"))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  });

  /* ============================================================
   *  서버 동기화
   *  js/config.js 가 비어 있으면 아래 호출은 전부 아무 일도 하지 않아요.
   *  즉 서버 없이도 앱은 지금까지와 똑같이 동작합니다.
   * ============================================================ */
  const NOOP = () => {};
  const Sync = window.BarTalkSync || {
    enabled: false, status: "off", uid: null, queued: 0,
    ready: () => false, init: async () => false, refresh: NOOP, uploadPhoto: async () => null,
    saveProfile: NOOP, savePost: NOOP, deletePost: NOOP, bumpViews: NOOP, saveComment: NOOP,
    toggleLike: NOOP, saveMeet: NOOP, joinMeet: NOOP, saveMeetComment: NOOP,
    saveSpirit: NOOP, saveReview: NOOP, saveReport: NOOP, setBlock: NOOP,
  };

  // 서버에 아직 못 올린 내 글이 화면에서 사라지지 않도록 남겨둬요.
  function mergeRemote(remote, local) {
    const ids = new Set(remote.map((x) => x.id));
    const pendingMine = local.filter((x) => x.mine && x.remote !== true && !ids.has(x.id));
    return remote.concat(pendingMine);
  }

  function applyRemote(data) {
    if (data.profile) {
      state.user.bannedUntil = data.profile.bannedUntil || 0;
      if (data.profile.bizProfile && !state.user.bizProfile) state.user.bizProfile = data.profile.bizProfile;
      // 새 기기에서 같은 계정으로 로그인한 경우.
      // 서버에 이미 닉네임이 있으면 온보딩을 다시 시키지 않아요.
      // (기기를 바꿔도 그대로 이어지는 것이 로그인의 이유입니다)
      const serverNick = (data.profile.nick || "").trim();
      if (serverNick && serverNick !== "익명" && !state.user.nick) {
        state.user.nick = serverNick;
        if (typeof data.profile.color === "number") state.user.color = data.profile.color;
        state.user.onboarded = true;
      }
      saveUser();
    }
    if (data.reports) state.serverReports = data.reports;
    if (data.chats) {
      // 서버 대화 + 이 기기에만 있는 문의(스토어 등)를 합쳐요.
      const localOnly = state.chats.filter((c) => c.local);
      state.chats = data.chats.concat(localOnly);
      saveChats();
    }
    if (data.blocks) {
      // 서버 차단 목록 + 이 기기에만 있는 항목(local:) 을 합쳐요.
      const localOnly = blockedKeys().filter((k) => String(k).indexOf("local:") === 0);
      state.user.blocked = data.blocks.concat(localOnly);
      saveUser();
    }
    if (data.posts) {
      state.posts = mergeRemote(data.posts, state.posts);
      savePosts();
    }
    if (data.meets) {
      state.meets = mergeRemote(data.meets, state.meets);
      saveMeets();
    }
    if (data.spirits) {
      // 앱에 내장된 도감(기준 데이터)은 그대로 두고 사용자 등록분만 교체해요.
      const builtin = state.spirits.filter((s) => !s.remote && !s.mine);
      const mine = state.spirits.filter((s) => s.mine && !s.remote);
      const ids = new Set(data.spirits.map((s) => s.id));
      state.spirits = builtin.concat(data.spirits, mine.filter((s) => !ids.has(s.id)));
      // 내장 항목에 달린 리뷰도 서버 것으로 맞춰요.
      if (data.reviewsBySpirit) {
        builtin.forEach((s) => {
          const rv = data.reviewsBySpirit[s.id];
          if (rv) s.reviews = rv;
        });
      }
      saveSpirits();
    }
    rerenderCurrentView();
    updateSyncBadge();
  }

  /* ---------- 증분 반영 ----------
   * 실시간으로 받은 "바뀐 것 하나"만 고쳐요.
   * 예전처럼 전체를 다시 받으면, 동시 접속이 늘었을 때 글 하나에
   * 접속자 수만큼의 대량 조회가 한꺼번에 터집니다.
   */
  let patchRenderTimer = null;
  function schedulePatchRender() {
    clearTimeout(patchRenderTimer);
    patchRenderTimer = setTimeout(() => { rerenderCurrentView(); updateBadge(); }, 180);
  }

  function applyPatch(p) {
    const byId = (arr, id) => arr.findIndex((x) => x.id === id);

    if (p.kind === "post") {
      const i = byId(state.posts, p.item.id);
      if (p.op === "delete") { if (i >= 0) state.posts.splice(i, 1); }
      else if (i >= 0) {
        // 댓글·공감 여부는 지금 화면 것이 더 정확하니 지키고 나머지만 갱신
        const keep = state.posts[i];
        state.posts[i] = Object.assign({}, keep, p.item, {
          comments: keep.comments || [], likedByMe: keep.likedByMe,
        });
      } else state.posts.push(p.item);
      savePosts();

    } else if (p.kind === "comment") {
      const post = state.posts.find((x) => x.id === p.postId);
      if (!post) return;
      post.comments = post.comments || [];
      const findIn = (list) => list.findIndex((c) => c.id === p.item.id);
      if (p.op === "delete") {
        const i = findIn(post.comments);
        if (i >= 0) post.comments.splice(i, 1);
        else post.comments.forEach((c) => {
          const ri = (c.replies || []).findIndex((r) => r.id === p.item.id);
          if (ri >= 0) c.replies.splice(ri, 1);
        });
      } else if (p.parentId) {
        const parent = post.comments.find((c) => c.id === p.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          if (findIn(parent.replies) < 0) parent.replies.push(p.item);
        }
      } else if (findIn(post.comments) < 0) {
        post.comments.push(p.item);
      }
      savePosts();

    } else if (p.kind === "like") {
      // 공감 수는 서버가 posts 를 갱신해 따로 오므로, 여기선 내 표시만 맞춰요.
      if (p.item.userId !== Sync.uid) return;
      const post = state.posts.find((x) => x.id === p.item.postId);
      if (post) { post.likedByMe = p.op !== "delete"; savePosts(); }

    } else if (p.kind === "meet") {
      const i = byId(state.meets, p.item.id);
      if (p.op === "delete") { if (i >= 0) state.meets.splice(i, 1); }
      else if (i >= 0) {
        const keep = state.meets[i];
        state.meets[i] = Object.assign({}, keep, p.item, {
          comments: keep.comments || [], joined: keep.joined, isJoined: keep.isJoined,
        });
      } else state.meets.push(p.item);
      saveMeets();

    } else if (p.kind === "meetJoin") {
      const m = state.meets.find((x) => x.id === p.item.meetId);
      if (!m) return;
      const on = p.op !== "delete";
      m.joined = Math.max(0, (m.joined || 0) + (on ? 1 : -1));
      if (p.item.userId === Sync.uid) m.isJoined = on;
      saveMeets();

    } else if (p.kind === "meetComment") {
      const m = state.meets.find((x) => x.id === p.meetId);
      if (!m) return;
      m.comments = m.comments || [];
      const i = m.comments.findIndex((c) => c.id === p.item.id);
      if (p.op === "delete") { if (i >= 0) m.comments.splice(i, 1); }
      else if (i < 0) m.comments.push(p.item);
      saveMeets();

    } else if (p.kind === "spirit") {
      const i = byId(state.spirits, p.item.id);
      if (p.op === "delete") { if (i >= 0) state.spirits.splice(i, 1); }
      else if (i >= 0) {
        const keep = state.spirits[i];
        state.spirits[i] = Object.assign({}, keep, p.item, { reviews: keep.reviews || [] });
      } else state.spirits.push(p.item);
      saveSpirits();

    } else if (p.kind === "review") {
      const sp = state.spirits.find((x) => x.id === p.spiritId);
      if (!sp) return;
      sp.reviews = sp.reviews || [];
      const i = sp.reviews.findIndex((r) => r.id === p.item.id);
      if (p.op === "delete") { if (i >= 0) sp.reviews.splice(i, 1); }
      else if (i >= 0) sp.reviews[i] = p.item;
      else sp.reviews.push(p.item);
      saveSpirits();

    } else if (p.kind === "conversation") {
      const i = byId(state.chats, p.item.id);
      if (p.op === "delete") { if (i >= 0) state.chats.splice(i, 1); }
      else if (i >= 0) state.chats[i] = Object.assign({}, state.chats[i], p.item, { msgs: state.chats[i].msgs || [] });
      else state.chats.push(p.item);
      saveChats();

    } else if (p.kind === "message") {
      const c = state.chats.find((x) => x.id === p.conversationId);
      if (!c) { Sync.refresh("new-chat"); return; }   // 처음 걸려온 대화면 목록부터 받아요
      c.msgs = c.msgs || [];
      const i = c.msgs.findIndex((m) => m.id === p.item.id);
      if (p.op === "delete") { if (i >= 0) c.msgs.splice(i, 1); }
      else if (i < 0) {
        c.msgs.push(p.item);
        c.time = p.item.time;
        // 그 대화를 보고 있지 않으면 안 읽음으로 표시.
        // 알림 목록에는 따로 넣지 않아요 — 안읽음 수가 이미 종 배지에 반영돼
        // 메시지 하나에 배지가 둘씩 올라가게 됩니다.
        if (!p.item.me && !(state.view === "chat" && state.curChat === c.id)) {
          c.unread = (c.unread || 0) + 1;
        }
      }
      saveChats();
      if (state.view === "chat" && state.curChat === c.id) {
        renderChatMsgs();
        markChatRead(c);
      }
    }

    schedulePatchRender();
  }

  // 지금 보고 있는 화면만 다시 그려요 (스크롤 위치가 튀지 않도록 상세 화면은 제외)
  function rerenderCurrentView() {
    const v = state.view;
    if (v === "home") renderHome();
    else if (v === "community") renderPosts();
    else if (v === "myposts") renderMyPosts();
    else if (v === "dogam") renderDogam();
    else if (v === "meet") renderMeets();
    else if (v === "mypage") renderMyPage();
    else if (v === "blocked") renderBlocked();
    else if (v === "post" && state.posts.some((p) => p.id === state.curPost)) renderPostDetail();
    else if (v === "meet-detail" && state.meets.some((m) => m.id === state.curMeet)) renderMeetDetail();
    else if (v === "spirit" && state.spirits.some((s) => s.id === state.curSpirit)) renderSpiritDetail();
  }

  function updateSyncBadge() {
    const el = $("#sync-badge");
    if (!el) return;
    if (!Sync.enabled) { el.hidden = true; return; }
    const LABEL = {
      connecting: ["⏳", "서버 연결 중…"],
      online: ["🟢", "실시간 연결됨"],
      offline: ["🔌", "오프라인 · 연결되면 자동 전송돼요"],
      error: ["⚠️", "서버 연결 실패 · 이 기기에만 저장돼요"],
    };
    const [ic, txt] = LABEL[Sync.status] || ["", ""];
    if (!ic) { el.hidden = true; return; }
    el.hidden = Sync.status === "online";   // 정상일 땐 굳이 알리지 않아요
    const n = Sync.queued;
    el.innerHTML = `<span class="sync-ic">${ic}</span><span>${txt}${n ? ` (대기 ${n}건)` : ""}</span>`;
  }

  /* 서버가 꺼져 있는 동안 만든 내 글·모임·도감을 연결된 뒤에 올려요.
   * 전송은 전부 id 기준 upsert 라서 여러 번 보내도 중복이 생기지 않아요.
   * 서버에서 받아온 항목은 remote 표시가 붙으므로 두 번 올라가지 않습니다. */
  function backfillLocal() {
    if (!Sync.ready()) return;
    let n = 0;
    state.posts.forEach((p) => {
      if (p.mine && !p.remote) { Sync.savePost(p); n++; }
      (p.comments || []).forEach((c) => {
        if (c.mine && !c.remote && c.id) { Sync.saveComment(p.id, c, null); n++; }
        (c.replies || []).forEach((r) => {
          if (r.mine && !r.remote && r.id) { Sync.saveComment(p.id, r, c.id || null); n++; }
        });
      });
    });
    state.meets.forEach((m) => {
      if (m.mine && !m.remote) { Sync.saveMeet(m); n++; }
      (m.comments || []).forEach((c) => {
        if (c.mine && !c.remote && c.id) { Sync.saveMeetComment(m.id, c); n++; }
      });
    });
    state.spirits.forEach((s) => {
      if (s.mine && !s.remote) { Sync.saveSpirit(s); n++; }
      (s.reviews || []).forEach((r) => {
        if (r.mine && !r.remote && r.id) { Sync.saveReview(s.id, r); n++; }
      });
    });
    blockedKeys().forEach((k) => {
      if (String(k).indexOf("local:") !== 0) Sync.setBlock(k, true);
    });
    if (n) console.info("[sync] 이 기기에만 있던 " + n + "건을 서버로 올려요.");
  }

  // 로컬 개발 중에만 동기화 병합 로직을 콘솔에서 확인할 수 있게 열어둬요.
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    window.__bartalk = { state, applyRemote, applyPatch, rerenderCurrentView, newId, backfillLocal };
  }

  let syncStarted = false;
  async function startSync() {
    if (!Sync.enabled) return "off";
    if (syncStarted) return Sync.signedIn ? "signed-in" : "signed-out";
    syncStarted = true;
    updateSyncBadge();
    const result = await Sync.init({
      onData: (data) => applyRemote(data),
      onPatch: (patch) => applyPatch(patch),
      onStatus: () => updateSyncBadge(),
      onAuth: (identity) => onAuthChanged(identity),
    });
    if (result === "signed-in" && Sync.ready()) {
      Sync.saveProfile(state.user);
      backfillLocal();
      Sync.refresh("backfill");
    }
    return result;
  }

  /* ---------- 로그인 화면 ---------- */
  function setLoginStatus(msg, kind) {
    const el = $("#login-status");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
    el.className = "login-status" + (kind ? " " + kind : "");
  }
  function setLoginBusy(busy) {
    $$("#view-login .login-btn, #login-email-send").forEach((b) => { b.disabled = busy; });
    if (!busy) {
      updateLoginButtons();
      updateEmailBtn();   // 메일 버튼은 주소가 올바를 때만 눌리도록 다시 판정
    }
  }

  // 서버에서 켜지지 않은 로그인 방법은 눌러도 오류 페이지로 튕기기만 해요.
  // 그래서 아예 "준비 중"으로 표시하고 막습니다.
  function updateLoginButtons() {
    $$("#view-login [data-login]").forEach((btn) => {
      const p = btn.dataset.login;
      const ready = Sync.providerReady(p);
      btn.disabled = !ready;
      btn.classList.toggle("unavailable", !ready);
      const label = btn.querySelector("span:last-child");
      if (!label) return;
      if (!label.dataset.base) label.dataset.base = label.textContent;
      label.textContent = ready ? label.dataset.base : label.dataset.base.replace("로 시작하기", " (준비 중)");
    });
  }

  // 로그인 직후 호출돼요. 닉네임이 없으면 온보딩으로, 있으면 바로 홈으로.
  function onAuthChanged(identity) {
    if (!identity) {
      // 로그아웃됨
      setLoginStatus("");
      setLoginBusy(false);
      show("login");
      return;
    }
    if (state.user.onboarded && state.user.nick) {
      enterApp();
    } else {
      // 소셜 계정 이름을 닉네임 후보로 한 번만 채워줘요 (게시판에는 노출되지 않아요)
      if (!$("#ob-nick").value && identity.suggestedNick) $("#ob-nick").value = identity.suggestedNick;
      state.obColor = state.user.color;
      renderOnboard();
      show("onboard");
    }
  }

  function enterApp() {
    const ALLOWED_ENTRY = ["community", "dogam", "meet", "jobs", "market", "mypage"];
    let entry = "home";
    try {
      const q = new URLSearchParams(location.search).get("go");
      const hash = location.hash.replace("#", "");
      if (ALLOWED_ENTRY.includes(q)) entry = q;
      else if (ALLOWED_ENTRY.includes(hash)) entry = hash;
    } catch {}
    try { history.replaceState({ view: entry }, "", "#" + entry); } catch {}
    show(entry, true);
    dailyAttend();
    checkMeetReminders();
  }

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
    // 새 버전이 배포되면 한 번만 새로고침해 최신 화면을 보여줘요.
    let swReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (swReloaded) return;
      swReloaded = true;
      location.reload();
    });
  }

  /* ---------- 초기화 ---------- */
  applyTheme();
  updateBadge();
  // 브라우저/안드로이드 뒤로가기 지원
  window.addEventListener("popstate", (e) => {
    if (state.view === "onboard" || state.view === "login") { history.forward(); return; }
    show((e.state && e.state.view) || "home", true);
  });
  (async function boot() {
    // 서버를 안 쓰는 설정이면 예전처럼 바로 시작해요.
    if (!Sync.enabled) {
      if (state.user.onboarded && state.user.nick) enterApp();
      else { state.obColor = state.user.color; renderOnboard(); show("onboard", true); }
      return;
    }

    show("login", true);
    setLoginBusy(true);
    setLoginStatus("로그인 상태를 확인하고 있어요…");

    const result = await startSync();
    setLoginBusy(false);
    updateLoginButtons();

    // 로그인 시도가 실패해 되돌아온 경우 이유를 보여줘요.
    const authErr = Sync.consumeAuthError && Sync.consumeAuthError();
    if (authErr && result !== "signed-in") {
      setLoginStatus("로그인이 완료되지 않았어요.\n" + authErr, "err");
      return;
    }

    if (result === "signed-in") {
      setLoginStatus("");
      if (state.user.onboarded && state.user.nick) enterApp();
      else { state.obColor = state.user.color; renderOnboard(); show("onboard", true); }
      return;
    }

    if (result === "signed-out") {
      // 로그인 링크를 타고 왔는데 세션이 안 생긴 경우, 여기에 이유가 담겨 있어요.
      // 그냥 비워두면 로그인 화면만 다시 떠서 왜 안 되는지 알 수가 없습니다.
      setLoginStatus(Sync.error || "", Sync.error ? "err" : "");
      return;   // 로그인 화면 유지
    }

    // 서버에 못 붙은 경우: 이미 쓰던 사람은 오프라인으로라도 쓸 수 있게 해줘요.
    if (state.user.onboarded && state.user.nick) {
      enterApp();
      toast("서버에 연결하지 못했어요. 이 기기에 저장하며 계속 사용할 수 있어요.");
    } else {
      setLoginStatus("서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.", "err");
    }
  })();

  /* ---------- 댓글 스티커 (마스코트) ---------- */
  // 입력바 3곳(리뷰·모임·게시글)이 패널 하나를 공유합니다.
  function initStickers() {
    const B = window.BTChar;
    const picker = $("#bt-picker"), veil = $("#bt-picker-veil");
    if (!B || !picker || !veil) return;   // char.js 가 없어도 앱은 그대로 동작해야 해요

    let target = null, curBtn = null, tab = B.groups[0].id;

    function draw() {
      const g = B.groups.find((x) => x.id === tab) || B.groups[0];
      picker.innerHTML =
        `<div class="bt-tabs">${B.groups.map((x) =>
          `<button class="bt-tab ${x.id === tab ? "on" : ""}" data-tab="${x.id}">${esc(x.label)}</button>`).join("")}</div>` +
        `<div class="bt-grid">${g.keys.map((k) =>
          `<button class="bt-pick-item" data-k="${k}">${B.svg(k)}<span>${esc(B.label(k))}</span></button>`).join("")}</div>`;
      $$("#bt-picker .bt-tab").forEach((t) =>
        t.addEventListener("click", () => { tab = t.dataset.tab; draw(); }));
      $$("#bt-picker .bt-pick-item").forEach((it) =>
        it.addEventListener("click", () => insert(B.token(it.dataset.k))));
    }

    // 커서 위치에 끼워 넣습니다. 앞 글자와 붙지 않게 공백을 챙겨요.
    function insert(tok) {
      if (!target) return;
      const s = target.selectionStart != null ? target.selectionStart : target.value.length;
      const e = target.selectionEnd != null ? target.selectionEnd : s;
      const before = target.value.slice(0, s), after = target.value.slice(e);
      const pad = before && !/\s$/.test(before) ? " " : "";
      target.value = before + pad + tok + " " + after;
      const pos = (before + pad + tok + " ").length;
      target.focus();
      try { target.setSelectionRange(pos, pos); } catch {}
    }

    function close() {
      picker.hidden = veil.hidden = true;
      if (curBtn) curBtn.classList.remove("on");
      curBtn = null;
    }

    function open(btn) {
      target = $("#" + btn.dataset.btFor);
      if (!target) return;
      curBtn = btn; btn.classList.add("on");
      draw();
      picker.hidden = veil.hidden = false;
      // 입력바 바로 위, 입력바 너비에 맞춰 띄웁니다.
      const bar = btn.closest("footer") || btn.parentElement;
      const r = bar.getBoundingClientRect();
      picker.style.left = (r.left + 8) + "px";
      picker.style.width = Math.max(240, r.width - 16) + "px";
      picker.style.bottom = (window.innerHeight - r.top + 8) + "px";
    }

    $$(".bt-pick-btn").forEach((btn) => {
      btn.innerHTML = B.svg(B.icon || B.keys[0]);   // 버튼 아이콘도 마스코트로
      btn.classList.add("ready");        // 여기까지 와야 버튼이 보입니다
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (curBtn === btn) close(); else open(btn);
      });
    });
    veil.addEventListener("click", close);
    // 화면이 바뀌거나 창 크기가 변하면 위치가 어긋나므로 그냥 닫습니다.
    window.addEventListener("resize", () => { if (!picker.hidden) close(); });
    $$(".nav-btn").forEach((b) => b.addEventListener("click", close));
    // 댓글을 보내고 나면 닫아줍니다. (전송 자체는 기존 핸들러가 처리)
    ["review-send", "meet-comment-send", "comment-send"].forEach((id) => {
      const b = $("#" + id);
      if (b) b.addEventListener("click", close);
    });
    ["review-input", "meet-comment-input", "comment-input"].forEach((id) => {
      const i = $("#" + id);
      if (i) i.addEventListener("keydown", (e) => { if (e.key === "Enter") close(); });
    });
    return close;
  }
  const closeStickerPicker = initStickers();

  // 첫 화면이 뜬 뒤 한가할 때 심층 도감 데이터를 미리 받아둡니다.
  // 도감에 들어갔을 때 기다리는 일이 없도록 하는 용도라, 실패해도 그냥 넘어가요.
  if ("requestIdleCallback" in window) requestIdleCallback(() => DeepData.load(), { timeout: 4000 });
  else setTimeout(() => DeepData.load(), 1500);
})();
