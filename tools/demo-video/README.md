# 시연 영상 만들기

앱이 실제로 돌아가는 모습을 휴대폰 화면 크기(390×844)로 녹화해 9:16 MP4(720×1280, 약 80초)로 만듭니다.
서버에는 접속하지 않고, **시연용 예시 데이터**로 돕니다. 영상 오른쪽 위에 그렇게 표시돼요.

## 준비 (한 번)

- 컴퓨터에 크롬이 설치돼 있어야 해요 (`C:/Program Files/Google/Chrome/Application/chrome.exe`).
- 이 폴더에서 `npm install`

## 만들기

1. 저장소 루트에서 로컬 서버 켜기: `node tools/serve.js` (http://localhost:4173)
2. 이 폴더에서
   - `npm run check` — 녹화 없이 장면마다 스크린샷 → `out/sheet.png` 로 흐름 확인
   - `npm run all` — 녹화 → `out/capture.json` → 인코딩 → `out/bartalk-demo.mp4` → 재생 확인 `out/verify.png`

## 구조

- `record.mjs` — 크롬을 조작해 장면을 진행하고 화면을 녹화. 장면·자막은 파일 아래쪽 "장면" 부분에서 고쳐요.
  - 사장님 입장 확인 장면은 가짜 카메라에 진짜 QR 을 띄워 앱의 실제 스캐너가 읽어요.
- `encode.mjs` — 크롬 WebCodecs(H.264)로 한 장면씩 인코딩, `mp4-muxer` 로 표준 MP4(빠른 시작)로 묶어요.
  (크롬 MediaRecorder 로 녹화하면 조각 MP4 가 돼서 길이가 틀리게 나와요)
- `verify.mjs` — 만든 영상을 재생하며 10개 시점을 뽑아 `out/verify.png`
