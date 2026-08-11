# 바텐톡 안드로이드 (TWA)

웹앱을 주소창 없이 감싸는 껍데기입니다. **화면은 전부 https://barapp.kr 이 그립니다.**
그래서 웹을 고쳐 배포하면 앱도 같이 바뀌고, 스토어에 다시 올릴 필요가 없습니다.
자체 코드는 사실상 없어요 — `AndroidManifest.xml` 과 리소스가 전부입니다.

## 열기

Android Studio > **Open** > 이 `android` 폴더 선택.

Gradle 과 SDK 는 Studio 가 알아서 받습니다. 처음 열면 몇 분 걸려요.
`gradle-wrapper.jar` 는 저장소에 넣지 않았습니다 — Studio 가 처음 동기화할 때
만들어 줍니다. (혹시 "wrapper 가 없다"고 하면 Studio 의 안내대로 한 번 눌러주세요.)

## 실행

기기를 USB 로 연결하거나 에뮬레이터를 띄우고 ▶ Run.

주소창이 위에 보이면 정상입니다 — 아래 "주소창 없애기"를 아직 안 했기 때문이에요.
동작에는 문제가 없습니다.

## APK 만들기

**Build > Build Bundle(s) / APK(s) > Build APK(s)**

나오는 곳: `android/app/build/outputs/apk/debug/app-debug.apk`
이건 디버그용이라 폰에 직접 설치해 보는 용도입니다. 스토어에는 못 올려요.

## 스토어에 올릴 때

1. **Build > Generate Signed App Bundle / APK** > *Android App Bundle*
2. 키스토어를 새로 만듭니다 (Create new…)
3. **키스토어 파일과 비밀번호를 반드시 백업하세요.** 잃어버리면 같은 앱으로
   업데이트할 수 없습니다. `.gitignore` 가 `*.jks` 를 막아두었으니 저장소에는
   안 올라갑니다 — 따로 보관하세요.
4. 나온 `.aab` 를 Play Console 에 업로드

## 주소창 없애기 (Digital Asset Links)

앱과 웹이 서로를 인정해야 주소창이 사라집니다. 지금은 웹 쪽 인정서에
지문이 비어 있어요.

1. Play Console > 앱 > 설정 > **앱 서명** 에서 **SHA-256 인증서 지문** 복사
2. 저장소의 `.well-known/assetlinks.json` 에서
   `REPLACE_WITH_SHA256_FINGERPRINT_FROM_PLAY_CONSOLE` 를 그 값으로 교체
3. 커밋 → 푸시 (Vercel 이 자동 배포)
4. 앱을 지웠다 다시 설치

로컬 디버그 빌드로 먼저 확인하려면 디버그 키 지문을 쓰세요:

```
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

지문을 `assetlinks.json` 배열에 하나 더 넣으면 됩니다 (여러 개 넣을 수 있어요).

## 값 바꾸기

| 바꿀 것 | 파일 |
|---|---|
| 앱 이름 | `app/src/main/res/values/strings.xml` 의 `app_name` |
| 여는 주소 | 같은 파일의 `launch_url` — `asset_statements` 의 site 도 같이 |
| 패키지명 | `app/build.gradle` 의 `applicationId` + `namespace`, 그리고 `assetlinks.json` 의 `package_name` |
| 버전 | `app/build.gradle` 의 `versionCode` / `versionName` |
| 상태바 색 | `app/src/main/res/values/colors.xml` |
| 아이콘 | `app/src/main/res/mipmap-*/`, `drawable/ic_launcher_foreground.png` |

> 패키지명은 한 번 스토어에 올리면 **영원히 못 바꿉니다.** 지금은
> `kr.barapp.bartalk` 입니다.

## 이 기기에서 확인한 것

빌드가 실제로 통과하는지 돌려봤습니다.

```
BUILD SUCCESSFUL in 29s
app-debug.apk · 576KB
package: kr.barapp.bartalk  versionName 1.2.0
minSdk 21 · targetSdk 36 · label 바텐톡
```

맞춘 값들 (이 PC에 이미 있는 것에 맞췄습니다 — 추가 다운로드가 없도록):

| | 값 | 이유 |
|---|---|---|
| compileSdk / targetSdk | 36 | SDK 에 android-36 이 설치돼 있음 (35는 없음) |
| Gradle | 8.14.3 | 캐시에 이미 받아져 있음 |
| AGP | 8.13.0 | 위 Gradle 과 짝 |
| JDK | 21 | `~/.jdks/jbr-21.0.11` |

> ⚠️ **Gradle JDK 를 21 로 맞춰주세요.** Android Studio 에 딸린 JDK 는 25 라서
> Gradle 8.14.3 이 `Unsupported class file major version 69` 로 거부합니다.
> Settings > Build Tools > Gradle > **Gradle JDK** 에서 `jbr-21.0.11` 선택.

## 헤맨 것 두 가지 (같은 걸 겪으실 수 있어서)

- `rootProject.name` 을 한글(`바텐톡`)로 두면 AGP 가 경로를 만들다 깨집니다.
  `bartalk` 로 바꿨어요. 화면에 보이는 앱 이름은 `strings.xml` 의 `app_name`
  이라 한글 그대로입니다.
- `local.properties` 의 경로에 백슬래시를 쓰면 Java properties 규칙에 걸려
  `Invalid file path` 가 납니다. 슬래시(`/`)로 쓰세요. 이 파일은 PC마다
  다르므로 저장소에 올리지 않습니다.

## 알림은 이미 FCM 을 탑니다 (Firebase 를 붙일 필요 없음)

TWA 에서 웹 푸시가 어떻게 도착하는지 헷갈리기 쉬워서 적어둡니다.

```
서버(api/push-send.js)  --VAPID 웹푸시-->  구글 FCM  -->  기기의 크롬
                                                            ↓ 위임
                                              DelegationService (이 앱)
                                                            ↓
                                                    바텐톡 이름으로 알림 표시
```

크롬은 원래 FCM 으로 푸시를 받습니다. TWA 는 그걸 앱에 위임할 뿐이에요.
그래서 **Firebase 프로젝트도, google-services.json 도, 네이티브 FCM 코드도
필요 없습니다.** 지금 있는 VAPID 웹푸시가 그대로 앱 알림이 됩니다.

굳이 네이티브 FCM 을 따로 붙이면 구독 저장소와 발송 경로가 두 벌이 되고,
둘을 계속 맞춰야 합니다. 얻는 것이 없습니다.

### 그런데 알림이 앱 이름으로 안 뜬다면

원인은 거의 항상 **Digital Asset Links 미검증**입니다. 지문이 안 맞으면
안드로이드가 "이 앱이 barapp.kr 을 대신한다"를 인정하지 않아서 위임이
일어나지 않아요. 위 "주소창 없애기" 절차를 마치면 같이 해결됩니다.
주소창이 사라졌는지가 곧 검증됐는지의 신호입니다.

### 확인 순서

1. 앱에서 주소창이 안 보인다 → 검증 완료
2. 앱 안에서 알림 켜기 → 안드로이드 알림 권한 허용
3. 관리자에서 테스트 발송 → 앱 이름으로 뜨는지 확인

## FCM 붙이기 (네이티브 알림)

앱이 크롬을 거치지 않고 직접 알림을 받습니다. **Digital Asset Links 검증과
무관하게 동작**해서, 서명키를 아직 안 만들었어도 알림이 옵니다.

`google-services.json` 이 없으면 FCM 만 잠들고 앱은 그대로 빌드·동작합니다.

### 1. 파이어베이스 프로젝트

[console.firebase.google.com](https://console.firebase.google.com) → 프로젝트 만들기
→ 안드로이드 앱 추가 → 패키지 이름 **`kr.barapp.bartalk`**

`google-services.json` 을 받아 **`android/app/google-services.json`** 에 넣으세요.
(`.gitignore` 로 막아두었습니다 — 저장소에 올리지 마세요)

### 2. 서버 키

파이어베이스 콘솔 → 프로젝트 설정 → **서비스 계정** → 새 비공개 키 생성
→ 받은 JSON **전체를 한 줄로** 만들어 Vercel 환경변수에 넣습니다.

| 변수 | 값 |
|---|---|
| `FCM_SERVICE_ACCOUNT` | 서비스 계정 JSON 전체 |

넣고 **Redeploy**. 이 값이 없으면 FCM 발송만 건너뛰고 웹푸시는 그대로 나갑니다.

### 3. 표 만들기

Supabase SQL Editor 에 **`supabase/fcm.sql`** 실행.

### 4. 확인

앱을 켜면 주소가 이렇게 열립니다.

```
https://barapp.kr/?fcm=<이 기기의 알림 주소>
```

웹이 그 값을 읽어 `fcm_tokens` 에 등록하고 주소창에서 지웁니다.
**처음 설치 직후 한 번은 토큰이 아직 없어 그냥 열립니다** — 두 번째 실행부터
실려 가요. 등록됐는지는 Supabase 에서 확인할 수 있습니다.

```sql
select token, platform, updated_at from fcm_tokens;
```

### 웹푸시와 같이 씁니다

한 사람이 웹과 앱을 둘 다 쓰면 양쪽으로 갑니다.

```
api/push-send.js
   ├─ fcm_tokens        → 앱 (FCM)
   └─ push_subscriptions → 웹 (VAPID 웹푸시)
```

알림을 눌렀을 때 여는 주소 규칙은 `sw.js` 의 notificationclick 과 맞춰뒀습니다
(`?post=` / `?meet=` / `?chat=` / `?admin=1`). 한쪽만 고치면 웹과 앱이 서로
다른 화면을 엽니다.
