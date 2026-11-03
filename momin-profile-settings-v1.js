/* MOMIN Profile & Account Settings V1
   UI scaffold based on the supplied Settings reference.
   It intentionally does not fabricate a signed-in user or simulate authentication.
   A future login page can connect through window.MominProfileSettingsV1. */
(function(){
  "use strict";

  var authUser=null;
  var devices=[];
  var selectedAvatarFile=null;
  var selectedAvatarPreview=null;
  var actions={};

  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function toast(message){
    if(typeof window.toast==="function"){window.toast(message);return;}
    var el=document.getElementById("toast");
    if(el){el.textContent=message;el.classList.add("show");setTimeout(function(){el.classList.remove("show");},2200);}
  }
  function normaliseUser(input){
    if(!input)return null;
    var user=input.user||(input.data&&input.data.user)||input;
    if(!user||typeof user!=="object")return null;
    var meta=user.user_metadata||user.metadata||user.profile||{};
    var appMeta=user.app_metadata||{};
    var identities=Array.isArray(user.identities)?user.identities:[];
    var firebaseProviders=user.providerData||[];
    var provider=appMeta.provider||user.provider||
      (identities[0]&&identities[0].provider)||
      (firebaseProviders[0]&&String(firebaseProviders[0].providerId||"").replace(".com",""))||"";
    var saved=input.profile||user.profile||{};
    var name=saved.display_name||user.name||user.displayName||meta.full_name||meta.name||meta.display_name||"";
    var email=user.email||saved.email||"";
    var avatar=saved.avatar_url||saved.profile_image_url||meta.avatar_url||meta.picture||meta.photo_url||user.picture||user.photoURL||"";
    var verified=!!(saved.email_verified||user.email_verified||user.emailVerified||user.email_confirmed_at||meta.email_verified);
    return {
      id:String(user.id||user.sub||""),
      name:String(name||"").trim(),
      email:String(email||"").trim(),
      avatar:String(avatar||""),
      provider:String(saved.auth_provider||provider||"").toLowerCase(),
      emailVerified:verified,
      birthday:String(saved.birthday||""),
      gender:String(saved.gender||""),
      profileImagePath:String(saved.profile_image_path||""),
      profileCompleted:!!saved.profile_completed,
      publicUserId:String(saved.public_user_id||"")
    };
  }
  function firstInitial(){
    var n=authUser&&authUser.name||"Guest";
    return (n.trim().charAt(0)||"G").toUpperCase();
  }
  function avatarMarkup(){
    if(selectedAvatarPreview){
      return '<img src="'+esc(selectedAvatarPreview)+'" alt="" referrerpolicy="no-referrer">';
    }
    if(authUser&&authUser.avatar){
      return '<img src="'+esc(authUser.avatar)+'" alt="Profile photo" referrerpolicy="no-referrer">';
    }
    return '<span aria-hidden="true">'+esc(firstInitial())+'</span>';
  }
  function providerLabel(){
    if(!authUser)return "Not connected";
    return authUser.provider==="google"?"Google account linked":(authUser.provider?authUser.provider.charAt(0).toUpperCase()+authUser.provider.slice(1)+" account":"Signed-in account");
  }
  function deviceMarkup(){
    if(!authUser)return '<div class="pf-empty">Sign in to see the devices using your MOMIN account.</div>';
    if(!devices.length)return '<div class="pf-empty">No device list has been provided by the account service yet. It will appear here after the login backend is connected.</div>';
    return devices.map(function(device){
      var id=String(device.id||device.session_id||"");
      var name=String(device.name||device.device_name||device.browser||"Signed-in device");
      var detail=[device.location,device.last_active||device.last_seen].filter(Boolean).join(" · ");
      return '<div class="pf-device"><div class="pf-device-icon" aria-hidden="true">▣</div><div class="pf-device-copy"><b>'+esc(name)+'</b><small>'+esc(detail||(device.is_current||device.current?"This device":"Signed-in session"))+(device.is_current||device.current?" · This device":"")+'</small></div>'+
        ((device.is_current||device.current)?"":'<button type="button" class="pf-link pf-revoke" data-mprofile-action="revoke-device" data-device-id="'+esc(id)+'">Remove</button>')+
        '</div>';
    }).join("");
  }
  function profileMarkup(){
    var loggedIn=!!authUser;
    var title=loggedIn?(authUser.name||"Your profile"):"Guest profile";
    var subtitle=loggedIn?"Your details are saved securely to your MOMIN account.":"Sign in to view and manage your saved profile.";
    var email=loggedIn?(authUser.email||"Email not available"):"Available after sign-in";
    var name=loggedIn?(authUser.name||""):"";
    var verified=authUser&&authUser.emailVerified?"Verified email":"Verification status not confirmed";
    var google=authUser&&authUser.provider==="google";
    var birthday=authUser&&authUser.birthday||"";
    var gender=authUser&&authUser.gender||"";
    var birthdayValue=esc(birthday);
    var genderOptions=["male","female","prefer_not_to_say"];
    var genderMarkup=genderOptions.map(function(value){
      var label=value==="male"?"Male":value==="female"?"Female":"Prefer not to say";
      return '<label class="pf-choice"><input type="radio" name="mprofile-gender" value="'+value+'" '+(gender===value?"checked":"")+'><span>'+label+'</span></label>';
    }).join("");
    return ''+
    '<section class="card momin-profile-settings-v1" id="momin-profile-settings-v1">'+
      '<div class="pf-head">'+
        '<div class="pf-head-main"><button type="button" class="pf-av pf-avatar-v1 pf-photo-button" data-mprofile-action="choose-photo" aria-label="Change profile photo">'+avatarMarkup()+'<span class="pf-photo-camera" aria-hidden="true">✎</span></button><div class="pf-head-copy">'+
          '<span class="pf-kicker">PROFILE &amp; ACCOUNT</span><h3>'+esc(title)+'</h3><p>'+esc(subtitle)+'</p></div></div>'+
        '<span class="pf-status '+(loggedIn?"is-in":"is-guest")+'">'+(loggedIn?"Signed in":"Guest mode")+'</span>'+
      '</div>'+
      (!loggedIn?'<div class="pf-login-prompt"><div><b>Continue with your account</b><small>Your saved name, email and profile image will appear here after you sign in.</small></div><button type="button" class="pf-primary" data-mprofile-action="sign-in">Sign in</button></div>':'')+
      '<div class="pf-section">'+
        '<h4>Personal information</h4>'+
        (loggedIn?
          '<form id="momin-profile-edit-form" class="pf-edit-form" novalidate>'+
            '<label class="pf-field"><span>Full name</span><input id="mprofile-name" name="name" type="text" maxlength="80" autocomplete="name" required value="'+esc(name)+'"></label>'+
            '<label class="pf-field"><span>Email address</span><div class="pf-email-line"><input type="email" readonly value="'+esc(email)+'" aria-readonly="true"><b class="pf-verified">'+esc(verified)+'</b></div></label>'+
            '<label class="pf-field"><span>Birthday</span><input id="mprofile-birthday" name="birthday" type="date" max="'+new Date().toISOString().slice(0,10)+'" value="'+birthdayValue+'"><small>Optional. You can leave this blank.</small></label>'+
            '<fieldset class="pf-field pf-gender-field"><legend>Gender</legend><div class="pf-gender-options">'+genderMarkup+'</div><small>Optional. You can leave this unselected.</small></fieldset>'+
            '<input id="mprofile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden>'+
            '<div class="pf-photo-row"><div><b>Profile photo</b><small>Saved to your account and visible on your other signed-in devices</small></div><button type="button" class="pf-outline" data-mprofile-action="choose-photo">Change photo</button></div>'+
            '<div class="pf-form-message" id="mprofile-form-message" role="status" aria-live="polite"></div>'+
            '<button type="button" class="pf-primary pf-save-profile" data-mprofile-action="save-profile">Save changes</button>'+
          '</form>'
          :'<div class="pf-info-grid"><div class="pf-info"><span>Name</span><b>Available after sign-in</b></div><div class="pf-info"><span>Email address</span><b>Available after sign-in</b></div></div>')+
      '</div>'+
      '<div class="pf-section">'+
        '<h4>Linked accounts</h4>'+
        '<div class="pf-account-row"><span class="pf-google-mark" aria-hidden="true">G</span><div class="pf-account-copy"><b>Google</b><small>'+(google?"Linked to this MOMIN account":"Not linked")+'</small></div>'+
        (google?'<span class="pf-linked">✓ Linked</span>':'<button type="button" class="pf-link" data-mprofile-action="link-google">'+(loggedIn?"Link Google":"Sign in with Google")+'</button>')+
        '</div>'+
      '</div>'+
      '<div class="pf-section">'+
        '<h4>Password &amp; security</h4>'+
        '<div class="pf-action-row"><div><b>Set or change password</b><small>'+(loggedIn?"Set a password or update your existing password.":"Sign in first to manage your password.")+'</small></div><button type="button" class="pf-outline" data-mprofile-action="change-password" '+(!loggedIn?"disabled":"")+'>'+(loggedIn?"Set password":"Sign in required")+'</button></div>'+
      '</div>'+
      '<div class="pf-section">'+
        '<h4>Logged-in devices</h4>'+
        '<div class="pf-device-list">'+deviceMarkup()+'</div>'+
        (loggedIn?'<p class="pf-hint">You can remove another device from this list. It will be signed out when it next connects to MOMIN.</p><button type="button" class="pf-outline pf-refresh-devices" data-mprofile-action="refresh-devices">Refresh device list</button>':'')+
      '</div>'+
      (loggedIn?
        '<div class="pf-account-actions"><button type="button" class="pf-outline" data-mprofile-action="logout">Log out</button><button type="button" class="pf-danger" data-mprofile-action="delete-account">Permanently delete account</button></div>':
        '<div class="pf-footnote">Your saved account information will appear here after sign-in.</div>')+
      '<p class="pf-hint">Your profile details are linked to your MOMIN user ID and are also available to authorised administrators.</p>'+
    '</section>';
  }
  function currentPageIsSettings(){
    var view=document.getElementById("view");
    return !!(view&&view.querySelector("#momin-profile-settings-v1"));
  }
  function refreshScreen(){
    if(typeof window.render==="function")window.render();
    else if(currentPageIsSettings()){
      var card=document.getElementById("momin-profile-settings-v1");
      if(card)card.outerHTML=profileMarkup();
    }
    syncChrome();
  }
  function syncChrome(){
    var name=authUser&&authUser.name||"Guest";
    var sub=authUser?(authUser.email||"Signed-in account"):"Guest mode · Sign in to connect";
    var sidebar=document.querySelector(".sidebar .profile");
    if(sidebar){
      sidebar.innerHTML='<div class="avatar">'+avatarMarkup()+'</div><div class="momin-profile-side-copy"><b>'+esc(name)+'</b><small>'+esc(sub)+'</small></div><button class="plain" type="button" aria-label="Open profile settings" style="margin-left:auto">⚙</button>';
      sidebar.setAttribute("role","button");sidebar.setAttribute("tabindex","0");sidebar.setAttribute("aria-label","Open profile and account settings");
      sidebar.style.cursor="pointer";
    }
    var topAvatar=document.querySelector(".topright > .avatar");
    if(topAvatar){
      topAvatar.innerHTML=avatarMarkup();
      topAvatar.setAttribute("role","button");topAvatar.setAttribute("tabindex","0");topAvatar.setAttribute("aria-label","Open profile settings");topAvatar.style.cursor="pointer";
    }
  }
  function invoke(action,args){
    var fn=actions[action];
    if(typeof fn!=="function"){
      var messages={
        "signInWithGoogle":"The login page is not connected yet. Send your login-page design so Google sign-in can be connected.",
        "linkGoogle":"Google account linking will be enabled with the login service.",
        "changePassword":"Password changes will be connected to your account service when the login page is added.",
        "listDevices":"Device management needs the authenticated account service.",
        "revokeDevice":"Device sessions cannot be revoked until the account service is connected.",
        "signOut":"Sign out will be connected to the login service.",
        "deleteAccount":"Account deletion needs the authenticated account service.",
        "saveProfile":"Profile saving is not connected to the account service.",
        "choosePhoto":"Photo upload is not available."
      };
      toast(messages[action]||"This account action is not connected yet.");
      return;
    }
    try{
      var result=fn.apply(null,args||[]);
      if(result&&typeof result.then==="function"){
        result.then(function(value){
          if(action==="listDevices"&&Array.isArray(value)){devices=value;refreshScreen();}
          else if(action==="saveProfile"&&value&&value.user){
            selectedAvatarFile=null;selectedAvatarPreview=null;
            window.MominProfileSettingsV1.setSession({user:value.user,profile:value.profile},devices);
            toast("Your MOMIN profile has been saved.");
          }
          else if(action==="signOut"||action==="deleteAccount"){authUser=null;devices=[];selectedAvatarFile=null;selectedAvatarPreview=null;refreshScreen();location.assign("/login.html");}
          else if(action==="revokeDevice"){invoke("listDevices");}
          else if(value&&value.user)window.MominProfileSettingsV1.setSession(value);
        }).catch(function(error){
          if(action==="saveProfile"){
            var saveButton=document.querySelector('[data-mprofile-action="save-profile"]');
            if(saveButton){saveButton.disabled=false;saveButton.textContent="Save changes";}
            var message=document.getElementById("mprofile-form-message");
            if(message){message.textContent=error&&error.message||"Your profile could not be saved. Please try again.";message.className="pf-form-message is-error";}
          }
          toast(error&&error.message||"The account action could not be completed.");
        });
      }else if(action==="listDevices"&&Array.isArray(result)){devices=result;refreshScreen();}
    }catch(error){toast(error&&error.message||"The account action could not be completed.");}
  }
  function handleAction(button){
    var action=button.getAttribute("data-mprofile-action");
    var id=button.getAttribute("data-device-id")||"";
    if(action==="sign-in"){location.assign("/login.html");return;}
    if(action==="choose-photo"){
      var picker=document.getElementById("mprofile-avatar-file");
      if(picker)picker.click();
      return;
    }
    if(action==="save-profile"){
      var nameField=document.getElementById("mprofile-name");
      var dateField=document.getElementById("mprofile-birthday");
      var genderField=document.querySelector('input[name="mprofile-gender"]:checked');
      var message=document.getElementById("mprofile-form-message");
      var formData={name:nameField&&nameField.value.trim(),birthday:dateField&&dateField.value||null,gender:genderField&&genderField.value||null,avatarFile:selectedAvatarFile};
      if(!formData.name||formData.name.length<2){if(message){message.textContent="Enter your full name.";message.className="pf-form-message is-error";}return;}
      if(message){message.textContent="Saving your profile…";message.className="pf-form-message";}
      button.disabled=true;button.textContent="Saving…";
      return invoke("saveProfile",[formData]);
    }
    if(action==="link-google")return invoke("linkGoogle");
    if(action==="change-password"){
      if(!authUser){toast("Sign in first to manage your password.");return;}
      return invoke("changePassword");
    }
    if(action==="refresh-devices")return invoke("listDevices");
    if(action==="revoke-device")return invoke("revokeDevice",[id]);
    if(action==="logout"){
      if(!authUser)return;
      if(!window.confirm("Log out of MOMIN on this device?"))return;
      return invoke("signOut");
    }
    if(action==="delete-account"){
      if(!authUser)return;
      if(!window.confirm("Delete your MOMIN account? This cannot be undone."))return;
      return invoke("deleteAccount");
    }
  }

  var previousSettingsPage=window.settingsPage;
  if(typeof previousSettingsPage==="function"){
    window.settingsPage=function(){
      var html=previousSettingsPage.apply(this,arguments);
      if(html.indexOf('id="momin-profile-settings-v1"')>=0)return html;
      var marker='<div class="grid g2">';
      var at=html.indexOf(marker);
      if(at<0)at=html.indexOf('<div class="card"');
      if(at<0)return html+profileMarkup();
      return html.slice(0,at)+profileMarkup()+html.slice(at);
    };
  }

  var previousHome=window.home;
  if(typeof previousHome==="function"){
    window.home=function(){
      var html=previousHome.apply(this,arguments);
      var greeting=authUser&&authUser.name?"Assalamu alaikum, "+authUser.name:"Assalamu alaikum";
      return html.replace(/Assalamu alaikum,\s*[^<]+/,greeting);
    };
  }

  var previousRender=window.render;
  if(typeof previousRender==="function"){
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      syncChrome();
      return result;
    };
  }

  document.addEventListener("change",function(event){
    if(event.target&&event.target.id==="mprofile-avatar-file"){
      var file=event.target.files&&event.target.files[0];
      if(!file)return;
      if(!/^image\/(jpeg|png|webp|avif)$/.test(file.type)||file.size>5*1024*1024){
        toast("Choose a JPG, PNG, WebP or AVIF image up to 5 MB.");event.target.value="";return;
      }
      selectedAvatarFile=file;
      if(selectedAvatarPreview)URL.revokeObjectURL(selectedAvatarPreview);
      selectedAvatarPreview=URL.createObjectURL(file);
      document.querySelectorAll("#momin-profile-settings-v1 .pf-photo-button").forEach(function(photoButton){
        photoButton.innerHTML=avatarMarkup()+'<span class="pf-photo-camera" aria-hidden="true">✎</span>';
      });
      syncChrome();
    }
  });
  document.addEventListener("click",function(event){
    var actionButton=event.target.closest("[data-mprofile-action]");
    if(actionButton){event.preventDefault();handleAction(actionButton);return;}
    var sideProfile=event.target.closest(".sidebar .profile");
    var topAvatar=event.target.closest(".topright > .avatar");
    if(sideProfile||topAvatar){
      if(typeof window.go==="function")window.go("settings");
      setTimeout(function(){
        var card=document.getElementById("momin-profile-settings-v1");
        if(card)card.scrollIntoView({behavior:"smooth",block:"start"});
      },100);
    }
  });
  document.addEventListener("keydown",function(event){
    if(event.key!=="Enter"&&event.key!==" ")return;
    if(event.target.matches(".sidebar .profile,.topright > .avatar")){
      event.preventDefault();if(typeof window.go==="function")window.go("settings");
    }
  });

  window.MominProfileSettingsV1={
    configure:function(nextActions){actions=Object.assign({},actions,nextActions||{});},
    setSession:function(session,sessionDevices){
      var next=normaliseUser(session);
      if(next)authUser=next;
      else authUser=null;
      if(Array.isArray(sessionDevices))devices=sessionDevices.slice();
      else if(session&&Array.isArray(session.devices))devices=session.devices.slice();
      else if(!sessionDevices)devices=[];
      refreshScreen();
      if(authUser&&typeof actions.listDevices==="function"&&!Array.isArray(sessionDevices)){
        invoke("listDevices");
      }
    },
    setUser:function(user,quiet){authUser=normaliseUser(user);if(!quiet){refreshScreen();if(authUser&&typeof actions.listDevices==="function")invoke("listDevices");}else{syncChrome();}return authUser?Object.assign({},authUser):null;},
    setDevices:function(list){devices=Array.isArray(list)?list.slice():[];refreshScreen();},
    clearSession:function(){authUser=null;devices=[];selectedAvatarFile=null;selectedAvatarPreview=null;refreshScreen();},
    getUser:function(){return authUser?Object.assign({},authUser):null;},
    getDevices:function(){return devices.slice();}
  };

  window.addEventListener("momin:auth-state-changed",function(event){
    var detail=event.detail||{};
    if(detail.session||detail.user)window.MominProfileSettingsV1.setSession(detail.session||detail.user,detail.devices);
    else window.MominProfileSettingsV1.clearSession();
  });

  if(window.mominAuthSession){
    window.MominProfileSettingsV1.setSession(window.mominAuthSession);
  }
  syncChrome();
})();