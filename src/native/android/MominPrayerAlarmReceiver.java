package com.momin.noorulislam;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

public class MominPrayerAlarmReceiver extends BroadcastReceiver {
    public static final String CHANNEL_DEFAULT="momin_prayer_alerts";
    public static final String CHANNEL_SILENT="momin_prayer_alerts_silent";
    public static final String CHANNEL_FESTIVAL="momin_festival_reminders";
    public static final String CHANNEL_ADMIN="momin_admin_announcements";
    @Override public void onReceive(Context context,Intent intent) {
        String title=intent.getStringExtra("title"), body=intent.getStringExtra("body");
        String prayer=intent.getStringExtra("prayer"), sound=intent.getStringExtra("sound"), kind=intent.getStringExtra("kind");
        NotificationManager notificationManager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(notificationManager==null || !notificationManager.areNotificationsEnabled()) {
            android.util.Log.w("MOMIN-Alarms","Prayer alert skipped because notifications are disabled.");
            return;
        }
        if ("festival".equalsIgnoreCase(kind)) {
            showNotification(context,title==null?"MOMIN · Islamic occasion":title,
                body==null?"An Islamic occasion is today.":body,sound==null?"system":sound,"festival");
        } else if ("admin".equalsIgnoreCase(kind)) {
            showNotification(context,title==null?"MOMIN · Announcement":title,
                body==null?"You have a new MOMIN announcement.":body,sound==null?"system":sound,"admin");
        } else if(intent.getBooleanExtra("playAzan",false)) {
            try {
                MominAzanPlaybackService.start(context,prayer==null?"Prayer":prayer);
            } catch(Exception error) {
                android.util.Log.e("MOMIN-Azan","Background Azan service could not start",error);
                showNotification(context,title==null?"MOMIN prayer time":title,
                    "It is time for "+(prayer==null?"prayer":prayer)+". Open MOMIN to play the Azan.", "system");
            }
        } else {
            showNotification(context,title==null?"MOMIN prayer reminder":title,
                body==null?"A prayer time is approaching.":body,sound==null?"system":sound);
        }
    }
    public static void showNotification(Context context,String title,String body,String sound) {
        showNotification(context,title,body,sound,"prayer");
    }
    public static void showNotification(Context context,String title,String body,String sound,String category) {
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null || !manager.areNotificationsEnabled())return;
        createChannels(context);
        String channel;
        if ("festival".equalsIgnoreCase(category)) channel=CHANNEL_FESTIVAL;
        else if ("admin".equalsIgnoreCase(category)) channel=CHANNEL_ADMIN;
        else channel="silent".equalsIgnoreCase(sound)?CHANNEL_SILENT:CHANNEL_DEFAULT;
        Intent open=new Intent(context,MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content=PendingIntent.getActivity(context,7811,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(context,channel):new Notification.Builder(context);
        builder.setSmallIcon(context.getApplicationInfo().icon).setContentTitle(title).setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(content)
            .setCategory(Notification.CATEGORY_ALARM).setAutoCancel(true).setShowWhen(true);
        if(Build.VERSION.SDK_INT<26 && !"silent".equalsIgnoreCase(sound))builder.setDefaults(Notification.DEFAULT_SOUND|Notification.DEFAULT_VIBRATE);
        manager.notify(7800+Math.abs((title+body).hashCode()%2000),builder.build());
    }
    public static void createChannels(Context context) {
        if(Build.VERSION.SDK_INT<26)return;
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        NotificationChannel normal=new NotificationChannel(CHANNEL_DEFAULT,"MOMIN Prayer Reminders",NotificationManager.IMPORTANCE_HIGH);
        normal.setDescription("Prayer-time alerts and advance reminders");
        normal.enableVibration(true); normal.setLightColor(Color.rgb(191,154,80)); manager.createNotificationChannel(normal);
        NotificationChannel silent=new NotificationChannel(CHANNEL_SILENT,"MOMIN Silent Prayer Reminders",NotificationManager.IMPORTANCE_HIGH);
        silent.setDescription("Prayer-time alerts without notification sound");
        silent.setSound(null,null); silent.enableVibration(false); manager.createNotificationChannel(silent);

        NotificationChannel festivals=new NotificationChannel(CHANNEL_FESTIVAL,"MOMIN Festival Reminders",NotificationManager.IMPORTANCE_DEFAULT);
        festivals.setDescription("Islamic dates, festivals and religious occasion reminders");
        festivals.enableVibration(true); festivals.setLightColor(Color.rgb(191,154,80)); manager.createNotificationChannel(festivals);

        NotificationChannel admin=new NotificationChannel(CHANNEL_ADMIN,"MOMIN Admin Announcements",NotificationManager.IMPORTANCE_DEFAULT);
        admin.setDescription("Announcements and important updates sent by MOMIN administrators");
        admin.enableVibration(true); admin.setLightColor(Color.rgb(191,154,80)); manager.createNotificationChannel(admin);
    }
}
