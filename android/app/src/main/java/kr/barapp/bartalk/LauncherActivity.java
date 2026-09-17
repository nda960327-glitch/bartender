package kr.barapp.bartalk;

import android.content.res.Configuration;
import android.net.Uri;

/**
 * 앱을 열 때 휴대폰이 야간 모드인지 웹(barapp.kr)에 알려줍니다.
 *
 * 삼성 인터넷은 휴대폰 다크 모드를 웹에 숨기고 색을 강제로 뒤집어서, 바텐톡 색이 이상하게 보였어요.
 * 그래서 시작 주소에 ?sys=dark 또는 ?sys=light 를 붙이고, 웹은 이 값을 보고
 * 처음부터 바텐톡이 만든 어두운 화면으로 그립니다. (index.html 맨 위 스크립트)
 *
 * 나머지 동작은 라이브러리의 LauncherActivity 그대로예요.
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        if (uri == null) return null;
        int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        String sys = night == Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
        return uri.buildUpon().appendQueryParameter("sys", sys).build();
    }
}
