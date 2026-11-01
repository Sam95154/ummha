package com.momin.noorulislam;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

public class MominAzanPlaybackService extends Service {
    private static final String CHANNEL="momin_azan_playback";
    private static final int NOTIFICATION_ID=7799;
    private MediaPlayer player;
    private String prayer="Prayer";

    public static void start(android.content.Context context,String prayer) {
        Intent intent=new Intent(context,MominAzanPlaybackService.class);
        intent.putExtra("prayer",prayer);
        if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent); else context.startService(intent);
    }
    @Override public void onCreate(){super.onCreate();createChannel();}
    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        prayer=intent==null?"Prayer":intent.getStringExtra("prayer");
        if(prayer==null || prayer.trim().isEmpty())prayer="Prayer";
        try {
            Notification notification=buildNotification();
            if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION_ID,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NOTIFICATION_ID,notification);
            startAudio();
        } catch(Exception error) {
            android.util.Log.e("MOMIN-Azan","Could not start Azan playback",error);
            stopPlayback();
        }
        return START_NOT_STICKY;
    }
    private void startAudio() {
        releasePlayer();
        player=MediaPlayer.create(this,R.raw.makkah_azan_notification);
        if(player==null){android.util.Log.e("MOMIN-Azan","Makkah Azan MP3 could not be opened");stopPlayback();return;}
        player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
        player.setWakeMode(getApplicationContext(),PowerManager.PARTIAL_WAKE_LOCK);
        player.setOnCompletionListener(mp->stopPlayback());
        player.setOnErrorListener((mp,what,extra)->{android.util.Log.e("MOMIN-Azan","MediaPlayer error "+what+"/"+extra);stopPlayback();return true;});
        try{player.start();}catch(Exception error){android.util.Log.e("MOMIN-Azan","Azan playback failed",error);stopPlayback();}
    }
    private Notification buildNotification() {
        Intent open=new Intent(this,MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content=PendingIntent.getActivity(this,7820,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Intent stop=new Intent(this,MominStopAzanReceiver.class);
        PendingIntent stopAction=PendingIntent.getBroadcast(this,7821,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CHANNEL):new Notification.Builder(this);
        builder.setSmallIcon(getApplicationInfo().icon).setContentTitle("MOMIN · "+prayer+" time")
            .setContentText("Makkah Azan is playing").setContentIntent(content)
            .setCategory(Notification.CATEGORY_ALARM).setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true).setOngoing(true).setShowWhen(true)
            .addAction(getApplicationInfo().icon,"Stop Azan",stopAction);
        return builder.build();
    }
    private void createChannel() {
        if(Build.VERSION.SDK_INT<26)return;
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager==null)return;
        NotificationChannel channel=new NotificationChannel(CHANNEL,"MOMIN Azan Playback",NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Shown while the Makkah Azan audio is playing");
        channel.setSound(null,null);channel.enableVibration(false);channel.setLightColor(Color.rgb(191,154,80));
        manager.createNotificationChannel(channel);
    }
    private void stopPlayback() {
        releasePlayer();
        if(Build.VERSION.SDK_INT>=24)stopForeground(STOP_FOREGROUND_REMOVE);else stopForeground(true);
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager!=null)manager.cancel(NOTIFICATION_ID);
        stopSelf();
    }
    private void releasePlayer() {
        if(player!=null){try{if(player.isPlaying())player.stop();}catch(Exception ignored){}try{player.release();}catch(Exception ignored){}player=null;}
    }
    @Override public void onDestroy(){
        releasePlayer();
        if(Build.VERSION.SDK_INT>=24)stopForeground(STOP_FOREGROUND_REMOVE);else stopForeground(true);
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager!=null)manager.cancel(NOTIFICATION_ID);
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
