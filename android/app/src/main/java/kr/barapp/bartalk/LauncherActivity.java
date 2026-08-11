package kr.barapp.bartalk;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessaging;

/**
 * 앱을 켤 때 웹으로 넘어가는 주소를 만드는 곳입니다.
 *
 * FCM 토큰(이 기기의 알림 주소)을 주소에 실어 보냅니다.
 * 누구의 기기인지는 로그인한 웹만 알기 때문에, 서버에 등록하는 일은
 * 웹이 합니다. 앱은 "이 기기 주소는 이거야"라고 건네주기만 해요.
 *
 *   https://barapp.kr/?fcm=<토큰>
 *
 * 처음 설치한 직후 한 번은 토큰이 아직 없을 수 있습니다. 그때는 그냥
 * 주소만 열리고, 다음 실행 때 실려 갑니다.
 */
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String TAG = "BarTalkFCM";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 다음 실행 때 쓰도록 토큰을 미리 받아둡니다.
        try {
            FirebaseMessaging.getInstance().getToken()
                    .addOnCompleteListener(task -> {
                        if (!task.isSuccessful() || task.getResult() == null) return;
                        getSharedPreferences(BarTalkMessagingService.PREFS, Context.MODE_PRIVATE)
                                .edit()
                                .putString(BarTalkMessagingService.KEY_TOKEN, task.getResult())
                                .apply();
                    });
        } catch (Exception e) {
            // google-services.json 이 없으면 여기로 옵니다. 앱은 그대로 돕니다.
            Log.d(TAG, "FCM 이 준비되지 않았습니다: " + e.getMessage());
        }
    }

    @Override
    protected Uri getLaunchingUrl() {
        Uri base = super.getLaunchingUrl();
        String token = getSharedPreferences(BarTalkMessagingService.PREFS, Context.MODE_PRIVATE)
                .getString(BarTalkMessagingService.KEY_TOKEN, null);
        if (token == null || token.isEmpty()) return base;

        // 이미 붙어 있으면 두 번 붙이지 않습니다.
        if (base.getQueryParameter("fcm") != null) return base;
        return base.buildUpon().appendQueryParameter("fcm", token).build();
    }
}
