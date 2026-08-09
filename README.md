# 바텐톡 (BarTalk)

바텐더 익명 커뮤니티 PWA. 술도감 · 칵테일 레시피 · 모임 · 채용정보 · 바텐더 도구.

**운영 주소: https://bartender-gamma.vercel.app**

- 프레임워크 없는 순수 HTML/CSS/JS (빌드 단계 없음)
- **오프라인 우선**: 화면은 항상 기기 안 데이터로 즉시 그리고, 서버 데이터는 뒤이어 반영
- Supabase를 연결하면 커뮤니티가 여러 기기에서 공유되고, 연결하지 않으면 내 기기 전용 앱으로 동작

---

## 파일 구조

```
index.html               앱 본체 (모든 화면이 하나의 문서 안에 있음)
css/style.css            앱 스타일
css/legal.css            공개 정책 페이지 스타일
js/config.js             ★ 서버 연결 설정 (비우면 오프라인 모드)
api/naver-login.js       네이버 로그인 서버 함수 (Supabase 미지원분)
supabase/admin.sql       ★ 운영자 권한 (관리자 지정은 이 파일 주석 참고)
js/app.js                앱 로직 전체
js/sync.js               서버 동기화 계층 (인증·전송 큐·실시간·사진 업로드)
js/legal.js              약관·정책 원본 ★ 앱과 공개 페이지가 함께 사용
js/legal-page.js         공개 정책 페이지 렌더러
supabase/schema.sql      ★ 데이터베이스 스키마 + 보안 정책
manifest.json            PWA 매니페스트
sw.js                    서비스 워커 (오프라인 캐시)
icon.svg                 원본 아이콘
icons/                   PNG 아이콘 (192/512, maskable, apple-touch)
privacy.html             개인정보처리방침 (공개 URL)
terms.html               이용약관 (공개 URL)
account-deletion.html    계정·데이터 삭제 안내 (공개 URL, Play 필수)
opensource.html          오픈소스 라이선스 (공개 URL)
.well-known/assetlinks.json   TWA 도메인 검증 파일 (배포 전 값 채우기)
tools/gen-icons.js       PNG 아이콘 생성 스크립트
```

### 약관을 수정할 때

`js/legal.js` **한 곳만** 고치면 앱 안의 화면과 공개 정책 페이지에 동시에 반영됩니다.
파일 상단 `META`에 앱 버전·운영자·이메일·시행일이 들어 있습니다.

### 기능 플래그

`js/app.js` 상단 `FEATURES`:

| 플래그 | 기본값 | 의미 |
|---|---|---|
| `STORE_LIVE` | `false` | `false`면 스토어가 "정식 오픈 준비 중"으로 동작합니다. 결제·포인트 차감이 일어나지 않고 "사전 신청"만 접수돼요. PG 연동과 실제 배송 체계를 갖춘 뒤 `true`로 바꾸세요. |

> ⚠️ 결제 수단 없이 실제 주문을 받는 화면은 Google Play 심사에서 **미완성 기능**으로 반려될 수 있습니다. 인프라가 준비되기 전까지 `false`를 유지하세요.

---

## Supabase 연결 (커뮤니티 공유하기)

연결하기 전까지는 각자 기기에만 글이 저장됩니다. 아래 4단계면 실제 커뮤니티가 됩니다.

### 1. 프로젝트 만들기

[supabase.com](https://supabase.com) 에서 새 프로젝트를 만드세요. 리전은 **Northeast Asia (Seoul)** 을 권장합니다.

### 2. 스키마 넣기

대시보드 > **SQL Editor** 에 [`supabase/schema.sql`](supabase/schema.sql) 내용을 통째로 붙여넣고 실행하세요.
테이블·보안정책(RLS)·집계 트리거·실시간 발행·사진 버킷이 한 번에 만들어집니다. 여러 번 실행해도 안전합니다.

### 3. 운영자 권한 넣기

대시보드 > **SQL Editor** 에 [`supabase/admin.sql`](supabase/admin.sql) 을 붙여넣고 실행하세요.
운영자만 모든 글을 삭제하고 사용자를 정지할 수 있게 하는 권한 체계입니다.

실행 후, 본인을 운영자로 지정합니다. 이용자 번호는 앱의 **마이페이지 > 고객센터**에서 확인할 수 있어요.

```sql
insert into admins (user_id, note) values ('여기에-이용자-번호', '운영자');
```

> 관리자 권한은 **서버가 판정**합니다. 앱 코드를 조작해도 서버가 삭제를 거부합니다.
> `admins` 테이블에는 쓰기 정책이 아예 없어서, 앱을 통해서는 누구도 스스로 운영자가 될 수 없습니다.

### 4. 키 넣기

대시보드 > **Project Settings > API** 에서 두 값을 복사해 [`js/config.js`](js/config.js) 에 붙여넣습니다.

```js
window.BARTALK_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
  ...
};
```

> `anon` 키는 공개돼도 되는 키입니다 (RLS가 접근을 막아요).
> **`service_role` 키는 절대 넣지 마세요.** 넣으면 누구나 모든 데이터를 지울 수 있습니다.

새로고침하면 좌측 상단에 연결 상태가 잠깐 표시되고, 이후 다른 기기와 글이 공유됩니다.

---

## 로그인 설정

앱은 **로그인해야 들어갈 수 있습니다.** 로그인 정보는 본인 확인과 이용 정지 관리에만 쓰이고, 게시물은 계속 "익명"으로 표시됩니다.

아직 켜지지 않은 로그인 방법은 화면에서 자동으로 **"(준비 중)"** 으로 표시되고 눌리지 않습니다. 하나씩 켜면 그때부터 버튼이 살아납니다.

### 0. 주소 등록 ⚠️ 이걸 빼먹으면 로그인 후 앱으로 못 돌아옵니다

Supabase 대시보드 > **Authentication > URL Configuration**

| 항목 | 값 |
|---|---|
| Site URL | `https://bartender-gamma.vercel.app` |
| Redirect URLs | `https://bartender-gamma.vercel.app/**` |

로컬에서도 테스트하려면 `http://localhost:8777/**` 도 함께 추가하세요.

### 0-2. 익명 로그인 끄기 ⚠️ 보안상 중요

Supabase 대시보드 > **Authentication > Sign In / Providers** 에서 **Anonymous sign-ins 를 끄세요.**

앱은 이제 로그인을 요구하지만, 서버가 익명 가입을 허용하는 한 **API를 직접 호출하면 로그인 없이 글을 쓸 수 있습니다.** 계정을 무한히 만들 수 있어 도배·정지 우회의 통로가 됩니다.

확인 방법 — 아래가 토큰을 돌려주면 아직 열려 있는 것입니다.

```bash
curl -X POST "https://dvharpjpemxpbrhhlolx.supabase.co/auth/v1/signup" -H "apikey: <anon key>" -H "Content-Type: application/json" -d "{}"
```

### 1. 이메일 (이미 켜져 있음)

기본으로 동작합니다. 비밀번호 없이 메일로 받은 링크로 로그인합니다.

> ⚠️ Supabase 기본 메일은 **시간당 2~3통 제한**이 있어 실제 서비스에는 못 씁니다.
> 출시 전 **Authentication > Emails > SMTP Settings** 에서 외부 SMTP(Resend, SendGrid 등)를 연결하세요.

### 2. 구글

1. [Google Cloud Console](https://console.cloud.google.com) > API 및 서비스 > **사용자 인증 정보**
2. **OAuth 클라이언트 ID 만들기** > 웹 애플리케이션
3. 승인된 리디렉션 URI 에 추가:
   `https://dvharpjpemxpbrhhlolx.supabase.co/auth/v1/callback`
4. 발급된 **클라이언트 ID / 보안 비밀**을 Supabase > Authentication > Sign In / Providers > **Google** 에 붙여넣고 켜기

### 3. 카카오

1. [Kakao Developers](https://developers.kakao.com) > 내 애플리케이션 > **애플리케이션 추가**
2. **앱 설정 > 플랫폼 > Web** 에 사이트 도메인 등록: `https://bartender-gamma.vercel.app`
3. **제품 설정 > 카카오 로그인** 활성화 ON
4. Redirect URI 에 추가: `https://dvharpjpemxpbrhhlolx.supabase.co/auth/v1/callback`
5. **동의 항목**에서 `카카오계정(이메일)` 을 **필수 동의**로 설정
6. **앱 키 > REST API 키** → Supabase 의 Kakao `Client ID` 에
   **보안 > Client Secret** 생성 후 → Supabase 의 `Client Secret` 에

### 4. 네이버

Supabase 가 네이버를 지원하지 않아 [`api/naver-login.js`](api/naver-login.js) 가 대신 처리합니다. 코드는 이미 배포돼 있고, **환경 변수만 넣으면** 동작합니다.

1. [네이버 개발자 센터](https://developers.naver.com/apps) > **애플리케이션 등록**
   - 사용 API: **네이버 로그인** / 제공 정보: **이메일 주소 (필수)**
   - 서비스 URL: `https://bartender-gamma.vercel.app`
   - Callback URL: `https://bartender-gamma.vercel.app/api/naver-login`
2. Vercel 프로젝트 > **Settings > Environment Variables** 에 4개 추가:

| 이름 | 값 |
|---|---|
| `NAVER_CLIENT_ID` | 네이버가 발급한 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버가 발급한 Client Secret |
| `SUPABASE_URL` | `https://dvharpjpemxpbrhhlolx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API Keys > **service_role** |

3. Vercel > Deployments 에서 **Redeploy** (환경 변수는 재배포해야 반영됩니다)

> 🔐 `service_role` 키는 **서버 함수 안에서만** 쓰이고 브라우저로 나가지 않습니다.
> 절대 `js/config.js` 나 다른 클라이언트 파일에 넣지 마세요. 넣으면 누구나 모든 데이터를 지울 수 있습니다.

설정이 됐는지 확인:

```bash
curl https://bartender-gamma.vercel.app/api/naver-login?probe=1
```

`{"configured":true}` 가 나오면 앱의 네이버 버튼이 활성화됩니다.

### 로그인 관련 동작

| 상황 | 동작 |
|---|---|
| 새 기기에서 같은 계정 로그인 | 서버의 닉네임을 그대로 이어받아 **온보딩을 건너뜁니다** |
| 정지된 사용자가 앱 재설치 | 같은 계정이라 정지가 유지됩니다 |
| 로그아웃 | 세션 종료 후 로그인 화면으로 |
| 회원탈퇴 | 기기 데이터 삭제 + 로그아웃. 서버 게시물은 별도 요청 필요(안내 표시) |
| 서버 연결 실패 | 이미 쓰던 사람은 오프라인으로 계속 사용 가능 |

---

### 동작 방식

| 상황 | 동작 |
|---|---|
| 글 작성 | 화면에 즉시 반영 → 서버 전송은 백그라운드 큐 |
| 오프라인 중 작성 | 기기에 저장 → 연결되면 자동으로 올라감 (`backfillLocal`) |
| 다른 사람이 글 작성 | 실시간 구독으로 감지 → 보고 있는 화면만 다시 그림 |
| 서버 연결 실패 | 경고 배지 표시 + 로컬 모드로 계속 사용 가능, 15초 간격 3회 재시도 |
| 사진 첨부 | Storage `photos` 버킷에 업로드 후 URL 저장 (실패 시 사진 없이 게시) |

### 서버에 저장되는 것 / 아닌 것

| 서버 공유 | 기기 전용 |
|---|---|
| 게시글, 댓글, 공감 | 포인트·뱃지·출석 |
| 모임, 참여자, 모임 댓글 | 내 술장, 관심알바 |
| 사용자 등록 술·칵테일, 리뷰 | 근무일지, 장바구니·주문 |
| 신고, 차단 목록, 프로필 | 앱 설정(다크모드·알림), 1:1 채팅 |

앱에 내장된 술·칵테일 기준 데이터(500종 이상)는 서버로 가지 않고 앱 안에 그대로 있습니다.

### 운영 (신고 처리)

운영자로 지정되면 **앱 안에서 바로 처리**할 수 있습니다.

- 아무 게시글·도감 항목 > 🚩 > **관리자 조치** — 삭제 / 삭제 + 작성자 정지(3·7·30일·영구)
- 마이페이지 > 🛡️ 관리자 페이지 > **신고함** — 접수된 신고를 조치 또는 기각

모든 조치는 `admin_actions` 테이블에 누가·무엇을·왜 했는지 기록됩니다.

> 관리자 화면의 **현황·회원 탭은 아직 예시 데이터**입니다 (화면에도 경고가 표시됩니다).
> 거기서 누른 정지는 서버에 반영되지 않습니다.

대시보드에서 직접 볼 수도 있습니다.

```sql
select * from reports where status = '접수' order by created_at desc;
select * from admin_actions order by created_at desc limit 50;
```

---

## 로컬 실행

```bash
npx serve .
```

서비스 워커는 `http://localhost` 또는 HTTPS에서만 동작합니다. `file://`로 열면 PWA 기능이 꺼집니다.

## 아이콘 다시 만들기

```bash
node tools/gen-icons.js icons
```

`icons/` 아래 5개 파일(192/512 일반, 192/512 maskable, 180 apple-touch)을 다시 만듭니다.
외부 의존성 없이 순수 Node로 PNG를 그립니다. 디자인을 바꾸려면 `tools/gen-icons.js`의 `GLASS`·`OLIVE` 좌표를 수정하세요.

---

## Google Play 출시 절차

### 0. 사전 확인 — `js/config.js` 를 채웠나요?

`js/config.js` 가 비어 있으면 글이 기기 안에만 저장되어 **사용자끼리 커뮤니티가 공유되지 않습니다.**
"커뮤니티" 앱으로 출시하려면 위 [Supabase 연결](#supabase-연결-커뮤니티-공유하기) 을 먼저 마치세요.

비운 채로 출시하려면 스토어 설명을 "개인 레시피 노트 · 술도감" 성격으로 잡고, 커뮤니티 성격을 강조하지 마세요.

### 1. 웹 호스팅 — 완료됨

**운영 주소: https://bartender-gamma.vercel.app**

Vercel이 GitHub `main` 브랜치에 연결돼 있어, **푸시하면 자동 배포**됩니다.

[`vercel.json`](vercel.json) 의 헤더 설정 의도 (JSON은 주석을 못 달아 여기 정리합니다):

| 경로 | 설정 | 이유 |
|---|---|---|
| `/.well-known/assetlinks.json` | `Content-Type: application/json` | 이게 아니면 안드로이드가 도메인 검증에 실패해 앱에 주소창이 뜹니다 |
| `/sw.js` | 캐시 금지 | 서비스워커가 캐시되면 앱 업데이트가 사용자에게 **영원히** 안 갑니다 |
| `/index.html` | `no-cache` | 새 배포가 즉시 반영되도록 |
| `/icons/*` | 1년 캐시 | 내용이 바뀌지 않는 정적 자산 |
| 전체 | nosniff, SAMEORIGIN 등 | 기본 보안 헤더 |

> ⚠️ `vercel.json` 의 `headers` 항목에는 `source`/`headers`/`has`/`missing` 만 넣을 수 있습니다.
> 다른 키(예: 설명용 `comment`)를 넣으면 **배포가 통째로 실패**합니다.

나중에 커스텀 도메인을 붙이려면 Vercel 프로젝트 > Settings > Domains 에서 추가하세요.

### 2. Bubblewrap으로 Android 패키지 만들기

```bash
npx @bubblewrap/cli init --manifest https://bartender-gamma.vercel.app/manifest.json
```

```bash
npx @bubblewrap/cli build
```

- 생성된 **키스토어(`.jks`)와 비밀번호를 반드시 안전하게 백업**하세요. 잃어버리면 같은 앱으로 업데이트할 수 없습니다.
- Bubblewrap은 최신 버전을 쓰세요. Google Play의 target API 요구사항을 자동으로 맞춰줍니다.
- 산출물: `app-release-bundle.aab` (Play Console 업로드용)

### 3. 도메인 검증 (assetlinks)

주소창 없는 전체화면으로 뜨려면 이 단계가 필수입니다.

1. Play Console > 설정 > 앱 서명 에서 **SHA-256 인증서 지문** 복사
2. `.well-known/assetlinks.json`의 `package_name`과 `sha256_cert_fingerprints` 값을 실제 값으로 교체
3. 재배포 후 `https://bartender-gamma.vercel.app/.well-known/assetlinks.json` 이 그대로 열리는지 확인

> 이 파일이 없거나 지문이 틀리면 앱 상단에 URL 바가 보입니다.

### 4. Play Console 제출물

- [ ] 개발자 계정 등록 ($25, 1회)
- [ ] 신규 개인 개발자라면 **비공개 테스트 12명 · 14일** 요건 충족
- [ ] 앱 아이콘 512×512 (`icons/icon-512.png`)
- [ ] 피처 그래픽 1024×500
- [ ] 폰 스크린샷 최소 2장
- [ ] 짧은 설명(80자) / 자세한 설명(4000자)
- [ ] **개인정보처리방침 URL** → `https://bartender-gamma.vercel.app/privacy.html`
- [ ] **계정 삭제 URL** → `https://bartender-gamma.vercel.app/account-deletion.html`
- [ ] 데이터 안전(Data Safety) 설문 — **연결 여부에 따라 답이 달라집니다**
      - `config.js` 비움: 수집 없음 / 데이터는 기기에만 저장
      - Supabase 연결: 사용자 생성 콘텐츠(글·사진) 수집 / 전송 중 암호화 됨 / 삭제 요청 가능 / 제3자 공유 없음
- [ ] 콘텐츠 등급 설문 — **알코올 언급을 반드시 "예"로** 신고 (숨기면 삭제 사유)
- [ ] **로그인 필수 앱이므로 심사용 계정 제공** — 앱 콘텐츠 > 앱 액세스 권한 에서
      테스트용 이메일 주소와 로그인 방법(메일 링크)을 안내하세요
- [ ] 광고 포함 여부: 아니오 (광고 SDK 미사용)

### 5. 정책 대응 현황

| 항목 | 상태 |
|---|---|
| 만 19세 연령 확인 게이트 | ✅ 온보딩에 포함 |
| 이용약관 · 개인정보처리방침 (앱 내 + 공개 URL) | ✅ |
| 계정·데이터 삭제 경로 (앱 내 + 공개 URL) | ✅ |
| UGC — 게시물 신고 | ✅ |
| UGC — **사용자 차단** | ✅ 게시글 상세 🚩 > "이 작성자 차단하기", 마이페이지 > 차단 사용자 관리 |
| UGC — 운영 연락처 | ✅ 마이페이지 > 고객센터 |
| UGC — 커뮤니티 규칙 및 제재 기준 | ✅ |
| 욕설 필터 · 도배 제한 | ✅ |
| 광고 식별자 / 분석 SDK | ✅ 미사용 |
| 결제 | ⚠️ `STORE_LIVE=false` — 사전 신청만 접수 |
| 로그인 (정지 우회 방지) | ✅ 구글·카카오·네이버·이메일 |
| 익명 가입 차단 | ⚠️ 대시보드에서 Anonymous sign-ins 를 꺼야 완결 |
| 운영자 권한 (모든 글 삭제·정지) | ✅ 서버 판정. 앱에서 권한 탈취 불가 |

### 6. 업데이트 배포

1. `js/legal.js`의 `META.version` 수정
2. `sw.js`의 `VERSION` 수정 (**빠뜨리면 사용자에게 옛 화면이 계속 보입니다**)
3. `git push` → Vercel이 자동 배포 → 사용자는 다음 실행 때 자동 갱신
4. Android 껍데기(TWA) 자체를 바꾼 게 아니라면 `.aab` 재업로드는 필요 없습니다

> 약관·개인정보처리방침의 내용을 바꿨다면 `META.updated`(시행일)도 함께 올려주세요.

---

## 알려진 제한

- `js/config.js` 를 비워두면 사용자 간 글이 공유되지 않습니다
- 1:1 채팅은 아직 기기 전용입니다 (서버 연동 안 됨)
- 관리자 화면의 **현황·회원 탭은 예시 데이터**입니다. 실제 조치는 신고함 탭 또는 게시글의 관리자 조치를 쓰세요
- 이메일 로그인은 Supabase 기본 메일 서버 기준 시간당 2~3통 제한이 있어, 출시 전 외부 SMTP 연결이 필요합니다
- 댓글 작성자 단위 차단은 지원하지 않습니다 (게시글 작성자 단위만)
- 관리자 화면은 데모 데이터를 보여줍니다. 실제 신고 처리는 Supabase 대시보드에서 하세요
- 포인트·뱃지는 기기별로 계산되므로 기기를 바꾸면 초기화됩니다
- `localStorage` 용량 한계(약 5MB)로 사진을 많이 첨부하면 저장에 실패할 수 있습니다 (서버 연결 시 사진은 Storage로 옮겨져 완화됨)
