/* ============ 바텐톡 - 바텐더 익명 커뮤니티 ============ */
(function () {
  "use strict";

  /* ---------- 상수 ---------- */
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
  };
  let state = {
    user: Object.assign({}, DEFAULT_USER, store.get("user", {})),
    posts: store.get("posts", SEED_POSTS),
    spirits: store.get("spirits", SEED_SPIRITS),
    meets: store.get("meets", SEED_MEETS),
    noti: store.get("noti", []),
    chats: store.get("chats", []),
    dark: store.get("dark", false),
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
    mwRegion: null,
    dogamSort: "new",
    finderSel: [],
    quiz: null,
    calcRows: [{ name: "", price: "", vol: "", use: "" }, { name: "", price: "", vol: "", use: "" }],
    reviewStars: 5,
    obColor: 2,
    selColor: null,
    agreeWithdraw: false,
  };
  const saveUser = () => store.set("user", state.user);
  const savePosts = () => store.set("posts", state.posts);
  const saveSpirits = () => store.set("spirits", state.spirits);
  const saveMeets = () => store.set("meets", state.meets);
  const saveNoti = () => store.set("noti", state.noti);
  const saveChats = () => store.set("chats", state.chats);

  /* ---------- 시드 병합 (앱 업데이트 시 새 데이터 추가) ---------- */
  const SEED_V = 2;
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

  /* ---------- 유틸 ---------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
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
  function updateBadge() {
    const n = state.noti.filter((x) => !x.read).length;
    const b = $("#bell-badge");
    b.hidden = n === 0;
    b.textContent = n > 9 ? "9+" : n;
  }
  function addPoints(amt, reason) {
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
  const NAV_VIEWS = ["home", "dogam", "meet", "community", "mypage"];
  function show(view) {
    state.view = view;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + view; });
    $("#bottom-nav").style.display = view === "onboard" ? "none" : "";
    const navView = NAV_VIEWS.includes(view) ? view
      : { jobs: "home", alerts: "home", chat: "home", finder: "home", quiz: "home", calc: "home", pay: "home", spirit: "dogam", "spirit-write": "dogam", "meet-detail": "meet", "meet-write": "meet", write: "community", post: "community", settings: "mypage", favjobs: "mypage", myposts: "mypage" }[view] || "home";
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === navView));
    if (view === "home") renderHome();
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
  }

  /* ---------- 온보딩 ---------- */
  function renderOnboard() {
    $("#ob-colors").innerHTML = COLORS.map((c, i) =>
      `<button class="color-dot ${i === state.obColor ? "selected" : ""}" style="background:${c}" data-i="${i}" aria-label="색상 ${i + 1}"></button>`).join("");
    $$("#ob-colors .color-dot").forEach((d) =>
      d.addEventListener("click", () => { state.obColor = +d.dataset.i; renderOnboard(); }));
    const ok = $("#ob-nick").value.trim().length >= 1;
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
    if (first) {
      addPoints(500, "가입 축하");
      addNoti("🎉", `${nick}님, 바텐톡에 오신 걸 환영해요! 가입 축하 500P를 드렸어요.`);
    }
    show("home");
  }

  /* ---------- 홈 ---------- */
  function renderHome() {
    const h = new Date().getHours();
    const greet = h < 6 ? "새벽 마감까지 고생 많아요 🌙" : h < 12 ? "좋은 아침이에요 ☀️" : h < 18 ? "오픈 준비 잘 되고 있나요? 😊" : "오늘 장사도 화이팅! 🔥";
    $("#home-greet").innerHTML = `${esc(state.user.nick)}님, 안녕하세요!<small>${greet}</small>`;

    // 오늘의 칵테일 (날짜 기반 고정 추천)
    const cts = state.spirits.filter((s) => s.kind === "cocktail");
    if (cts.length) {
      const d = new Date();
      const pick = cts[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % cts.length];
      $("#daily-cocktail").innerHTML = `
        <span class="dc-emoji">${pick.emoji}</span>
        <div class="dc-body">
          <div class="dc-name">${esc(pick.name)}</div>
          <div class="dc-sub">${esc(pick.base)} 베이스 · 오늘 한 잔 어때요?</div>
        </div>
        <svg viewBox="0 0 24 24" class="chev-r"><path d="M9 6l6 6-6 6"/></svg>`;
      $("#daily-cocktail").onclick = () => openSpirit(pick.id);
    }

    const top = [...state.spirits]
      .sort((a, b) => (b.reviews.length * 10 + avgStars(b)) - (a.reviews.length * 10 + avgStars(a)))
      .slice(0, 6);
    $("#home-spirits").innerHTML = top.map((sp) => `
      <div class="spirit-card pressable" data-id="${sp.id}">
        <span class="sc-emoji">${sp.emoji}</span>
        <span class="sc-name">${esc(sp.name)}</span>
        <span class="sc-stars">★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</span>
        <span class="sc-meta">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스" : esc(sp.cat)}</span>
      </div>`).join("");
    $$("#home-spirits .spirit-card").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));

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

    const hot = [...state.posts].sort((a, b) => (b.likes + b.comments.length) - (a.likes + a.comments.length)).slice(0, 3);
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
      (!q || j.title.includes(q) || j.shop.includes(q))
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
    $("#dogam-sort").innerHTML = SORTS.map(([k, l]) =>
      `<button class="chip ${k === state.dogamSort ? "active" : ""}" data-s="${k}">${l}</button>`).join("");
    $$("#dogam-sort .chip").forEach((ch) =>
      ch.addEventListener("click", () => { state.dogamSort = ch.dataset.s; renderDogam(); }));

    const q = $("#spirit-search").value.trim();
    const list = state.spirits.filter((sp) =>
      sp.kind === state.dogamKind &&
      (state.dogamCat === "전체" || (sp.kind === "spirit" ? sp.cat : sp.base) === state.dogamCat) &&
      (!q || sp.name.includes(q))
    ).sort((a, b) =>
      state.dogamSort === "stars" ? avgStars(b) - avgStars(a) :
      state.dogamSort === "reviews" ? b.reviews.length - a.reviews.length :
      b.time - a.time);

    $("#spirit-list").innerHTML = list.length
      ? list.map((sp) => `
        <div class="spirit-item" data-id="${sp.id}">
          <span class="spirit-emoji">${sp.emoji}</span>
          <div class="spirit-info">
            <div class="spirit-name">${esc(sp.name)}</div>
            <div class="spirit-meta">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스 · 약 " + sp.abv + "%" : esc(sp.cat) + " · " + sp.abv + "%" + (sp.price ? " · " + esc(sp.price) : "")}</div>
          </div>
          <div class="spirit-rate">
            <div class="stars">★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</div>
            <div class="cnt">리뷰 ${sp.reviews.length}</div>
          </div>
        </div>`).join("")
      : '<div class="empty-state">아직 등록된 항목이 없어요.<br>오른쪽 아래 + 버튼으로 등록해보세요!</div>';
    $$("#spirit-list .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
  }

  /* ---------- 술 상세 ---------- */
  function openSpirit(id) {
    state.curSpirit = id;
    state.reviewStars = 5;
    renderSpiritDetail();
    renderStarPick();
    show("spirit");
  }
  function renderSpiritDetail() {
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    const avg = avgStars(sp);
    const isCt = sp.kind === "cocktail";
    $("#spirit-detail").innerHTML = `
      <div class="sp-hero">
        <div class="big-emoji">${sp.emoji}</div>
        <h2>${esc(sp.name)}</h2>
        <div class="sp-sub">${isCt ? esc(sp.base) + " 베이스 칵테일 · 약 " + sp.abv + "%" : esc(sp.cat) + " · " + sp.abv + "%" + (sp.price ? " · " + esc(sp.price) : "")}</div>
        <div class="sp-stars">${starStr(avg)} ${avg ? avg.toFixed(1) : ""} <small>(리뷰 ${sp.reviews.length})</small></div>
      </div>
      ${isCt ? `
      <div class="sp-body">
        <h3>재료 🧾</h3>
        <p>${esc(sp.ings)}</p>
      </div>
      <div class="sp-body">
        <h3>만드는 법 🍸</h3>
        <p>${esc(sp.recipe)}</p>
      </div>` : ""}
      <div class="sp-body">
        <h3>${isCt ? "메모" : "테이스팅 노트"} 📝</h3>
        <p>${esc(sp.note || "아직 설명이 없어요.")}</p>
        <div class="sp-by">등록 · ${esc(sp.by)} · ${fmtTime(sp.time)}</div>
      </div>
      <div class="comment-sec-title">리뷰 ${sp.reviews.length}</div>
      ${sp.reviews.map((r) => `
        <div class="review-item">
          <span class="avatar" style="background:${COLORS[r.color]}"></span>
          <div class="review-body">
            <div class="review-head">
              <span class="review-nick">익명</span>
              <span class="review-stars">${starStr(r.stars)}</span>
              <span class="review-time">${fmtTime(r.time)}</span>
            </div>
            <div class="review-text">${esc(r.text)}</div>
          </div>
        </div>`).join("") || '<div class="empty-state" style="padding:32px 0">첫 리뷰를 남겨보세요!</div>'}
      <div style="height:24px"></div>`;
  }
  function renderStarPick() {
    $("#star-pick").innerHTML = [1, 2, 3, 4, 5].map((n) =>
      `<button class="${n <= state.reviewStars ? "on" : ""}" data-n="${n}">⭐</button>`).join("");
    $$("#star-pick button").forEach((b) =>
      b.addEventListener("click", () => { state.reviewStars = +b.dataset.n; renderStarPick(); }));
  }
  function addReview() {
    const text = $("#review-input").value.trim();
    if (!text) return;
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    sp.reviews.push({ color: state.user.color, stars: state.reviewStars, text, time: Date.now() });
    saveSpirits();
    $("#review-input").value = "";
    renderSpiritDetail();
    addPoints(30, "리뷰 작성");
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
  function updateSwSubmit() {
    const baseOk = $("#sw-name").value.trim() && state.swCat && $("#sw-abv").value !== "";
    const ctOk = state.swKind === "spirit" || ($("#sw-ings").value.trim() && $("#sw-recipe").value.trim());
    const ok = baseOk && ctOk;
    $("#sw-submit").disabled = !ok;
    $("#sw-submit").classList.toggle("ready", !!ok);
  }
  function submitSpirit() {
    if ($("#sw-submit").disabled) return;
    const id = Math.max(0, ...state.spirits.map((s) => s.id)) + 1;
    const item = {
      id, kind: state.swKind, emoji: EMOJIS[state.swEmoji],
      name: $("#sw-name").value.trim(), abv: +$("#sw-abv").value,
      note: $("#sw-note").value.trim(), by: "익명", time: Date.now(), reviews: [], mine: true,
    };
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
    checkKeywords(item.name, item.note || "");
    ["sw-name", "sw-abv", "sw-price", "sw-note", "sw-ings", "sw-recipe"].forEach((i) => { $("#" + i).value = ""; });
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

    const list = state.meets
      .filter((m) => state.meetRegion === "전체" || m.region === state.meetRegion)
      .sort((a, b) => a.date - b.date);
    $("#meet-list").innerHTML = list.length
      ? list.map((m) => {
        const full = m.joined >= m.max;
        return `
        <div class="meet-item" data-id="${m.id}">
          <div class="meet-top">
            <span class="meet-region">${esc(m.region)}</span>
            <span class="meet-state ${full ? "closed" : ""}">${full ? "마감" : "모집중"}</span>
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
        ${m.mine ? "" : `
        <button class="join-btn ${m.isJoined ? "joined" : ""} ${full ? "full" : ""}" id="meet-join">
          ${m.isJoined ? "참여 취소하기" : full ? "모집이 마감되었어요" : "참여하기 🙋"}
        </button>
        <button class="host-chat-btn" id="meet-host-chat">💬 주최자에게 1:1 채팅</button>`}
      </div>
      <div class="comment-sec-title">댓글 ${m.comments.length}</div>
      ${m.comments.map((c) => `
        <div class="comment-item">
          <span class="avatar" style="background:${COLORS[c.color]}"></span>
          <div class="comment-body">
            <div class="comment-head"><span class="comment-nick">익명</span><span class="comment-time">${fmtTime(c.time)}</span></div>
            <div class="comment-text">${esc(c.text)}</div>
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    const joinBtn = $("#meet-join");
    if (joinBtn) joinBtn.addEventListener("click", () => {
      if (full) return;
      m.isJoined = !m.isJoined;
      m.joined += m.isJoined ? 1 : -1;
      saveMeets();
      renderMeetDetail();
      if (m.isJoined) {
        toast("모임에 참여했어요! 🎉");
        addNoti("🍻", `'${m.title}' 모임에 참여했어요. ${fmtDate(m.date)} 잊지 마세요!`);
      } else toast("참여를 취소했어요.");
    });
    const chatBtn = $("#meet-host-chat");
    if (chatBtn) chatBtn.addEventListener("click", () =>
      openChatWith(m.hostColor, `meet:${m.id}`, `모임 '${m.title}' 주최자`));
  }
  function addMeetComment() {
    const text = $("#meet-comment-input").value.trim();
    if (!text) return;
    const m = state.meets.find((x) => x.id === state.curMeet);
    if (!m) return;
    m.comments.push({ color: state.user.color, text, time: Date.now() });
    saveMeets();
    $("#meet-comment-input").value = "";
    renderMeetDetail();
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
    const dateStr = $("#mw-date").value + "T" + ($("#mw-time").value || "19:00");
    const id = Math.max(0, ...state.meets.map((m) => m.id)) + 1;
    const meet = {
      id, region: state.mwRegion, title: $("#mw-title").value.trim(),
      date: new Date(dateStr).getTime(), place: $("#mw-place").value.trim(),
      max: +$("#mw-max").value, joined: 1, desc: $("#mw-desc").value.trim(),
      host: "익명(나)", hostColor: state.user.color, isJoined: true, mine: true, comments: [],
    };
    state.meets.push(meet);
    saveMeets();
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
    let list = [...state.posts];
    if (state.commTab === "hot") list = list.filter((p) => p.cat === "hot" || p.likes + p.comments.length >= 10);
    else if (state.commTab !== "all") list = list.filter((p) => p.cat === state.commTab);
    if (q) list = list.filter((p) => p.title.includes(q) || p.body.includes(q));
    list.sort((a, b) => b.time - a.time);

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
  function openPost(id) {
    state.curPost = id;
    renderPostDetail();
    show("post");
  }
  function renderPostDetail() {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    $("#post-delete").hidden = !p.mine;
    $("#post-chat").hidden = !!p.mine;
    $("#post-detail").innerHTML = `
      <div class="detail-wrap">
        <div class="detail-head">
          <span class="avatar md" style="background:${COLORS[p.color]}"></span>
          <div><div class="detail-nick">${esc(p.nick)}${p.mine ? ' <span class="my-tag">내 글</span>' : ""}</div><div class="detail-time">${fmtTime(p.time)}</div></div>
          <span class="cat-tag detail-cat">${CAT_LABEL[p.cat] || "자유"}</span>
        </div>
        <div class="detail-title">${esc(p.title)}</div>
        ${p.img ? `<img class="detail-img" src="${p.img}" alt="첨부 이미지">` : ""}
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
  function deletePost() {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p || !p.mine) return;
    if (!confirm("이 글을 삭제할까요?")) return;
    state.posts = state.posts.filter((x) => x.id !== p.id);
    state.user.myPostIds = state.user.myPostIds.filter((i) => i !== p.id);
    savePosts(); saveUser();
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
  function compressImage(file, cb) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cb(cv.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast("이미지를 불러올 수 없어요."); };
    img.src = url;
  }
  function submitPost() {
    const title = $("#write-title").value.trim();
    const body = $("#write-body").value.trim();
    if (!title || !body) return;
    const id = Math.max(0, ...state.posts.map((p) => p.id)) + 1;
    const post = {
      id, cat: state.writeCat, color: state.user.color, nick: "익명",
      time: Date.now(), title, body, likes: 0, comments: [], mine: true,
    };
    if (state.pendingImg) post.img = state.pendingImg;
    state.posts.push(post);
    state.user.myPostIds.push(id);
    savePosts(); saveUser();
    checkKeywords(title, body);
    $("#write-title").value = "";
    $("#write-body").value = "";
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
          <span class="chat-time">${fmtRel(c.time)}</span>
        </div>`;
      }).join("")
      : '<div class="empty-state">채팅이 없어요.<br>게시글이나 모임에서 1:1 채팅을 시작해보세요.</div>';
    $$("#chat-list .chat-item").forEach((el) =>
      el.addEventListener("click", () => openChat(+el.dataset.id)));
  }
  function openChatWith(color, key, ctx) {
    let c = state.chats.find((x) => x.key === key);
    if (!c) {
      const id = Math.max(0, ...state.chats.map((x) => x.id)) + 1;
      c = { id, key, color, ctx, msgs: [], time: Date.now() };
      state.chats.push(c);
      saveChats();
    }
    openChat(c.id);
  }
  function openChat(id) {
    state.curChat = id;
    renderChatMsgs();
    show("chat");
  }
  function renderChatMsgs() {
    const c = state.chats.find((x) => x.id === state.curChat);
    if (!c) return;
    $("#chat-avatar").style.background = COLORS[c.color];
    $("#chat-title").textContent = "익명 · " + c.ctx;
    $("#chat-msgs").innerHTML = `
      <div class="chat-hint">상대방도 익명으로 표시돼요.<br>상대방이 접속하면 메시지를 확인할 수 있어요.</div>
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
    c.msgs.push({ me: true, text, time: Date.now() });
    c.time = Date.now();
    saveChats();
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
    openSheetHTML(`
      <h3>고객센터</h3>
      <div class="sheet-row"><span>📧 이메일 문의</span><span class="r">3663hong@gmail.com</span></div>
      <div class="sheet-row"><span>🕐 운영 시간</span><span class="r">평일 10:00 ~ 19:00</span></div>
      <div class="sheet-row"><span>📱 앱 버전</span><span class="r">v1.0</span></div>
      <p class="sheet-note">신고·건의사항은 이메일로 보내주시면 순차적으로 답변드려요. 커뮤니티 규칙 위반 게시물은 발견 즉시 제재됩니다.</p>`);
  }
  function openRulesSheet() {
    openSheetHTML(`
      <h3>커뮤니티 이용규칙</h3>
      <div class="sheet-row"><span>1. 서로 존중하는 언어를 사용해주세요.</span></div>
      <div class="sheet-row"><span>2. 광고·도배성 글은 홍보 게시판만 이용해주세요.</span></div>
      <div class="sheet-row"><span>3. 개인정보(실명·연락처·매장 실명 비방)는 올리지 마세요.</span></div>
      <div class="sheet-row"><span>4. 불법 정보, 성적 콘텐츠는 즉시 삭제·제재됩니다.</span></div>
      <div class="sheet-row"><span>5. 모임은 공개된 장소에서, 안전하게 진행해주세요.</span></div>
      <p class="sheet-note">규칙 위반 시 게시글 삭제 및 이용 제한이 있을 수 있어요.</p>`);
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
          <span class="spirit-emoji">${m.c.emoji}</span>
          <div class="spirit-info">
            <div class="spirit-name">${esc(m.c.name)}</div>
            <div class="spirit-meta">${esc(cocktailIngs(m.c).join(", "))}</div>
          </div>
          <span class="finder-match">${m.have === m.total ? "✅ 완성 가능" : `${m.have}/${m.total} 보유`}</span>
        </div>`).join("")
      : '<div class="empty-state" style="padding:40px 20px">선택한 재료로 만들 수 있는 칵테일이 없어요.</div>';
    $$("#finder-results .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
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
  $("#ob-start").addEventListener("click", startApp);
  $("#ob-nick").addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("#ob-start").disabled) startApp(); });

  // 술도감
  $$("#dogam-seg .seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.dogamKind = b.dataset.kind;
      state.dogamCat = "전체";
      $$("#dogam-seg .seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      renderDogam();
    })
  );
  $("#spirit-search").addEventListener("input", renderDogam);
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
  $("#review-send").addEventListener("click", addReview);
  $("#review-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addReview(); });
  $("#spirit-share").addEventListener("click", shareSpirit);

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
  $("#fab-write").addEventListener("click", () => show("write"));

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
  $$(".cat-chip").forEach((c) =>
    c.addEventListener("click", () => {
      state.writeCat = c.dataset.cat;
      $$(".cat-chip").forEach((x) => x.classList.toggle("active", x === c));
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

  // 게시글 상세
  $("#comment-send").addEventListener("click", addComment);
  $("#comment-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addComment(); });
  $("#post-delete").addEventListener("click", deletePost);
  $("#post-chat").addEventListener("click", () => {
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p || p.mine) return;
    openChatWith(p.color, `post:${p.id}`, `글 '${p.title.slice(0, 12)}${p.title.length > 12 ? "…" : ""}'`);
  });

  // 마이페이지
  $("#btn-settings").addEventListener("click", () => show("settings"));
  $("#btn-favjobs").addEventListener("click", () => show("favjobs"));
  $("#btn-myposts").addEventListener("click", () => show("myposts"));
  $("#btn-support").addEventListener("click", openSupportSheet);
  $("#btn-points").addEventListener("click", openPointSheet);
  $("#btn-logout").addEventListener("click", () => {
    if (!confirm("로그아웃할까요? 데이터는 이 기기에 안전하게 보관돼요.")) return;
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
    updateNickBtn();
    toast("닉네임이 변경되었어요.");
  });
  $("#btn-profile-save").addEventListener("click", () => {
    state.user.color = state.selColor;
    saveUser();
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
  $("#btn-withdraw").addEventListener("click", () => {
    if (!state.agreeWithdraw) return;
    if (!confirm("정말 탈퇴하시겠어요? 모든 데이터가 삭제돼요.")) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bartalk_"))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  });

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* ---------- 초기화 ---------- */
  applyTheme();
  updateBadge();
  if (state.user.onboarded && state.user.nick) {
    show("home");
  } else {
    state.obColor = state.user.color;
    renderOnboard();
    show("onboard");
  }
})();
