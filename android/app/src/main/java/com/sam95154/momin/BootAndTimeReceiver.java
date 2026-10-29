package com.sam95154.momin;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
public class BootAndTimeReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c,Intent in){
        if(in==null)return;String a=in.getAction();
        if(Intent.ACTION_BOOT_COMPLETED.equals(a)||Intent.ACTION_TIME_CHANGED.equals(a)||Intent.ACTION_TIMEZONE_CHANGED.equals(a)
          ||Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)||"android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(a))
            PrayerScheduler.scheduleUpcoming(c);
    }
}
