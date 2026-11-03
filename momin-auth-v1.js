/* MOMIN Auth Bridge V1 — Supabase Auth + profile/device sync.
   The browser only uses the publishable key. No service-role key is exposed here. */
(function(){
  "use strict";
  var URL="https://qzwqpiquvhpjwqgaxorp.supabase.co";
  var KEY="sb_publishable_SAHjdts8xtuQSXE_lPa1cw_V6J3PjQt";
  if(!window.supabase||!window.supabase.createClient){
    console.error("MOMIN Auth: Supabase JS SDK did not load.");return;
  }
  var supabase=window.mominSupabase||window.supabase.createClient(URL,KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  window.mominSupabase=supabase;
  var deviceKey=localStorage.getItem("momin-device-key-v1");
  if(!deviceKey){
    deviceKey=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"momin-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
    localStorage.setItem("momin-device-key-v1",deviceKey);
  }
  function deviceName(){
    var ua=navigator.userAgent||"";
    var os=/Android/i.test(ua)?"Android":/iPhone|iPad|iPod/i.test(ua)?"iOS":/Windows/i.test(ua)?"Windows":/Mac OS/i.test(ua)?"macOS":/Linux/i.test(ua)?"Linux":"Browser device";
    var browser=/Edg\//.test(ua)?"Edge":/Firefox\//.test(ua)?"Firefox":/Chrome\//.test(ua)?"Chrome":/Safari\//.test(ua)?"Safari":"Browser";
    return os+" · "+browser;
  }
  function sessionIdFromJwt(token){
    try{
      var payload=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
      var decoded=JSON.parse(atob(payload));
      return decoded.session_id||null;
    }catch(e){return null;}
  }
  function providerFor(user){
    var identities=user&&Array.isArray(user.identities)?user.identities:[];
    return (user&&user.app_metadata&&user.app_metadata.provider)||
      (identities[0]&&identities[0].provider)||"email";
  }
  function userName(user){
    var m=user&&user.user_metadata||{};
    return user&&(
      m.full_name||m.name||m.display_name||
      [m.given_name,m.family_name].filter(Boolean).join(" ")||
      (user.email?user.email.split("@")[0]:"")
    )||"";
  }
  async function syncProfile(user){
    if(!user)return null;
    var meta=user.user_metadata||{};
    var existingResult=await supabase.from("momin_profiles")
      .select("display_name,email,avatar_url,profile_image_path,birthday,gender,profile_completed,profile_completed_at,public_user_id,account_status,announcements_enabled,phone,created_at")
      .eq("user_id",user.id).maybeSingle();
    if(existingResult.error)throw existingResult.error;
    var existing=existingResult.data||{};
    var avatar=existing.avatar_url||meta.avatar_url||meta.picture||meta.photo_url||null;
    var payload={
      user_id:user.id,
      display_name:existing.display_name||userName(user),
      email:user.email||null,
      avatar_url:avatar,
      profile_image_path:existing.profile_image_path||null,
      birthday:existing.birthday||null,
      gender:existing.gender||null,
      profile_completed:!!existing.profile_completed,
      profile_completed_at:existing.profile_completed_at||null,
      public_user_id:existing.public_user_id||undefined,
      account_status:existing.account_status||"Active",
      announcements_enabled:!!existing.announcements_enabled,
      phone:existing.phone||null,
      created_at:existing.created_at||undefined,
      auth_provider:providerFor(user),
      email_verified:!!(user.email_confirmed_at||meta.email_verified),
      updated_at:new Date().toISOString()
    };
    var saved=await supabase.from("momin_profiles").upsert(payload,{onConflict:"user_id"})
      .select("user_id,display_name,email,avatar_url,profile_image_path,auth_provider,email_verified,birthday,gender,profile_completed,profile_completed_at,public_user_id")
      .single();
    if(saved.error)throw saved.error;
    return saved.data;
  }
  function refreshNativeFcmWhenReady(){
    if(localStorage.getItem("momin-push-enabled")!=="true")return;
    var attempts=0;
    function waitForPush(){
      attempts++;
      if(window.MominNativePush&&typeof window.MominNativePush.syncIfEnabled==="function"){
        window.MominNativePush.syncIfEnabled().catch(function(error){
          console.warn("MOMIN FCM token refresh:",error&&error.message||error);
        });
        return;
      }
      if(attempts<60)setTimeout(waitForPush,100);
    }
    waitForPush();
  }
  async function inspectCurrentDevice(user,session){
    var {data,error}=await supabase.from("momin_devices")
      .select("id,revoked_at")
      .eq("user_id",user.id).eq("device_key",deviceKey).maybeSingle();
    if(error)console.warn("MOMIN device check:",error.message);
    if(data&&data.revoked_at){
      try{await supabase.functions.invoke("momin-push-register",{body:{action:"unsubscribe",device_key:deviceKey}})}catch(_){}
      await supabase.auth.signOut({scope:"local"});
      throw new Error("This device was signed out from your MOMIN account. Please sign in again.");
    }
    var sid=session&&session.access_token?sessionIdFromJwt(session.access_token):null;
    var {error:saveError}=await supabase.from("momin_devices").upsert({
      user_id:user.id,
      device_key:deviceKey,
      device_name:deviceName(),
      user_agent:(navigator.userAgent||"").slice(0,500),
      session_id:sid,
      last_seen_at:new Date().toISOString(),
      is_current:true,
      revoked_at:null
    },{onConflict:"user_id,device_key"});
    if(saveError)console.warn("MOMIN device registration:",saveError.message);
  }
  var profileApi=window.MominProfileSettingsV1;
  if(profileApi){
    profileApi.configure({
      signInWithGoogle:async function(){
        if(window.MominNative&&window.MominNative.isNative&&typeof window.MominNative.signInWithGoogle==="function"){
          return await window.MominNative.signInWithGoogle();
        }
        var {data,error}=await supabase.auth.signInWithOAuth({
          provider:"google",
          options:{redirectTo:location.origin+"/"}
        });
        if(error)throw error;return data;
      },
      linkGoogle:async function(){
        var {data,error}=await supabase.auth.linkIdentity({provider:"google"});
        if(error)throw error;return data;
      },
      changePassword:async function(){
        return openPasswordDialog();
      },
      saveProfile:async function(form){
        var current=await supabase.auth.getUser();
        if(current.error)throw current.error;
        var user=current.data&&current.data.user;
        if(!user)throw new Error("Sign in again to update your profile.");
        form=form||{};
        var name=String(form.name||"").trim();
        var birthday=form.birthday?String(form.birthday):null;
        var gender=["male","female","prefer_not_to_say"].indexOf(String(form.gender||""))>=0?String(form.gender):null;
        if(name.length<2||name.length>80)throw new Error("Enter a name between 2 and 80 characters.");
        if(birthday){
          var dob=new Date(birthday+"T00:00:00");
          var today=new Date();today.setHours(23,59,59,999);
          if(Number.isNaN(dob.getTime())||dob.getFullYear()<1900||dob>today)throw new Error("Enter a valid birthday that is not in the future.");
        }
        var oldResult=await supabase.from("momin_profiles")
          .select("avatar_url,profile_image_path,profile_completed_at")
          .eq("user_id",user.id).maybeSingle();
        if(oldResult.error)throw oldResult.error;
        var oldProfile=oldResult.data||{};
        var avatarUrl=oldProfile.avatar_url||(user.user_metadata||{}).avatar_url||(user.user_metadata||{}).picture||null;
        var imagePath=oldProfile.profile_image_path||null;
        var uploadedPath=null;
        var file=form.avatarFile||null;
        if(file){
          if(!/^image\/(jpeg|png|webp|avif)$/.test(file.type)||file.size>5*1024*1024)throw new Error("Choose a JPG, PNG, WebP or AVIF image up to 5 MB.");
          var extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":file.type==="image/avif"?"avif":"jpg";
          uploadedPath=user.id+"/profile-"+((window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now())+"."+extension;
          var upload=await supabase.storage.from("avatars").upload(uploadedPath,file,{upsert:false,contentType:file.type,cacheControl:"3600"});
          if(upload.error)throw upload.error;
          imagePath=uploadedPath;
          avatarUrl=supabase.storage.from("avatars").getPublicUrl(uploadedPath).data.publicUrl;
        }
        var metadata=Object.assign({},user.user_metadata||{},{full_name:name,name:name,display_name:name});
        var updatedAuth=await supabase.auth.updateUser({data:metadata});
        if(updatedAuth.error){
          if(uploadedPath)await supabase.storage.from("avatars").remove([uploadedPath]);
          throw updatedAuth.error;
        }
        var now=new Date().toISOString();
        var saved=await supabase.from("momin_profiles").upsert({
          user_id:user.id,display_name:name,email:user.email||null,avatar_url:avatarUrl,
          profile_image_path:imagePath,auth_provider:providerFor(user),
          email_verified:!!(user.email_confirmed_at||(user.user_metadata||{}).email_verified),birthday:birthday,gender:gender,
          profile_completed:true,profile_completed_at:oldProfile.profile_completed_at||now,updated_at:now
        },{onConflict:"user_id"}).select("user_id,display_name,email,avatar_url,profile_image_path,auth_provider,email_verified,birthday,gender,profile_completed,profile_completed_at,public_user_id").single();
        if(saved.error){
          if(uploadedPath)await supabase.storage.from("avatars").remove([uploadedPath]);
          throw saved.error;
        }
        if(uploadedPath&&oldProfile.profile_image_path&&oldProfile.profile_image_path!==uploadedPath){
          var removed=await supabase.storage.from("avatars").remove([oldProfile.profile_image_path]);
          if(removed.error)console.warn("MOMIN old profile image cleanup:",removed.error.message);
        }
        return {user:updatedAuth.data&&updatedAuth.data.user||user,profile:saved.data};
      },
      listDevices:async function(){
        var {data,error}=await supabase.from("momin_devices")
          .select("id,device_key,device_name,first_seen_at,last_seen_at,is_current,revoked_at")
          .is("revoked_at",null)
          .order("last_seen_at",{ascending:false});
        if(error)throw error;
        return (data||[]).map(function(row){
          return {
            id:row.id,device_key:row.device_key,name:row.device_name,
            last_active:row.last_seen_at,is_current:row.device_key===deviceKey,
            browser:row.device_name
          };
        });
      },
      revokeDevice:async function(id){
        var device=(profileApi.getDevices()||[]).find(function(d){return d.id===id});
        if(!device)throw new Error("Device record not found.");
        if(window.MominNativePush){
          try{
            var revokePush=await supabase.functions.invoke("momin-fcm-register",{
              body:{action:"disable",device_key:device.device_key,app_id:"com.momin.noorulislam"}
            });
            if(revokePush.error)console.warn("MOMIN revoked device FCM cleanup:",revokePush.error.message);
          }catch(pushError){console.warn("MOMIN revoked device FCM cleanup:",pushError&&pushError.message||pushError);}
        }
        var {error}=await supabase.from("momin_devices")
          .update({revoked_at:new Date().toISOString(),is_current:false})
          .eq("id",id);
        if(error)throw error;
        if(device.device_key===deviceKey){try{if(window.MominNotificationsBridgeV1)await window.MominNotificationsBridgeV1.disableBackgroundPush()}catch(_){}await supabase.auth.signOut({scope:"local"});}
        else toast("Device marked for sign-out. It will sign out when it next connects to MOMIN.");
        return await profileApi.getDevices().filter(function(d){return d.id!==id});
      },
      signOut:async function(){
        try{if(window.MominNotificationsBridgeV1)await window.MominNotificationsBridgeV1.disableBackgroundPush()}catch(_){}
        var {error}=await supabase.auth.signOut({scope:"local"});
        if(error)throw error;
        return true;
      },
      deleteAccount:async function(){
        try{if(window.MominNotificationsBridgeV1)await window.MominNotificationsBridgeV1.disableBackgroundPush()}catch(_){}
        var {data,error}=await supabase.functions.invoke("momin-delete-account",{body:{}});
        if(error)throw error;
        await supabase.auth.signOut({scope:"local"});
        return data;
      }
    });
  }
  var syncInFlight=false,lastUserId=null;
  async function updateSession(session){
    if(!profileApi)return;
    if(!session||!session.user){
      lastUserId=null;profileApi.clearSession();try{window.dispatchEvent(new CustomEvent("momin:auth-state-changed",{detail:{user:null}}))}catch(_){}return;
    }
    var user=session.user;
    lastUserId=user.id;
    profileApi.setSession({user:user,access_token:session.access_token},[]);
    try{window.dispatchEvent(new CustomEvent("momin:auth-state-changed",{detail:{user:{id:user.id}}}))}catch(_){}
    if(syncInFlight)return;
    syncInFlight=true;
    try{
      var savedProfile=await syncProfile(user);
      if(savedProfile)profileApi.setSession({user:user,profile:savedProfile,access_token:session.access_token},[]);
      await inspectCurrentDevice(user,session);
      refreshNativeFcmWhenReady();
      var devices=await profileApi.getDevices();
      var result=await supabase.from("momin_devices").select("id,device_key,device_name,last_seen_at,is_current,revoked_at")
        .eq("user_id",user.id).is("revoked_at",null).order("last_seen_at",{ascending:false});
      if(!result.error){
        profileApi.setDevices((result.data||[]).map(function(row){
          return {id:row.id,device_key:row.device_key,name:row.device_name,last_active:row.last_seen_at,is_current:row.device_key===deviceKey};
        }));
      }
    }catch(error){console.warn("MOMIN session sync:",error.message);}
    finally{syncInFlight=false;}
  }
  supabase.auth.onAuthStateChange(function(event,session){
    // Defer database calls until after Supabase has completed its internal auth event.
    setTimeout(function(){updateSession(session);},0);
    if(event==="PASSWORD_RECOVERY"&&location.pathname.indexOf("reset-password")===-1){
      location.assign("/reset-password.html");
    }
  });
  supabase.auth.getSession().then(function(result){updateSession(result.data&&result.data.session).catch(function(){});});

  function toast(message){
    if(typeof window.toast==="function"){window.toast(message);return;}
    console.info(message);
  }
  function openPasswordDialog(){
    var existing=document.getElementById("momin-password-dialog");if(existing)existing.remove();
    var overlay=document.createElement("div");overlay.id="momin-password-dialog";
    overlay.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(9,14,11,.7);display:grid;place-items:center;padding:18px";
    overlay.innerHTML='<form style="width:min(100%,420px);background:#fbf8ef;color:#20251f;border:1px solid #c8a45e;border-radius:22px;padding:24px;box-shadow:0 24px 80px #0007;display:grid;gap:12px"><h2 style="margin:0;color:#76541e">Change password</h2><p style="margin:0;font-size:13px;color:#666">Choose a new password of at least 8 characters.</p><label style="display:grid;gap:6px;font-size:13px;font-weight:650">New password<input id="momin-new-password" type="password" autocomplete="new-password" minlength="8" required style="padding:13px;border:1px solid #d4c9b0;border-radius:12px;background:#fff;color:#222"></label><label style="display:grid;gap:6px;font-size:13px;font-weight:650">Confirm password<input id="momin-confirm-password" type="password" autocomplete="new-password" minlength="8" required style="padding:13px;border:1px solid #d4c9b0;border-radius:12px;background:#fff;color:#222"></label><p id="momin-password-error" style="margin:0;color:#a2382c;font-size:12px"></p><div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" id="momin-password-cancel" style="padding:11px 16px;border:1px solid #cfc4ac;border-radius:12px;background:#fff">Cancel</button><button type="submit" style="padding:11px 18px;border:1px solid #b48a38;border-radius:12px;background:#cba34e;color:#17130c;font-weight:750">Update password</button></div></form>';
    document.body.appendChild(overlay);
    var form=overlay.querySelector("form");
    overlay.querySelector("#momin-password-cancel").onclick=function(){overlay.remove();};
    overlay.addEventListener("click",function(event){if(event.target===overlay)overlay.remove();});
    form.onsubmit=async function(event){
      event.preventDefault();
      var next=overlay.querySelector("#momin-new-password").value,confirm=overlay.querySelector("#momin-confirm-password").value;
      var error=overlay.querySelector("#momin-password-error");
      if(next.length<8){error.textContent="Use at least 8 characters.";return;}
      if(next!==confirm){error.textContent="The passwords do not match.";return;}
      var button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent="Updating…";
      var result=await supabase.auth.updateUser({password:next});
      button.disabled=false;button.textContent="Update password";
      if(result.error){error.textContent=result.error.message;return;}
      overlay.remove();toast("Password updated successfully.");
    };
  }
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"){
      supabase.auth.getSession().then(function(r){if(r.data&&r.data.session)inspectCurrentDevice(r.data.session.user,r.data.session).catch(function(){});});
      refreshNativeFcmWhenReady();
    }
  });
  window.MominAuthV1={
    client:supabase,
    getSession:async function(){return await supabase.auth.getSession();},
    signOut:async function(){return await supabase.auth.signOut({scope:"local"});}
  };
})();