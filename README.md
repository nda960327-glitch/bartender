# 바텐톡 (BarTalk)

바텐더 익명 커뮤니티 PWA. 술도감 · 칵테일 레시피 · 모임 · 채용정보 · 바텐더 도구.

**운영 주소: https://barapp.kr**

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
tools/fetch-bars.mjs     실제 바 목록 받아오기 (카카오·네이버) → js/seed-bars.js

supabase/official.sql    ★ 공식 계정 + 콘텐츠 예약 발행 (아래 "공식 계정" 항목)
supabase/auto-comment.sql  AI 자동 댓글 (official.sql 다음에 실행)
supabase/ranking.sql       랭킹 (안 넣어도 앱은 돌아갑니다 — 내 기록만 보여요)
supabase/referral.sql      ★ 추천인(영업) 코드 + 활성 사용자 집계 (아래 "추천인 코드" 항목)
api/publish.js           예약 발행 크론 엔드포인트
tools/queue.mjs          콘텐츠 큐 관리 CLI
tools/lib/               ↳ 도감 로더 · 초안 템플릿 · 예약 시각 · Supabase 클라이언트
.github/workflows/publish-queue.yml   무료 크론 (Vercel Hobby 대안)
.env.example             ★ .env.local 로 복사해서 채우기 (service_role 키)
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
| Site URL | `https://barapp.kr` |
| Redirect URLs | `https://barapp.kr/**` |

로컬에서도 테스트하려면 `http://localhost:8777/**` 도 함께 추가하세요.

### 0-2. 익명 로그인 끄기 ⚠️ 보안상 중요

Supabase 대시보드 > **Authentication > Sign In / Providers** 에서 **Anonymous sign-ins 를 끄세요.**

앱은 이제 로그인을 요구하지만, 서버가 익명 가입을 허용하는 한 **API를 직접 호출하면 로그인 없이 글을 쓸 수 있습니다.** 계정을 무한히 만들 수 있어 도배·정지 우회의 통로가 됩니다.

확인 방법 — 아래가 토큰을 돌려주면 아직 열려 있는 것입니다.

```bash
curl -X POST "https://dvharpjpemxpbrhhlolx.supabase.co/auth/v1/signup" -H "apikey: <anon key>" -H "Content-Type: application/json" -d "{}"
```

> 📌 **지금 로그인 화면에는 구글·이메일만 보입니다.**
> 카카오·네이버 버튼은 `index.html` 의 로그인 화면에서 주석으로 막아두었어요.
> 동작 코드는 그대로 있으니, 다시 열려면 그 주석만 풀면 됩니다.

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
2. **앱 설정 > 플랫폼 > Web** 에 사이트 도메인 등록: `https://barapp.kr`
3. **제품 설정 > 카카오 로그인** 활성화 ON
4. Redirect URI 에 추가: `https://dvharpjpemxpbrhhlolx.supabase.co/auth/v1/callback`
5. **동의 항목**에서 `카카오계정(이메일)` 을 **필수 동의**로 설정
6. **앱 키 > REST API 키** → Supabase 의 Kakao `Client ID` 에
   **보안 > Client Secret** 생성 후 → Supabase 의 `Client Secret` 에

### 4. 네이버

Supabase 가 네이버를 지원하지 않아 [`api/naver-login.js`](api/naver-login.js) 가 대신 처리합니다. 코드는 이미 배포돼 있고, **환경 변수만 넣으면** 동작합니다.

1. [네이버 개발자 센터](https://developers.naver.com/apps) > **애플리케이션 등록**
   - 사용 API: **네이버 로그인** / 제공 정보: **이메일 주소 (필수)**
   - 서비스 URL: `https://barapp.kr`
   - Callback URL: `https://barapp.kr/api/naver-login`
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
curl https://barapp.kr/api/naver-login?probe=1
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

**현황** 탭은 서버 실시간 수치(회원·게시글·신고·정지 등)를, **회원** 탭은 실제 가입자 목록을 보여줍니다.
회원을 눌러 정지/해제하면 서버에 즉시 반영됩니다.

대시보드에서 직접 볼 수도 있습니다.

```sql
select * from reports where status = '접수' order by created_at desc;
select * from admin_actions order by created_at desc limit 50;
```

---

## 추천인 코드 (영업 관리)

가입 화면에 **추천인 코드** 칸이 있습니다. 영업하시는 분마다 짧은 코드를 하나씩 나눠주면,
누가 몇 명을 데려왔는지 · 그 사람들이 **진짜 앱을 쓰는지**까지 앱 안에서 볼 수 있습니다.

### 1. SQL 넣기

`supabase/referral.sql` 을 SQL Editor 에 붙여넣고 실행하세요. (`admin.sql` 다음)
처음 쓸 코드 4개가 함께 들어갑니다 — **G2G · J7J · N4N · T3T**.
헷갈리는 글자(O·0·I·1·S·5)는 뺐고, 소문자로 적어도 대문자로 바뀝니다.

### 2. 코드에 이름 붙이기

```sql
-- 코드에 실제 이름 붙이기
update public.referral_codes set owner = '김바텐', memo = '010-0000-0000' where code = 'G2G';

-- 코드 새로 만들기
insert into public.referral_codes (code, owner) values ('P8P', '박바텐');

-- 코드 그만 쓰기 (지금까지 실적은 그대로 남아요)
update public.referral_codes set active = false where code = 'P8P';
```


### 3. 성적 보기

마이페이지 > 🛡️ 관리자 페이지 > **대시보드 > 영업 · 추천인**

| 칸 | 뜻 |
|---|---|
| 데려온 회원 | 그 코드를 적고 가입한 사람 전부 |
| 7일 활성 | 최근 7일 안에 앱을 켠 사람 — **이 숫자가 진짜 사용자입니다** |
| 30일 활성 | 최근 30일 안에 앱을 켠 사람 |
| 글 쓴 사람 | 글·댓글·리뷰를 하나라도 남긴 사람 |

"50명 데려왔다"는 **데려온 회원**, 그게 진짜인지는 **7일 활성**이 답합니다.
둘의 차이가 크면 가입만 시키고 안 쓰는 경우예요. 현황 CSV 를 내보내면 코드별 표가 함께 나옵니다.

### 알아두실 점

- 코드는 **한 번 저장되면 바꿀 수 없습니다.** (나중에 남의 실적을 가로채는 일을 막기 위해서)
- 없는 코드를 적으면 가입은 되고 코드만 빈칸으로 저장됩니다. 화면에 "없는 코드예요"라고 알려줘요.
- 이미 가입한 분도 **계정설정 > 추천인 코드**에서 뒤늦게 넣을 수 있습니다.
- 활성(마지막 접속)은 이 SQL 을 넣은 날부터 쌓입니다. 그전 회원은 앱을 한 번 켜야 잡혀요.
- 코드 명단 전체는 운영자만 볼 수 있고, 앱에서는 코드를 만들 수 없습니다.

---

## 공식 계정 · 콘텐츠 예약 발행

새 커뮤니티의 진짜 문제는 "사람이 없다"가 아니라 **"피드가 비어 있다"** 입니다.
이 기능은 운영 계정으로 좋은 글을 꾸준히 올려서 그 빈칸을 채웁니다.

지켜야 할 선은 코드에 박아뒀습니다.

- 발행되는 글에는 **항상 `공식` 뱃지가 붙습니다.** 운영 글을 일반 사용자 글로 위장할 수 없어요.
- 뱃지는 서버 트리거가 프로필을 보고 직접 찍습니다. 앱을 조작해도 위조되지 않습니다.
- 발행 파이프라인은 **공식 계정으로만** 글을 쓸 수 있습니다. 일반 계정이 큐에 들어가면 거부돼요.
- **사람이 승인한 글만** 나갑니다 (`draft` → 검토 → `approved`).
- 실제 사용자 글에 자동으로 공감을 누르는 기능은 **일부러 넣지 않았습니다.**

글감은 앱에 이미 들어있는 도감 569종에서 뽑습니다. 지어내는 내용이 없어서
사실 확인이 필요 없고, 도감을 고치면 글도 같이 좋아집니다. (현재 **2,027건** 생성 가능)

### 1. SQL 넣기

Supabase 대시보드 > SQL Editor 에 `supabase/official.sql` 을 붙여넣고 실행하세요.
(`schema.sql`, `admin.sql` 을 먼저 실행해 둬야 합니다)

### 2. 공식 계정 지정

어떤 계정을 쓸지 고릅니다.

```bash
node tools/queue.mjs accounts
```

쓸 계정을 정했으면 SQL Editor 에서 켜세요. **앱에서는 못 켭니다** (일부러 막아둠).

```sql
update profiles set is_official = true, nick = '바텐톡 위스키',  official_label = '공식'
 where id = '계정-uuid';
update profiles set is_official = true, nick = '바텐톡 칵테일', official_label = '공식'
 where id = '다른-계정-uuid';
```

> 닉네임에 `위스키` / `칵테일` 이 들어가면 초안이 자동으로 담당 계정에 배정됩니다.
> 13개를 전부 쓸 필요는 없어요. **2~3개면 충분합니다.** 계정이 많을수록 관리만 어려워집니다.

### 3. 로컬 설정

```bash
cp .env.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY` 는 대시보드 > Project Settings > API Keys > service_role 값입니다.
**RLS 를 전부 무시하는 마스터 키라서 앱 코드에는 절대 넣으면 안 됩니다.** (`.env.local` 은 커밋되지 않아요)

`CRON_SECRET` 은 아무 랜덤 문자열이면 됩니다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 초안 만들고 검토하기

```bash
node tools/queue.mjs seed --limit 100      # 도감에서 초안 100건 생성
node tools/queue.mjs list                  # 목록
node tools/queue.mjs show 12 13 14         # 본문 읽어보기  ← 여기서 사람이 검토
node tools/queue.mjs reject 13             # 별로면 버리기
node tools/queue.mjs approve --all --per-day 3   # 승인 + 예약
node tools/queue.mjs plan                  # 언제 뭐가 나가는지 확인
```

예약 시각은 하루 몇 건, 최소 몇 분 간격, 몇 시부터 몇 시까지 쉴지를 지켜서
**분 단위까지 흩어서** 잡습니다. 오후(출근 전)와 늦은 밤(마감 후)에 가중치를 둡니다.

`--dry` 를 붙이면 저장하지 않고 미리보기만 합니다.

### 5. 크론 연결

Vercel 환경변수에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` 을 넣으세요.

**Vercel Hobby 요금제는 크론이 하루 1회로 제한됩니다.** 그래서 `vercel.json` 은
건드리지 않았어요. 무료로 15분마다 돌리려면 GitHub 저장소에 시크릿만 넣으면 됩니다.

- Settings > Secrets and variables > Actions > Secrets 에 `CRON_SECRET`
- `.github/workflows/publish-queue.yml` 이 알아서 15분마다 노크합니다

Pro 요금제라면 `vercel.json` 에 이걸 추가해도 됩니다.

```json
"crons": [{ "path": "/api/publish", "schedule": "*/15 * * * *" }]
```

> 자주 부른다고 글이 자주 올라가지 않습니다. 발행 여부는 DB 가 정합니다.

### 6. 켜기

여기까지 해도 **아직 아무것도 발행되지 않습니다.** 마지막에 직접 켜야 해요.

```bash
node tools/queue.mjs settings --on
```

### 앱에서 관리하기 (관리자 → 봇 탭)

PC 없이 폰에서 할 수 있는 것들입니다. **마이페이지 → 🛡️ 관리자 → 봇**

| 화면 | 할 수 있는 것 |
|---|---|
| 봇 목록 | 자동 발행 켜기/끄기 · 하루 몇 건 · 최소 간격 · 쉬는 시간 · 큐 현황 · 다음에 나갈 글 |
| 봇 상세 | **이 봇으로 직접 글쓰기** (지금 올리기 / 다음 빈 자리에 예약) |
| " | 예약된 글 → 지금 발행 · 초안으로 되돌리기 · 버림 |
| " | 초안 → 본문 읽고 예약하거나 버림 |
| " | 발행된 글 → 원본 보기 · 실패한 글 → 오류 확인 |

초안을 **대량으로 만들고 한 번에 승인**하는 건 여전히 PC(`tools/queue.mjs`) 쪽이 편합니다.
앱은 모니터링 · 비상 정지 · 개별 처리 · 직접 글쓰기용이에요.

앱에서 조작해도 안전한 이유:

- 서버가 `is_admin()` 을 매번 다시 확인합니다. 앱 코드를 고쳐도 권한이 생기지 않아요.
- 상태를 `발행됨` 으로 직접 바꿔치기 하거나 작성 계정을 갈아끼우는 건 DB 트리거가 되돌립니다.
- 큐에 **새 항목을 넣는 건** 앱에서 불가능합니다 (도구·서버 전용).
  단, `이 봇으로 글쓰기` 는 서버 함수를 거치므로 가능하고, `admin_actions` 에 기록이 남습니다.

### 일상 운영

```bash
node tools/queue.mjs stats                 # 큐 현황
node tools/queue.mjs plan --days 7         # 이번 주 일정
node tools/queue.mjs run                   # 지금 한 건 발행 (테스트)
node tools/queue.mjs settings --off        # 🚨 비상 정지
node tools/queue.mjs settings --daily-cap 2 --min-gap 180 --quiet 1-10
```

`--yes` 를 붙이면 확인 없이 진행합니다 (스크립트용).

발행 속도 기본값은 **하루 4건 · 최소 90분 간격 · 새벽 2~9시 정지** 입니다.
초반에는 하루 2~3건으로 낮게 잡는 쪽을 권합니다.

### AI 자동 댓글

새 글에 공식 계정이 알아서 짧은 댓글을 답니다. 문구는 Claude 가 글을 읽고 씁니다.

**1. SQL** — `supabase/auto-comment.sql` 을 SQL Editor 에 붙여넣고 실행 (`official.sql` 먼저).

**2. 환경변수** — Vercel 에 아래 <b>둘 중 하나</b>를 추가하세요. 나머지
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)는 예약 발행과 같은 값을 씁니다.

| 변수 | 발급처 | 기본 모델 |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | `gpt-4o` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | `claude-opus-5` |

둘 다 있으면 OpenAI 를 씁니다. 모델을 바꾸려면 `AI_MODEL` 을 넣으세요.
넣기 전까지는 크론이 돌아도 `{"reason":"no_api_key"}` 만 돌려주고 아무 일도
하지 않아요 (에러가 아니라 정상 응답입니다).

**비용** — 댓글 한 개당 대략:

| 모델 | 1개 | 하루 3개 기준 한 달 |
|---|---|---|
| `gpt-4o` (기본값) | 6원 | 약 550원 |
| `gpt-4o-mini` | 0.4원 | 약 40원 |
| `claude-opus-5` | 20~40원 | 약 2,000원 |

더 싸게 쓰려면 `AI_MODEL` 을 `gpt-4o-mini` 로 두세요. 액수 자체가 작아서
문장 품질을 먼저 보고 정하시는 편이 낫습니다.

**3. 크론** — 예약 발행과 똑같이 GitHub Actions 를 씁니다 (Vercel Hobby 는 크론이
하루 1회라서요). `.github/workflows/auto-comment.yml` 이 10분마다 노크합니다.
`CRON_SECRET` 시크릿만 넣어두면 되고, 예약 발행용으로 이미 넣었다면 그대로 쓰입니다.
주소가 `barapp.kr` 이 아니면 저장소 Variables 에 `AUTO_COMMENT_URL` 을 넣으세요.

**4. 켜기** — 관리자 → 봇 탭 → "AI 자동 댓글" 켜기.

빈도는 세 구간 상한을 **동시에** 지킵니다. 기본값은 10분 1개 · 60분 1개 · 24시간 1개라
셋이 겹쳐서 **실질 하루 1개**입니다. 더 활발하게 하려면 60분·24시간 값을 올리세요
(예: 1 / 3 / 12). 여기에 10분마다 굴리는 확률(기본 60%)이 더해져서 시각이 규칙적으로
반복되지 않습니다. 쉬는 시간은 예약 발행 설정을 같이 씁니다.

수동 테스트:

```bash
curl -H "x-cron-key: $CRON_SECRET" https://barapp.kr/api/auto-comment
```

`{"posted":false,"reason":"no_target"}` 이 정상 응답입니다 — 꺼져 있거나, 쉬는 시간이거나,
상한을 채웠거나, 주사위가 안 나왔거나, 달 만한 글이 없는 경우예요.

**미리보기** — `?dry=1` 을 붙이면 문구만 만들어 보여주고 실제로 달지는 않습니다.
스위치가 꺼져 있어도 되고, 상한·확률도 건너뜁니다. 말투가 마음에 드는지 볼 때 쓰세요.

```bash
curl -H "x-cron-key: $CRON_SECRET" "https://barapp.kr/api/auto-comment?dry=1"
```

```json
{ "posted": false, "dry": true,
  "would_comment": "마티니에 환불이라니 ㅋㅋ 그날은 그냥 넘기는 게 답이었을 듯",
  "post_title": "3년차인데 오늘 처음으로 셰이커 던질 뻔했다", "nick": "바텡이" }
```

⚠️ 자동 댓글도 **공식 계정**으로 나가므로 댓글 옆에 공식 뱃지가 붙습니다.
말투는 현직 바텐더처럼 쓰이지만, 사람이 쓴 것처럼 위장하지는 않아요. 초기에 활기를
만드는 용도로는 이 편이 안전합니다 — 나중에 들통났을 때 잃는 신뢰가 더 큽니다.
뱃지 없이 내보내고 싶다면 그건 별도 결정이니 따로 말씀해주세요.

### 이걸로 해결되지 않는 것

피드가 차는 것과 커뮤니티가 사는 것은 다릅니다. 진짜 사람은 결국 따로 데려와야 해요.

- 인스타 바텐더 해시태그 · 네이버 카페에서 직접 컨택
- 바 돌면서 QR 명함
- **"왜 써야 하는지" 한 줄**이 필요합니다. 구인구직? 레시피 아카이브? 재고 공유?

초기 사용자가 글을 쓰면 **30분 안에 운영 계정으로 제대로 된 답글**을 다세요.
자동 공감 100개보다 이게 훨씬 셉니다.

---

## 나중에 붙인 화면들

홈 상단 바로가기(8칸)와 마이페이지에서 들어갑니다. 넷 다 **서버 없이 동작**하고,
랭킹만 SQL 을 넣으면 전체 순위가 추가로 보여요.

### 📍 바 찾기

업장 목록과 상세. 지역 칩 + 검색으로 좁히고, 단골로 저장하거나 그 바 이야기를
커뮤니티에 바로 쓸 수 있습니다. 누구나 등록할 수 있어요.

**내 주변 찾기** — `📍 내 주변` 을 누르면 가까운 순으로 정렬되고 5/20/50km 로
좁힐 수 있습니다. 거리는 "약 5km" 처럼 뭉뚱그려 보여줘요.

#### 실제 바 목록 받아오기

앱에 내장된 기본 목록은 여덟 곳뿐입니다. 1000곳 이상을 넣으려면 실제 데이터를
받아오세요. **지어내면 안 됩니다** — 실제 영업 중인 가게에 엉뚱한 주소가 붙으면
손님이 남의 집으로 갑니다.

```bash
node tools/fetch-bars.mjs            # 전국
node tools/fetch-bars.mjs --seoul    # 서울만 (빠르게 확인)
```

상호·도로명주소·좌표를 **카카오 로컬 API** 로 받아 `js/seed-bars.js` 를 만듭니다.
그 파일이 있으면 앱이 자동으로 그걸 씁니다.

**준비물** — `.env.local` 에 넣으세요.

| 키 | 발급처 | 없으면 |
|---|---|---|
| `KAKAO_REST_KEY` | [developers.kakao.com](https://developers.kakao.com) > 앱 > REST API 키 | 실행 불가 |
| `NAVER_CLIENT_ID` / `_SECRET` | [developers.naver.com](https://developers.naver.com) > 앱 등록 > **검색** API | 카카오 것만 씀 |

네이버는 한 질의에 5건까지만 줘서 보조로 씁니다. 같은 가게가 양쪽에 다 나오면
그만큼 확인이 된 것이고, 카카오가 놓친 곳은 새로 채워요.
카카오 무료 쿼터는 하루 10만 건이고 전국 한 바퀴에 2천 건 남짓 씁니다.

> 로그인용 네이버 앱과는 별개입니다. 그 앱에 "검색" API 가 안 켜져 있으면
> 401 이 나고, 그때는 카카오 것만 쓰고 넘어갑니다.

**정보를 다루는 원칙**

- 기본 목록에는 **영업시간·시그니처·설명을 넣지 않았습니다.** 확인할 방법이
  없는 정보라서요. 상호·동네·종류까지만 적습니다.
- 좌표는 소수점 둘째 자리까지 (약 1km 격자). 거리도 "약 5km" 로만 보여줍니다.
- 내 위치는 저장하지 않습니다. 앱을 끄면 사라져요.
- 지도 버튼은 좌표로 핀을 찍지 않고 **가게 이름으로 검색만** 겁니다.
- 상세 화면에 "바는 자주 닫고 옮기니 방문 전에 확인하라"고 안내합니다.

### 🏆 랭킹

등급(7단계)과 다음 등급까지 남은 점수는 서버 없이도 바로 보입니다.

**전체 순위를 켜려면** `supabase/ranking.sql` 을 실행하세요. `profiles` 에 `points`
컬럼과 함수 두 개(`bump_my_points`, `top_bartenders`)가 생깁니다. 실행하지 않으면
랭킹 화면이 "아직 서버에 순위 기능이 없다"고 안내하고 내 기록만 보여줘요.

점수는 앱이 올려 보내는 값이라 마음먹으면 조작할 수 있습니다. 그래서
`bump_my_points` 가 한 번에 5,000점 · 하루 20,000점 넘게 오르는 걸 잘라냅니다.
상금 걸린 순위가 아니라 "얼마나 열심히 했나" 정도로만 쓰세요.
순위에 나오기 싫은 사람은 `profiles.rank_opt_out` 을 켜면 빠집니다.

### 📓 내 레시피 노트

도감의 칵테일 스펙은 표준이고, 실제 바에서는 저마다 조금씩 다르게 만듭니다.
칵테일 상세 맨 아래 **내 배합** 칸에 바꾼 용량이나 재료를 적어두면 이 노트에
모입니다. (도감 데이터 자체는 건드리지 않아요 — 내 기기에만 남습니다)

---

## 로컬 실행

```bash
npx serve .
```

인터넷 없이 열어보고 싶으면 `node tools/serve.js` (→ `http://localhost:4173`) 도 됩니다.

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

**운영 주소: https://barapp.kr**

Vercel이 GitHub `main` 브랜치에 연결돼 있어, **푸시하면 자동 배포**됩니다.

> Vercel 기본 주소(`bartender-gamma.vercel.app`)도 계속 살아 있지만, **정식 주소는 barapp.kr** 입니다.
> Vercel > Settings > Domains 에서 barapp.kr 을 Primary 로 지정하면 기본 주소는 자동으로 리다이렉트됩니다.

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
npx @bubblewrap/cli init --manifest https://barapp.kr/manifest.json
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
3. 재배포 후 `https://barapp.kr/.well-known/assetlinks.json` 이 그대로 열리는지 확인

> 이 파일이 없거나 지문이 틀리면 앱 상단에 URL 바가 보입니다.

### 4. Play Console 제출물

- [ ] 개발자 계정 등록 ($25, 1회)
- [ ] 신규 개인 개발자라면 **비공개 테스트 12명 · 14일** 요건 충족
- [ ] 앱 아이콘 512×512 (`icons/icon-512.png`)
- [ ] 피처 그래픽 1024×500
- [ ] 폰 스크린샷 최소 2장
- [ ] 짧은 설명(80자) / 자세한 설명(4000자)
- [ ] **개인정보처리방침 URL** → `https://barapp.kr/privacy.html`
- [ ] **계정 삭제 URL** → `https://barapp.kr/account-deletion.html`
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
