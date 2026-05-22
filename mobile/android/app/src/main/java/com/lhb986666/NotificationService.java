package com.lhb986666.carbontracker;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.os.Bundle;
import android.util.Log;
import android.content.SharedPreferences;

public class NotificationService extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Log.d("CarbonTracker", "알림 감지: " + packageName);

        Bundle extras = sbn.getNotification().extras;
        String title = extras.getString("android.title", "");
        String text = extras.getCharSequence("android.text", "").toString();

        if (isCardApp(packageName)) {
            Log.d("CarbonTracker", "카드사 감지됨!");
            String data = packageName + "|" + title + "|" + text;
            
            // SharedPreferences에 저장
            SharedPreferences prefs = getSharedPreferences("CardNotification", MODE_PRIVATE);
            prefs.edit()
                .putString("latest", data)
                .putLong("timestamp", System.currentTimeMillis())
                .apply();
            Log.d("CarbonTracker", "SharedPreferences 저장 완료!");
        }
    }

    private boolean isCardApp(String packageName) {
        return packageName.equals("com.shcard.smartpay") ||
               packageName.equals("kr.co.samsungcard.mpocket") ||
               packageName.equals("com.kakaobank.channel") ||
               packageName.equals("viva.republica.toss") ||
               packageName.equals("nh.smart.banking") ||
               packageName.equals("nh.smart.nhcok") ||
               packageName.equals("m.hi.co.kr") ||
               packageName.equals("kr.co.cu.onbank") ||
               packageName.equals("com.kjbank.asb.pbanking") ||
               packageName.equals("com.omnitel.android.lottewebview") ||
               packageName.equals("com.kftc.payinfo.android") ||
               packageName.equals("com.samsung.android.spay") ||
               packageName.equals("com.kakao.talk") ||
               packageName.equals("com.kbcard.cxh.appcard") ||
               packageName.equals("com.wooricard.smartapp");
    }
}