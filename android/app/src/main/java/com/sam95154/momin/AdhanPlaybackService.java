package com.sam95154.momin;

import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class AdhanPlaybackService extends Service {
    public static final String ACTION_PLAY="com.sam95154.momin.PLAY_AZAN",ACTION_STOP="com.sam95154.momin.STOP_AZAN";
    private MediaPlayer player;private PowerManager.WakeLock wakeLock;
    @Override public void onCreate(){super.onCreate();NotificationHelper.ensureChannels(this);}
    @Override public int onStartCommand(Intent in,int flags,int id){
        if(in!=null&&ACTION_STOP.equals(in.getAction())){stopPlaybackAndSelf();return START_NOT_STICKY;}
        String prayer=in==null?"Prayer time":in.getStringExtra(PrayerAlarmReceiver.EXTRA_PRAYER);if(prayer==null)prayer="Prayer time";
        try{
            android.app.Notification n=NotificationHelper.playbackNotification(this,prayer);
            if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q)startForeground(NotificationHelper.ID_PLAYBACK,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);else startForeground(NotificationHelper.ID_PLAYBACK,n);
            stopPlayer();PowerManager power=(PowerManager)getSystemService(POWER_SERVICE);
            if(power!=null){wakeLock=power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"MOMIN:AzanPlayback");wakeLock.acquire(120000L);}
            Uri uri=Uri.parse("android.resource://"+getPackageName()+"/"+R.raw.makkah_azan_notification);
            player=new MediaPlayer();player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            player.setWakeMode(getApplicationContext(),PowerManager.PARTIAL_WAKE_LOCK);player.setDataSource(this,uri);
            player.setOnCompletionListener(mp->stopPlaybackAndSelf());player.setOnErrorListener((mp,what,extra)->{stopPlaybackAndSelf();return true;});
            player.setOnPreparedListener(MediaPlayer::start);player.prepareAsync();
        }catch(Exception e){Log.e("MOMIN-AzanService","Could not start Azan playback",e);stopPlaybackAndSelf();}
        return START_NOT_STICKY;
    }
    private void stopPlayer(){if(player!=null){try{player.setOnCompletionListener(null);player.setOnErrorListener(null);player.stop();}catch(Exception ignored){}try{player.reset();}catch(Exception ignored){}try{player.release();}catch(Exception ignored){}player=null;}}
    private void stopPlaybackAndSelf(){stopPlayer();if(wakeLock!=null&&wakeLock.isHeld()){try{wakeLock.release();}catch(Exception ignored){}}wakeLock=null;if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.N)stopForeground(STOP_FOREGROUND_REMOVE);else stopForeground(true);stopSelf();}
    @Override public void onDestroy(){stopPlayer();if(wakeLock!=null&&wakeLock.isHeld()){try{wakeLock.release();}catch(Exception ignored){}}wakeLock=null;super.onDestroy();}
    @Override public IBinder onBind(Intent in){return null;}
}
