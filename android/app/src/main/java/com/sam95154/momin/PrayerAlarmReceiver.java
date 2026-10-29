package com.sam95154.momin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    public static final String EXTRA_PRAYER="prayer_title",EXTRA_PRAYER_KEY="prayer_key",EXTRA_DATE="prayer_date";
    @Override public void onReceive(Context c,Intent in){
        String prayer=in.getStringExtra(EXTRA_PRAYER),key=in.getStringExtra(EXTRA_PRAYER_KEY);if(prayer==null||key==null)return;
        if(!PrayerScheduler.isPrayerEnabled(c,key)){PrayerScheduler.scheduleUpcoming(c);return;}
        NotificationHelper.ensureChannels(c);String mode=PrayerScheduler.soundMode(c);
        if("azan".equals(mode)){
            Intent service=new Intent(c,AdhanPlaybackService.class).setAction(AdhanPlaybackService.ACTION_PLAY).putExtra(EXTRA_PRAYER,prayer);
            try{if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O)c.startForegroundService(service);else c.startService(service);}
            catch(Exception e){Log.w("MOMIN-PrayerAlarm","Could not start background audio; showing standard notification",e);NotificationHelper.showPrayerNotification(c,prayer,"system");}
        }else NotificationHelper.showPrayerNotification(c,prayer,mode);
        PrayerScheduler.scheduleUpcoming(c);
    }
}
