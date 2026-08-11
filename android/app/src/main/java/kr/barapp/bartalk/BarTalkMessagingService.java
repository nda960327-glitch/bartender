package kr.barapp.bartalk;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * 앱을 꺼둬도 오는 알림을 받는 곳입니다.
 *
 * 푸시 본문에는 내용을 싣지 않습니다. 알림은 구글 서버를 지나가므로
 * "새 소식이 있다"까지만 보내고, 무엇인지는 앱을 열어 확인하게 해요.
 * (웹 쪽 sw.js 도 같은 원칙으로 만들어져 있습니다)
 */
public class BarTalkMessagingService extends FirebaseMessagingService {

    private static final String TAG = "BarTalkFCM";
    private static final String CHANNEL_ID = "bartalk_default";
    static final String PREFS = "bartalk";
    static final String KEY_TOKEN = "fcm_token";

    /**
     * 기기마다 발급되는 주소입니다. 앱을 다시 깔거나 데이터를 지우면 바뀌어요.
     * 여기서는 저장만 하고, 서버에 알리는 건 웹 쪽이 합니다
     * (누구의 기기인지는 로그인한 웹만 알기 때문입니다).
     */
    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "새 토큰을 받았습니다");
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_TOKEN, token)
                .apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        String title = "바텐톡";
        String body = "새 소식이 있어요";
        String link = null;

        // data 로 온 값이 우선입니다. notification 필드는 앱이 떠 있을 때만 여기로 와요.
        if (message.getData() != null) {
            if (message.getData().get("title") != null) title = message.getData().get("title");
            if (message.getData().get("body") != null) body = message.getData().get("body");
            link = message.getData().get("link");
        }
        if (message.getNotification() != null) {
            if (message.getNotification().getTitle() != null) title = message.getNotification().getTitle();
            if (message.getNotification().getBody() != null) body = message.getNotification().getBody();
        }

        show(title, body, link);
    }

    private void show(String title, String body, String link) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "바텐톡 알림", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("채팅·댓글 등 새 소식");
            nm.createNotificationChannel(ch);
        }

        // 알림을 누르면 앱이 열립니다. link 가 있으면 그 화면으로.
        Intent intent = new Intent(this, LauncherActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (link != null && !link.isEmpty()) {
            intent.setData(Uri.parse(link));
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent, flags);

        Notification n = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pi)
                .build();

        nm.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), n);
    }
}
