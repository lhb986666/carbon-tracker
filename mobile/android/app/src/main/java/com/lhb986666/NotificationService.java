package com.lhb986666;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.os.Bundle;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactInstanceManager;

public class NotificationService extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Bundle extras = sbn.getNotification().extras;
        String title = extras.getString("android.title", "");
        String text = extras.getCharSequence("android.text", "").toString();

        if (isCardApp(packageName)) {
            String data = packageName + "|" + title + "|" + text;
            sendEvent(data);
        }
    }

    private boolean isCardApp(String packageName) {
        return packageName.contains("shinhan") ||    // 신한카드
               packageName.contains("kookmin") ||    // KB국민카드
               packageName.contains("hana") ||       // 하나카드
               packageName.contains("hyundai") ||    // 현대카드
               packageName.contains("samsung") ||    // 삼성카드
               packageName.contains("lotte") ||      // 롯데카드
               packageName.contains("woori") ||      // 우리카드
               packageName.contains("bc") ||         // BC카드
               packageName.contains("nonghyup") ||   // 농협카드
               packageName.contains("nh") ||         // NH농협
               packageName.contains("ibk") ||        // IBK기업은행
               packageName.contains("citi") ||       // 씨티카드
               packageName.contains("kakaobank") ||  // 카카오뱅크
               packageName.contains("kakaopage") ||  // 카카오페이
               packageName.contains("toss") ||       // 토스
               packageName.contains("payco") ||      // 페이코
               packageName.contains("samsungpay") || // 삼성페이
               packageName.contains("naverpay") ||   // 네이버페이
               packageName.contains("kbankus") ||    // 케이뱅크
               packageName.contains("mgcredit") ||   // MG새마을금고
               packageName.contains("suhyup") ||     // 수협카드
               packageName.contains("jeonbuk") ||    // 전북은행
               packageName.contains("gwangju");      // 광주은행
    }

    private void sendEvent(String data) {
        try {
            ReactApplication app = (ReactApplication) getApplication();
            ReactInstanceManager rim = app.getReactNativeHost().getReactInstanceManager();
            ReactContext ctx = rim.getCurrentReactContext();
            if (ctx != null) {
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit("CardNotification", data);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}