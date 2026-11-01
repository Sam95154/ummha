package com.momin.noorulislam;
import android.app.AlarmManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
public class MominAlarmBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent) {
        if(intent==null)return;
        String action=intent.getAction();
        if(Intent.ACTION_BOOT_COMPLETED.equals(action) ||
           Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
           AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(action) ||
           Intent.ACTION_TIME_CHANGED.equals(action)) {
            MominAlarmScheduler.restore(context);
        } else if(Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            // A changed time zone can change local prayer times. Clear stale
            // alarms and let MOMIN calculate a fresh local schedule on next open.
            MominAlarmScheduler.cancelAll(context);
            context.getSharedPreferences("momin_prayer_alarm_store",Context.MODE_PRIVATE)
                .edit().putBoolean("timezone_refresh_required",true).apply();
        }
    }
}
