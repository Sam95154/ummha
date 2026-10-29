package com.sam95154.momin;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.data.DateComponents;
import com.batoulapps.adhan.Madhab;
import com.batoulapps.adhan.PrayerTimes;
import org.json.JSONObject;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

final class PrayerScheduler {
    static final String PREFS = "momin_native_prayers", KEY_ENABLED = "notifications", KEY_SOUND = "sound", KEY_TZ = "timezone", KEY_LAT = "latitude", KEY_LON = "longitude", KEY_METHOD = "method", KEY_MADHAB = "madhab", KEY_LEAD = "reminderMinutes";
    static final String[] PRAYERS = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    static final String[] TITLES = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private static final int DAYS_AHEAD = 8;
    private PrayerScheduler() { }

    static void updateFromWebsite(Context context, String json) {
        try {
            JSONObject o = new JSONObject(json);
            if (o.isNull("latitude") || o.isNull("longitude")) return;
            double lat=o.getDouble("latitude"), lon=o.getDouble("longitude");
            if (!Double.isFinite(lat)||!Double.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180) return;
            SharedPreferences p=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
            SharedPreferences.Editor e=p.edit();
            boolean changed=diff(p,KEY_LAT,lat)||diff(p,KEY_LON,lon)||diff(p,KEY_ENABLED,o.optBoolean("notifications",true))
              ||diff(p,KEY_SOUND,sound(o.optString("sound","azan")) )||diff(p,KEY_TZ,zone(o.optString("timezone","UTC")))
              ||diff(p,KEY_METHOD,o.optString("method","3"))||diff(p,KEY_MADHAB,o.optString("madhab","standard"))||diff(p,KEY_LEAD,lead(o.optInt("reminderMinutes",0)));
            boolean master=o.optBoolean("notifications",true);
            e.putString(KEY_LAT,Double.toString(lat));e.putString(KEY_LON,Double.toString(lon));
            e.putBoolean(KEY_ENABLED,master);e.putString(KEY_SOUND,sound(o.optString("sound","azan")));
            e.putString(KEY_TZ,zone(o.optString("timezone","UTC")));e.putString(KEY_METHOD,o.optString("method","3"));
            e.putString(KEY_MADHAB,o.optString("madhab","standard"));e.putInt(KEY_LEAD,lead(o.optInt("reminderMinutes",0)));
            e.putString("city",o.optString("city",""));e.putString("country",o.optString("country",""));
            for(String prayer:PRAYERS) {
                boolean enabled=o.optBoolean(prayer,master);
                if(diff(p,prayer,enabled)) changed=true;
                e.putBoolean(prayer,enabled);
            }
            e.apply();
            if(changed)scheduleUpcoming(context);
        } catch(Exception ex){Log.w("MOMIN-PrayerScheduler","Could not sync native prayer preferences",ex);}
    }
    private static boolean diff(SharedPreferences p,String key,boolean v){return !p.contains(key)||p.getBoolean(key,!v)!=v;}
    private static boolean diff(SharedPreferences p,String key,String v){return !v.equals(p.getString(key,null));}
    private static boolean diff(SharedPreferences p,String key,int v){return !p.contains(key)||p.getInt(key,v+1)!=v;}
    private static boolean diff(SharedPreferences p,String key,double v){if(!p.contains(key))return true;try{return Math.abs(Double.parseDouble(p.getString(key,"NaN"))-v)>0.000001;}catch(Exception e){return true;}}
    private static String sound(String s){return "system".equals(s)||"silent".equals(s)||"chime".equals(s)?s:"azan";}
    private static String zone(String s){try{return ZoneId.of(s).getId();}catch(Exception e){return ZoneId.systemDefault().getId();}}
    private static int lead(int m){return Math.max(0,Math.min(60,m));}

    static void scheduleUpcoming(Context context){
        Context app=context.getApplicationContext();SharedPreferences p=app.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        AlarmManager am=(AlarmManager)app.getSystemService(Context.ALARM_SERVICE);if(am==null)return;
        ZoneId zone;try{zone=ZoneId.of(p.getString(KEY_TZ,ZoneId.systemDefault().getId()));}catch(Exception e){zone=ZoneId.systemDefault();}
        LocalDate today=LocalDate.now(zone);cancelWindow(app,am,today);
        if(!p.getBoolean(KEY_ENABLED,false)||!p.contains(KEY_LAT)||!p.contains(KEY_LON))return;
        double lat,lon;try{lat=Double.parseDouble(p.getString(KEY_LAT,"0"));lon=Double.parseDouble(p.getString(KEY_LON,"0"));}catch(Exception e){return;}
        Coordinates coords=new Coordinates(lat,lon);CalculationParameters params=params(p.getString(KEY_METHOD,"3"),p.getString(KEY_MADHAB,"standard"));
        int minutes=lead(p.getInt(KEY_LEAD,0));long now=System.currentTimeMillis();
        for(int offset=0;offset<DAYS_AHEAD;offset++){
            LocalDate day=today.plusDays(offset);PrayerTimes times;
            try{times=new PrayerTimes(coords,new DateComponents(day.getYear(),day.getMonthValue(),day.getDayOfMonth()),params);}catch(Exception e){Log.w("MOMIN-PrayerScheduler","Calculation failed for "+day,e);continue;}
            Date[] dates={times.fajr,times.dhuhr,times.asr,times.maghrib,times.isha};
            for(int i=0;i<PRAYERS.length;i++){
                if(!p.getBoolean(PRAYERS[i],true)||dates[i]==null)continue;
                long at=dates[i].getTime()-minutes*60000L;if(at<=now+15000L)continue;
                scheduleOne(app,am,day,i,at,TITLES[i]);
            }
        }
    }
    private static CalculationParameters params(String id,String madhab){
        CalculationMethod m;
        switch(id){case "1":m=CalculationMethod.KARACHI;break;case "2":m=CalculationMethod.NORTH_AMERICA;break;case "4":m=CalculationMethod.UMM_AL_QURA;break;case "5":m=CalculationMethod.EGYPTIAN;break;case "16":m=CalculationMethod.DUBAI;break;case "9":m=CalculationMethod.KUWAIT;break;case "10":m=CalculationMethod.QATAR;break;case "11":m=CalculationMethod.SINGAPORE;break;case "3":default:m=CalculationMethod.MUSLIM_WORLD_LEAGUE;break;}
        CalculationParameters p=m.getParameters();p.madhab="hanafi".equalsIgnoreCase(madhab)?Madhab.HANAFI:Madhab.SHAFI;return p;
    }
    private static void scheduleOne(Context c,AlarmManager am,LocalDate day,int i,long at,String title){
        int id=alarmId(day,i);Intent in=new Intent(c,PrayerAlarmReceiver.class).setAction("com.sam95154.momin.PRAYER_ALARM").putExtra(PrayerAlarmReceiver.EXTRA_PRAYER,title).putExtra(PrayerAlarmReceiver.EXTRA_PRAYER_KEY,PRAYERS[i]).putExtra(PrayerAlarmReceiver.EXTRA_DATE,day.toString());
        PendingIntent pi=PendingIntent.getBroadcast(c,id,in,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        try{if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.S&&am.canScheduleExactAlarms())am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);}
        catch(SecurityException e){try{am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);}catch(Exception x){Log.w("MOMIN-PrayerScheduler","Could not schedule "+title,e);}}
    }
    private static void cancelWindow(Context c,AlarmManager am,LocalDate today){
        for(int d=-2;d<=14;d++)for(int i=0;i<PRAYERS.length;i++){
            Intent in=new Intent(c,PrayerAlarmReceiver.class).setAction("com.sam95154.momin.PRAYER_ALARM");
            PendingIntent pi=PendingIntent.getBroadcast(c,alarmId(today.plusDays(d),i),in,PendingIntent.FLAG_NO_CREATE|PendingIntent.FLAG_IMMUTABLE);if(pi!=null)am.cancel(pi);
        }
    }
    private static int alarmId(LocalDate day,int prayer){return (int)((day.toEpochDay()%200000L)*10L+prayer+100L);}
    static boolean isPrayerEnabled(Context c,String key){SharedPreferences p=c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);return p.getBoolean(KEY_ENABLED,false)&&p.getBoolean(key,true);}
    static String soundMode(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE).getString(KEY_SOUND,"azan");}
}
