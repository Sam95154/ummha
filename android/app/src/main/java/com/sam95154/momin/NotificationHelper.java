package com.sam95154.momin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

final class NotificationHelper {
    static final String CHANNEL_PRAYER="momin_prayer_alerts_v1",CHANNEL_PLAYBACK="momin_azan_playback_v1",CHANNEL_SILENT="momin_prayer_silent_v1";
    static final int ID_PRAYER=4201,ID_PLAYBACK=4202;
    private NotificationHelper(){}
    static void ensureChannels(Context c){
        if(Build.VERSION.SDK_INT<26)return;
        NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(m==null)return;
        NotificationChannel alerts=new NotificationChannel(CHANNEL_PRAYER,"MOMIN prayer reminders",NotificationManager.IMPORTANCE_HIGH);
        alerts.setDescription("Prayer-time notifications. Sound and vibration can be adjusted in Android settings.");
        alerts.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());m.createNotificationChannel(alerts);
        NotificationChannel playback=new NotificationChannel(CHANNEL_PLAYBACK,"MOMIN Azan playback",NotificationManager.IMPORTANCE_LOW);
        playback.setDescription("Shows a stop control while the full Azan is playing.");playback.setSound(null,null);playback.enableVibration(false);m.createNotificationChannel(playback);
        NotificationChannel silent=new NotificationChannel(CHANNEL_SILENT,"MOMIN silent prayer reminders",NotificationManager.IMPORTANCE_LOW);
        silent.setDescription("Silent prayer-time reminders.");silent.setSound(null,null);silent.enableVibration(false);m.createNotificationChannel(silent);
    }
    static Notification playbackNotification(Context c,String prayer){
        ensureChannels(c);Intent stop=new Intent(c,AdhanPlaybackService.class).setAction(AdhanPlaybackService.ACTION_STOP);
        PendingIntent stopPi=PendingIntent.getService(c,5512,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b=new Notification.Builder(c,CHANNEL_PLAYBACK).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
          .setContentTitle("MOMIN · "+prayer).setContentText("Makkah Azan is playing. Tap Stop to end playback.")
          .setOngoing(true).setOnlyAlertOnce(true).addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause,"Stop Azan",stopPi).build());
        Intent open=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        b.setContentIntent(PendingIntent.getActivity(c,5513,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));return b.build();
    }
    static void showPrayerNotification(Context c,String prayer,String mode){
        ensureChannels(c);NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(m==null)return;
        String channel="silent".equals(mode)?CHANNEL_SILENT:CHANNEL_PRAYER;
        Notification n=new Notification.Builder(c,channel).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
          .setContentTitle("MOMIN · "+prayer).setContentText("It is time for "+prayer+".").setAutoCancel(true).build();
        m.notify(ID_PRAYER,n);
    }
}
