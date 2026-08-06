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
    cart: store.get("cart", []),
    orders: store.get("orders", []),
    worklog: store.get("worklog", []),
    imgCache: store.get("imgCache", {}),
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
    mwRegion: null,
    storeCat: "전체",
    curProduct: null,
    pdQty: 1,
    wlOffset: 0,
    dogamSort: "new",
    dogamRegion: "전체",
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

  /* ---------- 시드 병합 (앱 업데이트 시 새 데이터 추가) ---------- */
  const SEED_V = 4;
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
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
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
  function show(view, fromPop) {
    if (!fromPop && view !== state.view && view !== "onboard") {
      try { history.pushState({ view }, "", "#" + view); } catch {}
    }
    state.view = view;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + view; });
    $("#bottom-nav").style.display = view === "onboard" ? "none" : "";
    const navView = NAV_VIEWS.includes(view) ? view
      : { jobs: "home", alerts: "home", chat: "home", finder: "home", quiz: "home", calc: "home", pay: "home", market: "home", "market-detail": "home", cart: "home", worklog: "home", units: "home", search: "home", spirit: "dogam", "spirit-write": "dogam", "meet-detail": "meet", "meet-write": "meet", write: "community", post: "community", settings: "mypage", favjobs: "mypage", myposts: "mypage", orders: "mypage", cellar: "mypage" }[view] || "home";
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === navView));
    if (view === "home") renderHome();
    if (view === "market") renderStore();
    if (view === "cart") renderCart();
    if (view === "orders") renderOrders();
    if (view === "worklog") renderWorklog();
    if (view === "units") renderUnits();
    if (view === "cellar") renderCellar();
    if (view === "search") setTimeout(() => $("#global-search").focus(), 50);
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
  function regionOfWhisky(name) {
    const t = String(name).split(/\s+/);
    return TWO_TOKEN_REGION[t[0] + " " + (t[1] || "")] || WREGION[t[0]] || "기타";
  }
  const WHISKY_REGIONS = ["전체", "스페이사이드", "하이랜드", "아일라", "아일랜즈", "캠벨타운", "로우랜드", "블렌디드", "아이리시", "아메리칸", "재패니즈", "기타"];
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

  /* ---------- 통합 검색 ---------- */
  function renderSearch() {
    const q = $("#global-search").value.trim();
    if (q.length < 1) {
      $("#search-results").innerHTML = '<div class="empty-state">술, 칵테일, 게시글, 채용, 모임, 상품을<br>한 번에 검색해보세요.</div>';
      return;
    }
    const sec = (title, items) => items.length
      ? `<div class="comment-sec-title">${title} ${items.length}</div>${items.join("")}` : "";
    const spirits = state.spirits.filter((s) => has(s.name, q)).slice(0, 5).map((sp) => `
      <div class="home-mini" data-go-spirit="${sp.id}">
        <span class="hm-emoji">${sp.kind === "cocktail" ? "🍸" : "🥃"}</span>
        <div class="hm-body"><div class="hm-title">${esc(sp.name)}</div>
        <div class="hm-sub">${sp.kind === "cocktail" ? esc(sp.base) + " 베이스" : esc(sp.cat)} · ★ ${avgStars(sp) ? avgStars(sp).toFixed(1) : "-"}</div></div>
      </div>`);
    const posts = state.posts.filter((p) => has(p.title, q) || has(p.body, q)).slice(0, 5).map((p) => `
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
    $("#home-greet").innerHTML = `${esc(state.user.nick)}님, 안녕하세요!<small>${greet}</small>`;

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

    // 위스키 지역 필터
    $("#dogam-region").hidden = !isWhisky;
    if (isWhisky) {
      $("#dogam-region").innerHTML = WHISKY_REGIONS.map((r) =>
        `<button class="chip ${r === state.dogamRegion ? "active" : ""}" data-r="${r}">${r}</button>`).join("");
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
      sp.kind === state.dogamKind &&
      (state.dogamCat === "전체" || (sp.kind === "spirit" ? sp.cat : sp.base) === state.dogamCat) &&
      (!isWhisky || state.dogamRegion === "전체" || regionOfWhisky(sp.name) === state.dogamRegion) &&
      (state.dogamKind !== "spirit" || (abvOk(sp) && priceOk(sp))) &&
      (!q || has(sp.name, q))
    ).sort((a, b) =>
      state.dogamSort === "stars" ? avgStars(b) - avgStars(a) :
      state.dogamSort === "reviews" ? b.reviews.length - a.reviews.length :
      b.time - a.time);

    $("#spirit-list").innerHTML = list.length
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
      : '<div class="empty-state">아직 등록된 항목이 없어요.<br>오른쪽 아래 + 버튼으로 등록해보세요!</div>';
    $$("#spirit-list .spirit-item").forEach((el) =>
      el.addEventListener("click", () => openSpirit(+el.dataset.id)));
    wireImgFallback("#spirit-list");
  }

  /* ---------- 술 상세 ---------- */
  function openSpirit(id) {
    state.curSpirit = id;
    state.reviewStars = 5;
    state.ctMult = 1;
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
      <div class="sp-hero-media">${thumbHTML(sp)}</div>
      <div class="sp-hero">
        <h2>${esc(sp.name)}</h2>
        <div class="sp-sub">${isCt ? esc(sp.base) + " 베이스 칵테일 · 약 " + sp.abv + "%" : esc(sp.cat) + " · " + sp.abv + "%" + (sp.price ? " · " + esc(sp.price) : "")}</div>
        <div class="sp-stars">${starStr(avg)} ${avg ? avg.toFixed(1) : ""} <small>(리뷰 ${sp.reviews.length})</small></div>
        <div class="cellar-row">
          <button class="cellar-btn ${inCellar("tried", sp.id) ? "on" : ""}" id="cellar-tried">🥃 마셔봤어요</button>
          <button class="cellar-btn ${inCellar("wish", sp.id) ? "on" : ""}" id="cellar-wish">⭐ 위시리스트</button>
        </div>
      </div>
      ${isCt ? `
      <div class="sp-body">
        <h3>재료 🧾
          <span class="mult-seg">
            ${[1, 2, 4].map((m) => `<button class="mult-btn ${state.ctMult === m ? "on" : ""}" data-m="${m}">${m}잔</button>`).join("")}
          </span>
        </h3>
        <p>${esc(scaleIngs(sp.ings, state.ctMult))}</p>
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
            ${r.text ? `<div class="review-text">${esc(r.text)}</div>` : ""}
            ${r.img ? `<img class="cmt-img" src="${r.img}" alt="리뷰 사진">` : ""}
          </div>
        </div>`).join("") || '<div class="empty-state" style="padding:32px 0">첫 리뷰를 남겨보세요!</div>'}
      <div style="height:24px"></div>`;
    wireImgFallback("#spirit-detail");
    $$("#spirit-detail .cmt-img").forEach((im) =>
      im.addEventListener("click", () => openLightbox(im.src)));
    $("#cellar-tried").addEventListener("click", () => { toggleCellar("tried", sp.id); renderSpiritDetail(); });
    $("#cellar-wish").addEventListener("click", () => { toggleCellar("wish", sp.id); renderSpiritDetail(); });
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
    const sp = state.spirits.find((x) => x.id === state.curSpirit);
    if (!sp) return;
    const rv = { color: state.user.color, stars: state.reviewStars, text, time: Date.now() };
    if (pendingImg.review) rv.img = pendingImg.review;
    sp.reviews.push(rv);
    state.user.myReviews++;
    saveSpirits(); saveUser();
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
    const imgUrl = $("#sw-img").value.trim();
    if (/^https?:\/\//.test(imgUrl)) item.img = imgUrl;
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
    ["sw-name", "sw-abv", "sw-price", "sw-note", "sw-ings", "sw-recipe", "sw-img"].forEach((i) => { $("#" + i).value = ""; });
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
        ${m.mine ? "" : m.date < Date.now() ? `
        <button class="join-btn full" disabled>종료된 모임이에요</button>` : `
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
            ${c.text ? `<div class="comment-text">${esc(c.text)}</div>` : ""}
            ${c.img ? `<img class="cmt-img" src="${c.img}" alt="댓글 사진">` : ""}
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    $$("#meet-detail .cmt-img").forEach((im) =>
      im.addEventListener("click", () => openLightbox(im.src)));
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
        if ("Notification" in window && Notification.permission === "default")
          Notification.requestPermission().catch(() => {});
        checkBadges();
      } else toast("참여를 취소했어요.");
    });
    const chatBtn = $("#meet-host-chat");
    if (chatBtn) chatBtn.addEventListener("click", () =>
      openChatWith(m.hostColor, `meet:${m.id}`, `모임 '${m.title}' 주최자`));
  }
  function addMeetComment() {
    const text = $("#meet-comment-input").value.trim();
    if (!text && !pendingImg.meet) return;
    const m = state.meets.find((x) => x.id === state.curMeet);
    if (!m) return;
    const c = { color: state.user.color, text, time: Date.now() };
    if (pendingImg.meet) c.img = pendingImg.meet;
    m.comments.push(c);
    state.user.myComments++;
    saveMeets(); saveUser();
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
    if (q) list = list.filter((p) => has(p.title, q) || has(p.body, q));
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
    $("#post-edit").hidden = !p.mine;
    $("#post-chat").hidden = !!p.mine;
    state.replyTo = null;
    $("#reply-bar").hidden = true;
    $("#post-detail").innerHTML = `
      <div class="detail-wrap">
        <div class="detail-head">
          <span class="avatar md" style="background:${COLORS[p.color]}"></span>
          <div><div class="detail-nick">${esc(p.nick)}${p.mine ? ' <span class="my-tag">내 글</span>' : ""}</div><div class="detail-time">${fmtTime(p.time)}${p.edited ? " · 수정됨" : ""}</div></div>
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
      ${p.comments.map((c, ci) => `
        <div class="comment-item">
          <span class="avatar" style="background:${COLORS[c.color]}"></span>
          <div class="comment-body">
            <div class="comment-head"><span class="comment-nick">익명</span><span class="comment-time">${fmtTime(c.time)}</span>
              <button class="reply-btn" data-ci="${ci}">답글</button></div>
            ${c.text ? `<div class="comment-text">${esc(c.text)}</div>` : ""}
            ${c.img ? `<img class="cmt-img" src="${c.img}" alt="댓글 사진">` : ""}
            ${(c.replies || []).map((rp) => `
              <div class="reply-item">
                <span class="avatar" style="background:${COLORS[rp.color]}"></span>
                <div class="comment-body">
                  <div class="comment-head"><span class="comment-nick">익명</span><span class="comment-time">${fmtTime(rp.time)}</span></div>
                  ${rp.text ? `<div class="comment-text">${esc(rp.text)}</div>` : ""}
                  ${rp.img ? `<img class="cmt-img" src="${rp.img}" alt="댓글 사진">` : ""}
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
      <div style="height:24px"></div>`;
    $$("#post-detail .reply-btn").forEach((b) =>
      b.addEventListener("click", () => {
        state.replyTo = +b.dataset.ci;
        $("#reply-bar").hidden = false;
        $("#comment-input").focus();
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
      renderPostDetail();
    });
  }
  function addComment() {
    const text = $("#comment-input").value.trim();
    if (!text && !pendingImg.post) return;
    const p = state.posts.find((x) => x.id === state.curPost);
    if (!p) return;
    const c = { color: state.user.color, text, time: Date.now() };
    if (pendingImg.post) c.img = pendingImg.post;
    if (state.replyTo !== null && p.comments[state.replyTo]) {
      const parent = p.comments[state.replyTo];
      parent.replies = parent.replies || [];
      parent.replies.push(c);
    } else {
      p.comments.push(c);
    }
    state.replyTo = null;
    $("#reply-bar").hidden = true;
    state.user.myComments++;
    savePosts(); saveUser();
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
    if (state.editPost !== null) {
      // 글 수정 모드
      const p = state.posts.find((x) => x.id === state.editPost);
      if (p) {
        p.title = title; p.body = body; p.cat = state.writeCat; p.edited = true;
        if (state.pendingImg) p.img = state.pendingImg;
        savePosts();
      }
      state.editPost = null;
      $("#view-write .topbar-title").textContent = "글쓰기";
      $("#write-title").value = "";
      $("#write-body").value = "";
      setPendingImg(null);
      $("#write-file").value = "";
      updateSubmit();
      if (p) { openPost(p.id); toast("게시글을 수정했어요."); }
      else show("community");
      return;
    }
    const id = Math.max(0, ...state.posts.map((p) => p.id)) + 1;
    const post = {
      id, cat: state.writeCat, color: state.user.color, nick: "익명",
      time: Date.now(), title, body, likes: 0, comments: [], mine: true,
    };
    if (state.pendingImg) post.img = state.pendingImg;
    state.posts.push(post);
    state.user.myPostIds.push(id);
    savePosts(); saveUser();
    checkBadges();
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
    const cel = state.user.cellar.tried.length + state.user.cellar.wish.length;
    $("#cellar-cnt").textContent = cel ? cel + "병" : "";
    checkBadges();
    $("#badge-count").textContent = `${state.user.badges.length}/${BADGES.length}`;
    $("#badge-grid").innerHTML = BADGES.map((b) => {
      const on = state.user.badges.includes(b.id);
      return `<div class="badge-item ${on ? "on" : ""}" title="${esc(b.desc)}">
        <span class="badge-ic">${on ? b.ic : "🔒"}</span>
        <span class="badge-name">${b.name}</span>
      </div>`;
    }).join("");
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
          <button class="mkd-chat-btn" id="pd-buy">바로 구매</button>
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
        <label class="form-label">받는 분</label>
        <input type="text" class="input" id="ship-name" placeholder="이름" value="${esc(ship0.name || "")}">
        <label class="form-label">연락처</label>
        <input type="tel" class="input" id="ship-phone" placeholder="010-0000-0000" value="${esc(ship0.phone || "")}">
        <label class="form-label">배송지 주소</label>
        <input type="text" class="input" id="ship-addr" placeholder="주소를 입력해주세요" value="${esc(ship0.addr || "")}">
        <label class="form-label">포인트 사용 (보유 ${fmtNum(state.user.points)}P)</label>
        <input type="number" class="input" id="cart-points" placeholder="0" min="0" max="${maxP}" inputmode="numeric">
        <div class="calc-result show" id="cart-total"></div>
        <button class="big-btn accent ready" id="cart-order" style="margin-top:16px">주문하기</button>
        <p class="sheet-note">주문 후 안내되는 계좌로 입금하면 배송이 시작돼요. 배송 정보는 내 기기에만 저장돼요. (데모: 실제 결제는 PG 연동이 필요해요)</p>
      </div>
      <div style="height:24px"></div>`;
    const renderTotal = () => {
      let used = Math.floor(+$("#cart-points").value || 0);
      used = Math.max(0, Math.min(used, maxP));
      $("#cart-total").innerHTML = `
        <div class="cr-row"><span>상품 합계</span><b>${fmtNum(subtotal)}원</b></div>
        <div class="cr-row"><span>배송비 ${ship === 0 ? "(3만원 이상 무료)" : ""}</span><b>${ship === 0 ? "무료" : fmtNum(ship) + "원"}</b></div>
        <div class="cr-row"><span>포인트 할인</span><b>-${fmtNum(used)}P</b></div>
        <div class="cr-row hl"><span>결제 예정 금액</span><b>${fmtNum(subtotal + ship - used)}원</b></div>`;
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
        time: Date.now(), status: "입금 대기",
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
      addNoti("📦", `주문 #BT${String(id).padStart(4, "0")}이 접수됐어요. 입금 확인 후 배송이 시작돼요!`);
      show("orders");
      toast("주문이 접수되었어요! 📦");
    });
  }

  function renderOrders() {
    const list = [...state.orders].sort((a, b) => b.time - a.time);
    $("#orders-area").innerHTML = list.length
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
      : '<div class="empty-state">주문 내역이 없어요.</div>';
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
    const id = Math.max(0, ...state.worklog.map((w) => w.id)) + 1;
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

  // 스토어
  $("#store-search").addEventListener("input", renderStore);
  $("#store-cart-btn").addEventListener("click", () => show("cart"));
  $("#pd-cart-btn").addEventListener("click", () => show("cart"));
  $("#btn-orders").addEventListener("click", () => show("orders"));

  // 데이터 백업/복원
  $("#btn-backup").addEventListener("click", () =>
    openSheet("데이터 백업/복원", ["📤 백업 파일 내려받기", "📥 백업 파일에서 복원"], null, (v) => {
      if (v.includes("내려받기")) exportData();
      else $("#restore-file").click();
    }));
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
  $("#fab-write").addEventListener("click", () => {
    state.editPost = null;
    $("#view-write .topbar-title").textContent = "글쓰기";
    show("write");
  });

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
    show("write");
  });

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
  // 브라우저/안드로이드 뒤로가기 지원
  window.addEventListener("popstate", (e) => {
    if (state.view === "onboard") { history.forward(); return; }
    show((e.state && e.state.view) || "home", true);
  });
  if (state.user.onboarded && state.user.nick) {
    try { history.replaceState({ view: "home" }, "", "#home"); } catch {}
    show("home", true);
    dailyAttend();
    checkMeetReminders();
  } else {
    state.obColor = state.user.color;
    renderOnboard();
    show("onboard", true);
  }
})();
