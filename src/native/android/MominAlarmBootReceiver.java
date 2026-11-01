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
           AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(action)) {
            MominAlarmScheduler.restore(context);
        }
    }
}
