package com.momin.noorulislam;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public final class MominAlarmScheduler {
    private static final String PREFS="momin_prayer_alarm_store";
    private static final String KEY_ALARMS="scheduled_alarms";
    private MominAlarmScheduler() {}

    public static synchronized void schedule(Context context,JSONArray alarms) throws Exception {
        AlarmManager manager=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if(manager==null) throw new IllegalStateException("Android AlarmManager is unavailable.");
        if(Build.VERSION.SDK_INT>=31 && !manager.canScheduleExactAlarms()) throw new SecurityException("Alarms & reminders permission is not enabled.");
        cancelStored(context);
        context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString(KEY_ALARMS,alarms.toString()).apply();
        scheduleStored(context,alarms);
    }
    public static synchronized void restore(Context context) {
        try {
            String raw=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).getString(KEY_ALARMS,"[]");
            scheduleStored(context,new JSONArray(raw));
        } catch(Exception error) { android.util.Log.e("MOMIN-Alarms","Could not restore prayer alarms",error); }
    }
    public static synchronized void cancelAll(Context context) {
        cancelStored(context);
        context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().remove(KEY_ALARMS).apply();
    }
    private static void cancelStored(Context context) {
        try {
            JSONArray old=new JSONArray(context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).getString(KEY_ALARMS,"[]"));
            AlarmManager manager=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
            if(manager==null)return;
            for(int i=0;i<old.length();i++){
                JSONObject item=old.optJSONObject(i); if(item==null)continue;
                PendingIntent pending=alarmPendingIntent(context,item.optString("id",""));
                if(pending!=null){manager.cancel(pending);pending.cancel();}
            }
        } catch(Exception error) { android.util.Log.w("MOMIN-Alarms","Could not cancel previous alarms",error); }
    }
    private static void scheduleStored(Context context,JSONArray alarms) {
        AlarmManager manager=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if(manager==null || (Build.VERSION.SDK_INT>=31 && !manager.canScheduleExactAlarms()))return;
        long now=System.currentTimeMillis();
        for(int i=0;i<alarms.length();i++){
            JSONObject item=alarms.optJSONObject(i); if(item==null)continue;
            long at=item.optLong("at",0L); String id=item.optString("id","");
            if(id.isEmpty() || at<=now+5000L)continue;
            Intent update=new Intent(context,MominPrayerAlarmReceiver.class);
            update.setAction("com.momin.noorulislam.PRAYER_ALARM."+id);
            update.putExtra("id",id); update.putExtra("at",at);
            update.putExtra("prayer",item.optString("prayer","Prayer"));
            update.putExtra("kind",item.optString("kind","prayer"));
            update.putExtra("title",item.optString("title","MOMIN prayer reminder"));
            update.putExtra("body",item.optString("body","A prayer time is approaching."));
            update.putExtra("playAzan",item.optBoolean("playAzan",false));
            update.putExtra("sound",item.optString("sound","system"));
            PendingIntent pending=PendingIntent.getBroadcast(context,requestCode(id),update,
                PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            try {
                if(Build.VERSION.SDK_INT>=23) manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending);
                else manager.setExact(AlarmManager.RTC_WAKEUP,at,pending);
            } catch(SecurityException error) { android.util.Log.e("MOMIN-Alarms","Exact alarm permission missing",error); }
        }
    }
    private static PendingIntent alarmPendingIntent(Context context,String id) {
        if(id.isEmpty())return null;
        Intent intent=new Intent(context,MominPrayerAlarmReceiver.class);
        intent.setAction("com.momin.noorulislam.PRAYER_ALARM."+id);
        return PendingIntent.getBroadcast(context,requestCode(id),intent,PendingIntent.FLAG_NO_CREATE|PendingIntent.FLAG_IMMUTABLE);
    }
    private static int requestCode(String id){return id.hashCode()&0x7fffffff;}
}
