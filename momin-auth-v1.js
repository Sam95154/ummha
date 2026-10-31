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
    if(!user)return;
    var meta=user.user_metadata||{};
    var {error}=await supabase.from("momin_profiles").upsert({
      user_id:user.id,
      display_name:userName(user),
      email:user.email||null,
      avatar_url:meta.avatar_url||meta.picture||meta.photo_url||null,
      auth_provider:providerFor(user),
      email_verified:!!user.email_confirmed_at,
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(error)console.warn("MOMIN profile sync:",error.message);
  }
  async function inspectCurrentDevice(user,session){
    var {data,error}=await supabase.from("momin_devices")
      .select("id,revoked_at")
      .eq("user_id",user.id).eq("device_key",deviceKey).maybeSingle();
    if(error)console.warn("MOMIN device check:",error.message);
    if(data&&data.revoked_at){
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
        var {error}=await supabase.from("momin_devices")
          .update({revoked_at:new Date().toISOString(),is_current:false})
          .eq("id",id);
        if(error)throw error;
        if(device.device_key===deviceKey)await supabase.auth.signOut({scope:"local"});
        else toast("Device marked for sign-out. It will sign out when it next connects to MOMIN.");
        return await profileApi.getDevices().filter(function(d){return d.id!==id});
      },
      signOut:async function(){
        var {error}=await supabase.auth.signOut({scope:"local"});
        if(error)throw error;
        return true;
      },
      deleteAccount:async function(){
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
      lastUserId=null;profileApi.clearSession();return;
    }
    var user=session.user;
    lastUserId=user.id;
    profileApi.setSession({user:user,access_token:session.access_token});
    if(syncInFlight)return;
    syncInFlight=true;
    try{
      await syncProfile(user);
      await inspectCurrentDevice(user,session);
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
    }
  });
  window.MominAuthV1={
    client:supabase,
    getSession:async function(){return await supabase.auth.getSession();},
    signOut:async function(){return await supabase.auth.signOut({scope:"local"});}
  };
})();