package com.momin.noorulislam;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name="MominPrayerAlarm", permissions={
    @Permission(alias="notifications", strings={Manifest.permission.POST_NOTIFICATIONS}),
    @Permission(alias="location", strings={Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION})
})
public class MominPrayerAlarmPlugin extends Plugin {
    @PluginMethod public void getStatus(PluginCall call) { call.resolve(status()); }
    @PluginMethod public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve(status()); return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }
    @PermissionCallback private void notificationPermissionCallback(PluginCall call) { call.resolve(status()); }
    @PluginMethod public void requestLocationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 23 || locationGranted()) { call.resolve(status()); return; }
        requestPermissionForAlias("location", call, "locationPermissionCallback");
    }
    @PermissionCallback private void locationPermissionCallback(PluginCall call) { call.resolve(status()); }
    @PluginMethod public void openExactAlarmSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 31 && !alarmManager().canScheduleExactAlarms()) {
                Intent intent=new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:"+getContext().getPackageName()));
                getActivity().startActivity(intent);
            }
            call.resolve(status());
        } catch(Exception error) { call.reject("Could not open Alarms & reminders settings.",error); }
    }
    @PluginMethod public void schedule(PluginCall call) {
        try {
            JSArray alarms=call.getArray("alarms");
            if(alarms==null){call.reject("Prayer alarm list is missing.");return;}
            if(!notificationsEnabled()){call.reject("Allow MOMIN notifications in Android settings.");return;}
            boolean hasPrayerAlarms=false;
            for(int i=0;i<alarms.length();i++){
                org.json.JSONObject item=alarms.getJSONObject(i);
                if("prayer".equalsIgnoreCase(item.optString("kind","prayer"))){hasPrayerAlarms=true;break;}
            }
            if(hasPrayerAlarms && Build.VERSION.SDK_INT>=31 && !alarmManager().canScheduleExactAlarms()){
                call.reject("Enable Alarms & reminders for MOMIN, return to the app, and save notifications again.");return;
            }
            MominAlarmScheduler.schedule(getContext(),alarms);
            JSObject result=status(); result.put("scheduled",alarms.length()); call.resolve(result);
        } catch(Exception error) { call.reject("Prayer alarms could not be scheduled: "+error.getMessage(),error); }
    }
    @PluginMethod public void cancel(PluginCall call) {
        try { MominAlarmScheduler.cancelAll(getContext()); call.resolve(status()); }
        catch(Exception error) { call.reject("Prayer alarms could not be cancelled.",error); }
    }
    @PluginMethod public void testNotification(PluginCall call) {
        if(!notificationsEnabled()){call.reject("Allow MOMIN notifications first.");return;}
        MominPrayerAlarmReceiver.showNotification(getContext(),"MOMIN notification test",
            "Your Android prayer notification channel is working.","system");
        call.resolve();
    }
    @PluginMethod public void previewAzan(PluginCall call) {
        if(!notificationsEnabled()){call.reject("Allow MOMIN notifications before previewing Azan.");return;}
        try { MominAzanPlaybackService.start(getContext(),"Azan preview"); call.resolve(); }
        catch(Exception error) { call.reject("Makkah Azan preview could not start.",error); }
    }
    @PluginMethod public void stopAzan(PluginCall call) {
        getContext().stopService(new Intent(getContext(),MominAzanPlaybackService.class)); call.resolve();
    }
    private AlarmManager alarmManager(){return (AlarmManager)getContext().getSystemService(Context.ALARM_SERVICE);}
    private boolean locationGranted(){
        return Build.VERSION.SDK_INT < 23 ||
            getContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
            getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }
    private boolean notificationsEnabled(){
        NotificationManager manager=(NotificationManager)getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        return manager!=null && manager.areNotificationsEnabled() &&
            (Build.VERSION.SDK_INT<33 || getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==android.content.pm.PackageManager.PERMISSION_GRANTED);
    }
    private JSObject status(){
        MominPrayerAlarmReceiver.createChannels(getContext());
        JSObject value=new JSObject(); AlarmManager manager=alarmManager();
        value.put("native",true); value.put("notificationsEnabled",notificationsEnabled());
        value.put("exactAlarmAllowed",Build.VERSION.SDK_INT<31 || (manager!=null && manager.canScheduleExactAlarms()));
        value.put("locationGranted",locationGranted());
        value.put("sdkInt",Build.VERSION.SDK_INT); value.put("packageId",getContext().getPackageName());
        return value;
    }
}
