/* 대회·주류 행사 달력 — 연도별로 운영팀이 확인해서 넣습니다.
 *
 * 2027년을 넣을 때: 아래 EVENTS 에 "2027": [ ... ] 를 추가하면 화면에 연도 탭이 하나 더 생겨요.
 * 각 항목:
 *   id     고유 문자열 (연도-짧은이름)
 *   kind   contest(대회) | expo(박람회·페스티벌) | popup(팝업·브랜드 행사)
 *   title  이름 / org 주최 / place 장소 / region 지역(서울·경기·인천·부산·대구·대전·광주·전국)
 *   start·end  YYYY-MM-DD (하루짜리는 같은 날짜)
 *   apply  { start, end }  참가·사전예매 접수 기간 (있을 때만)
 *   fee    입장료·참가비 문구 / link 공식 페이지 / note 한 줄 설명
 *
 * 출처(2026): 코엑스 행사 안내, siwse.com, barshow.co.kr, soolfair.com, bilie.kr, busan.siwse.com,
 *   디아지오코리아·파라다이스시티 보도자료(월드클래스 코리아 2026), 한국베버리지마스터협회·SIWSE 공지(코리안컵),
 *   캄파리코리아 보도자료(더 글렌그란트 팝업), 발베니 보도자료(다니엘 아샴 협업 팝업).
 *   날짜는 주최 측 공지로 바뀔 수 있으니 접수 전에 공식 페이지를 확인하세요. */
(function () {
  "use strict";
  window.EVENTS_DATA = {
    "2026": [
      {
        id: "2026-worldclass", kind: "contest",
        title: "월드클래스 코리아 2026", org: "디아지오코리아",
        region: "인천", place: "파라다이스시티 라이브 뮤직 라운지 바 '루빅' (영종도) — 파이널",
        start: "2026-06-13", end: "2026-06-13", apply: { start: "2026-03-01", end: "2026-03-31" },
        fee: "참가 무료", link: "https://www.theworldclassclub.com/",
        note: "세계 최대 바텐딩 대회의 한국 예선. 3월 모집 → 1·2차 챌린지 → 파이널 10명. 우승자는 10월 글로벌 파이널에 한국 대표로. 2026 우승 육수빈(바 피어).",
      },
      {
        id: "2026-koreancup", kind: "contest",
        title: "제19회 코리안컵 칵테일대회 (농림축산식품부장관배)", org: "한국베버리지마스터협회 · 한국바텐더협회",
        region: "서울", place: "코엑스 C홀 — 서울국제주류&와인박람회 현장",
        start: "2026-06-18", end: "2026-06-20", apply: { start: "2026-05-26", end: "2026-06-06" },
        fee: "협회 공지 참고", link: "https://www.siwse.com/41_2/28",
        note: "프로리그 · 대학리그. 창작 칵테일 경연. 매년 5월 말 접수, 6월 박람회 현장에서 본선.",
      },
      {
        id: "2026-siwse", kind: "expo",
        title: "2026 서울국제주류&와인박람회 (SIWSE)", org: "한국국제전시",
        region: "서울", place: "코엑스 3층 C홀",
        start: "2026-06-18", end: "2026-06-20", apply: { start: "2026-03-13", end: "2026-06-17" },
        fee: "현장 25,000원 · 사전예매 17,500~20,000원", link: "https://www.siwse.com/",
        note: "35회째. 와인·위스키·맥주·전통주 360여 개사, 8,000여 브랜드. 코리안컵 칵테일대회가 같은 자리에서 열려요.",
      },
      {
        id: "2026-daegu", kind: "expo",
        title: "2026 대구 국제 주류&칵테일 쇼", org: "대구국제주류&칵테일쇼 조직위원회",
        region: "대구", place: "대구 EXCO 6홀",
        start: "2026-06-26", end: "2026-06-28",
        fee: "공식 페이지 확인", link: "https://soolfair.com/",
        note: "영남권 주류·스피릿·칵테일 전문 박람회. 세미나·부대행사.",
      },
      {
        id: "2026-glengrant", kind: "popup",
        title: "더 글렌그란트 미식 페어링 팝업", org: "캄파리코리아",
        region: "서울", place: "성수동 스테이지 엑스 성수 (차봇)",
        start: "2026-06-27", end: "2026-07-05",
        fee: "무료 (예약)", link: "https://www.ddaily.co.kr/page/view/2026062516540274230",
        note: "12·15·18년 아로마 비교, 취향 테스트로 페어링 메뉴 추천. 셰프 5인 미식 페어링 캠페인.",
      },
      {
        id: "2026-barshow", kind: "expo",
        title: "2026 서울바앤스피릿쇼", org: "엑스포럼",
        region: "서울", place: "코엑스 3층 D홀",
        start: "2026-07-24", end: "2026-07-26",
        fee: "1일권 26,000~27,000원 · 3일권 53,000원", link: "https://www.barshow.co.kr/",
        note: "국내 유일 Bar & Spirits 전문 전시회. 금·토 11~19시, 일 11~18시. 몽키숄더 UBC 등 바텐더 대회가 현장에서 열리는 해가 많아요.",
      },
      {
        id: "2026-bilie", kind: "expo",
        title: "2026 부산국제주류박람회 (BILIE)", org: "명진F&F",
        region: "부산", place: "벡스코 제1전시장 3홀",
        start: "2026-08-14", end: "2026-08-16",
        fee: "공식 페이지 확인", link: "https://www.bilie.kr/",
        note: "부산·경남권 주류 박람회. 시음·세미나.",
      },
      {
        id: "2026-balvenie", kind: "popup",
        title: "발베니 × 다니엘 아샴 'DAWN OF OUR SPIRIT' 팝업", org: "발베니 (윌리엄그랜트앤선즈)",
        region: "서울", place: "성수동 S50",
        start: "2026-09-02", end: "2026-09-06",
        fee: "무료 (예약)", link: "https://www.businesskorea.co.kr/news/articleView.html?idxno=274831",
        note: "한정판 협업 제품 글로벌 순회 첫 공개. 9/1 미디어·VIP, 9/2~6 일반 오픈.",
      },
      {
        id: "2026-busan-siwse", kind: "expo",
        title: "2026 부산국제주류&와인박람회", org: "한국국제전시",
        region: "부산", place: "벡스코 제1전시장 3홀",
        start: "2026-12-11", end: "2026-12-13",
        fee: "사전등록·예매는 공식 페이지", link: "https://busan.siwse.com/",
        note: "서울국제주류&와인박람회의 부산판. 세계전통주페스티벌·국제맥주전시회 동시 개최.",
      },
    ],
  };
})();
