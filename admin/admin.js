(function(){
"use strict";
const SUPABASE_URL="https://qzwqpiquvhpjwqgaxorp.supabase.co";
const SUPABASE_KEY="sb_publishable_SAHjdts8xtuQSXE_lPa1cw_V6J3PjQt";
const API_URL=SUPABASE_URL+"/functions/v1/momin-admin-api";
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmtDate=value=>value?new Date(value).toLocaleString([],{dateStyle:"medium",timeStyle:"short"}):"—";
const fmtDateOnly=value=>value?new Date(value).toLocaleDateString([],{dateStyle:"medium"}):"—";
const num=value=>Number(value||0).toLocaleString("en-IN");
const statusClass=value=>({active:"success",verified:"success",sent:"success",published:"success",accepted:"success",read:"success",scheduled:"pending",draft:"demo",queued:"pending",processing:"pending",awaiting_approval:"pending",pending:"pending",failed:"error",suspended:"error",cancelled:"error",partially_sent:"pending",rejected:"error",unread:"info"}[String(value||"").toLowerCase()]||"demo");
const badge=value=>'<span class="status '+statusClass(value)+'">'+esc(String(value||"unknown").replace(/_/g," "))+'</span>';
const icon=value=>'<span class="metric-icon">'+esc(value||"•")+'</span>';
const titles={
 dashboard:["OVERVIEW","Dashboard","Live overview of MOMIN operations."],
 users:["USER OPERATIONS","All Users","Search and manage MOMIN accounts."],
 "active-users":["USER OPERATIONS","Active Users","Accounts with recent device activity."],
 devices:["USER OPERATIONS","User Devices","Registered devices and push readiness."],
 "user-support":["USER OPERATIONS","User Support","User assistance and recent account records."],
 suspended:["USER OPERATIONS","Suspended Accounts","Review accounts currently suspended."],
 notifications:["COMMUNICATION","Notification Centre","Create, schedule and review user communications."],
 "create-notification":["COMMUNICATION","Create Notification","Compose a message and preview it before scheduling."],
 templates:["COMMUNICATION","Notification Templates","Reusable approved notification templates."],
 scheduled:["COMMUNICATION","Scheduled Notifications","Review campaigns waiting for their scheduled time."],
 "delivery-reports":["COMMUNICATION","Delivery Reports","Track in-app inbox and push-provider outcomes."],
 announcements:["COMMUNICATION","Announcements","Manage general announcements and campaign notices."]
};
const routes=[
 ["dashboard","Dashboard"],["users","All Users"],["active-users","Active Users"],["devices","User Devices"],["user-support","User Support"],["suspended","Suspended Accounts"],
 ["notifications","Notification Centre"],["create-notification","Create Notification"],["templates","Notification Templates"],["scheduled","Scheduled Notifications"],["delivery-reports","Delivery Reports"],["announcements","Announcements"],
 ["giving","Giving Dashboard"],["campaigns","All Campaigns"],["create-campaign","Create Campaign"],["donations","Donations"],["zakat","Zakat Management"],["sadaqah","Sadaqah Management"],["charity-events","Charity Events"],["transactions","Transactions"],["receipts","Receipts"],["refunds","Refunds"],["fund-allocation","Fund Allocation"],["financial-reports","Financial Reports"],
 ["content","Content Dashboard"],["quran","Quran Management"],["translations-quran","Quran Translations"],["duas","Duas"],["reflections","Daily Reflections"],["hadith","Hadith References"],["articles","Islamic Articles"],["calendar-content","Islamic Calendar"],["media","Audio & Media"],["faqs","FAQs"],
 ["languages","Languages"],["app-settings","App Settings"],["features","Feature Flags"],["modules","Module Management"],["prayer-config","Prayer Configuration"],["mosques","Mosque Directory"],["learning","Islamic Learning"],["app-announcements","App Announcements"],
 ["support","Support Tickets"],["feedback","User Feedback"],["complaints","Complaints"],["content-reports","Content Reports"],["moderation","Moderation"],
 ["analytics","Analytics"],["user-reports","User Reports"],["campaign-reports","Campaign Reports"],["notification-reports","Notification Reports"],["finance-reports","Finance Reports"],
 ["staff","Staff Members"],["roles","Roles & Permissions"],["approvals","Approvals"],["audit","Audit Logs"],["security","Security Centre"],["health","System Health"],["storage","Storage"],["future","Future Modules"],["settings","Admin Settings"]
];
const routeGroups={
 dashboard:"OVERVIEW",
 users:"USER OPERATIONS","active-users":"USER OPERATIONS",devices:"USER OPERATIONS","user-support":"USER OPERATIONS",suspended:"USER OPERATIONS",
 notifications:"COMMUNICATION","create-notification":"COMMUNICATION",templates:"COMMUNICATION",scheduled:"COMMUNICATION","delivery-reports":"COMMUNICATION",announcements:"COMMUNICATION"
};
let client=null,session=null,staff=null,permissions=[],currentPage="dashboard",pageCache={},campaignId=null,uploadedImage=null,selectedUsers=[],userSearchTimer=null,authBusy=false,apiBusy=false,searchIndex=0,searchItems=[],usersPage=1,currentUsersStatus="all";
function toast(message,title){
 const n=document.createElement("div");n.className="toast";n.innerHTML=title?'<strong>'+esc(title)+'</strong>'+esc(message):esc(message);
 $("toastRegion").appendChild(n);window.setTimeout(()=>n.remove(),4800);
}
function showModal(title,body,confirmLabel,callback,opts){
 $("modalTitle").textContent=title;$("modalBody").innerHTML=body||"";
 $("modalConfirm").textContent=confirmLabel||"Save demo draft";
 $("modalConfirm").disabled=false;
 $("modalConfirm").onclick=async()=>{
   if(callback){$("modalConfirm").disabled=true;try{await callback()}catch(e){toast(e.message||"Action failed");$("modalConfirm").disabled=false}}
   else $("modalOverlay").classList.add("hidden");
 };
 $("modalOverlay").classList.remove("hidden");
}
function closeModal(){ $("modalOverlay").classList.add("hidden"); }
function hideAuth(){
 $("loginScreen").classList.add("hidden");$("mfaScreen").classList.add("hidden");$("workspace").classList.remove("hidden");
}
function showLogin(message){
 $("workspace").classList.add("hidden");$("mfaScreen").classList.add("hidden");$("loginScreen").classList.remove("hidden");
 $("loginTitle").textContent="Welcome back";
 $("loginDescription").textContent=message||"Sign in with your authorized MOMIN administrator account. Two-step verification is required.";
 $("demoEmail").value="";$("demoPassword").value="";
 if(!$("googleSigninBtn")){
  const b=document.createElement("button");b.id="googleSigninBtn";b.className="btn btn-secondary btn-block";b.type="button";b.textContent="Continue with Google";
  $("demoLoginForm").insertAdjacentElement("afterend",b);
  b.addEventListener("click",googleSignIn);
 }
 if(!$("forgotPasswordBtn")){
  const b=document.createElement("button");b.id="forgotPasswordBtn";b.type="button";b.className="text-btn full-center";b.textContent="Forgot password?";
  $("loginScreen").querySelector(".login-card").appendChild(b);
  b.addEventListener("click",forgotPassword);
 }
}
function showMfa(title,copy,content){
 $("workspace").classList.add("hidden");$("loginScreen").classList.add("hidden");$("mfaScreen").classList.remove("hidden");
 const card=$("mfaScreen").querySelector(".mfa-card");
 card.innerHTML='<button class="back-link" id="mfaBack">← Sign out</button><img class="brand-symbol large" src="../momin-mark.svg?v=islamic-logo-v3" alt="MOMIN logo"><div class="eyebrow">SECURE ADMIN ACCESS</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(copy)+'</p>'+content;
 $("mfaBack").addEventListener("click",async()=>{await client.auth.signOut({scope:"local"});showLogin("Sign in again when you are ready to complete administrator verification.")});
}
async function api(action,payload){
 if(!session){const r=await client.auth.getSession();session=r.data&&r.data.session;if(!session)throw new Error("Your session expired. Sign in again.");}
 const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(Object.assign({action},payload||{}))});
 let data={};try{data=await response.json()}catch(_){}
 if(!response.ok){const e=new Error(data.error||"MOMIN Admin request failed.");e.status=response.status;e.code=data.code;e.data=data;throw e}
 return data;
}
function hasPermission(key){
 return staff&&staff.role==="founder" || permissions.includes("*") || permissions.includes(key);
}
async function googleSignIn(){
 if(authBusy)return;authBusy=true;
 try{
  sessionStorage.setItem("momin-admin-oauth-return","1");
  const {data,error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+"/?mominAdminReturn=1",queryParams:{access_type:"offline",prompt:"select_account"}}});
  if(error)throw error;
  if(data&&data.url)location.href=data.url;
 }catch(e){sessionStorage.removeItem("momin-admin-oauth-return");toast(e.message||"Google sign-in could not start.");}
 finally{authBusy=false}
}
async function forgotPassword(){
 const email=$("demoEmail").value.trim();
 if(!email){toast("Enter your administrator email address first.");$("demoEmail").focus();return}
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/"});
  if(error)throw error;toast("If the account is eligible, a password-reset email has been sent.");
 }catch(e){toast(e.message||"Password reset could not be requested.");}
}
async function signIn(event){
 event.preventDefault();if(authBusy)return;
 authBusy=true;
 const button=$("demoLoginForm").querySelector('button[type="submit"]');button.disabled=true;button.textContent="Signing in…";
 try{
  const {data,error}=await client.auth.signInWithPassword({email:$("demoEmail").value.trim(),password:$("demoPassword").value});
  if(error)throw error;
  session=data.session;await finishAuthentication();
 }catch(e){toast(e.message||"Sign-in failed.");}
 finally{authBusy=false;button.disabled=false;button.textContent="Sign in securely"}
}
async function checkMfa(){
 const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
 if(error)throw error;
 if(data.currentLevel==="aal2")return true;
 const {data:factors,error:factorError}=await client.auth.mfa.listFactors();
 if(factorError)throw factorError;
 const verified=(factors.totp||[]).filter(x=>x.status==="verified");
 if(verified.length){await challengeMfa(verified[0]);return true}
 await enrollMfa();
 return true;
}
async function enrollMfa(){
 const {data,error}=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"MOMIN Admin authenticator"});
 if(error)throw error;
 const factorId=data.id;
 const qr=data.totp&&data.totp.qr_code||"";
 const secret=data.totp&&data.totp.secret||"";
 showMfa("Set up your authenticator","Scan this QR code with Google Authenticator, Microsoft Authenticator, 1Password or another TOTP app, then enter its six-digit code.",'<div class="mfa-qr" style="display:grid;place-items:center;background:#fff;border-radius:14px;padding:12px;margin:20px auto;max-width:230px"><img alt="Authenticator QR code" src="'+esc(qr)+'" style="width:100%;height:auto"></div><div class="card" style="margin-bottom:15px"><div class="eyebrow">MANUAL SETUP KEY</div><strong style="display:block;word-break:break-all;color:var(--gold-hi);margin-top:6px">'+esc(secret)+'</strong><p class="muted tiny" style="margin-top:8px">Keep this key private. Do not share it.</p></div><label class="field-label" for="mfaCode">Six-digit code</label><input class="field-input" id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><p class="muted tiny" id="mfaError"></p><button class="btn btn-primary btn-block" id="verifyMfa">Verify authenticator</button>');
 $("verifyMfa").onclick=async()=>{
  const code=$("mfaCode").value.replace(/\s/g,"");
  if(!/^\d{6}$/.test(code)){$("mfaError").textContent="Enter the current six-digit code.";return}
  $("verifyMfa").disabled=true;
  try{
   const challenge=await client.auth.mfa.challenge({factorId});if(challenge.error)throw challenge.error;
   const verify=await client.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});
   if(verify.error)throw verify.error;
   const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
   if(assurance.error||assurance.data.currentLevel!=="aal2")throw new Error("Authenticator verification did not reach the required security level. Try again.");
   const s=await client.auth.getSession();session=s.data.session;await loadAdminSession();
  }catch(e){$("mfaError").textContent=e.message||"Verification failed.";$("verifyMfa").disabled=false}
 };
 $("mfaCode").focus();
}
async function challengeMfa(factor){
 showMfa("Two-step verification","Enter the current six-digit code from your registered authenticator app.",'<label class="field-label" for="mfaCode">Authenticator code</label><input class="field-input" id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><p class="muted tiny" id="mfaError"></p><button class="btn btn-primary btn-block" id="verifyMfa">Verify and continue</button>');
 $("verifyMfa").onclick=async()=>{
  const value=$("mfaCode").value.replace(/\s/g,"");if(!/^\d{6}$/.test(value)){$("mfaError").textContent="Enter the six-digit code.";return}
  $("verifyMfa").disabled=true;
  try{
   const challenge=await client.auth.mfa.challenge({factorId:factor.id});if(challenge.error)throw challenge.error;
   const verified=await client.auth.mfa.verify({factorId:factor.id,challengeId:challenge.data.id,code:value});if(verified.error)throw verified.error;
   const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
   if(assurance.error||assurance.data.currentLevel!=="aal2")throw new Error("Two-step verification is not complete.");
   const s=await client.auth.getSession();session=s.data.session;await loadAdminSession();
  }catch(e){$("mfaError").textContent=e.message||"Verification failed.";$("verifyMfa").disabled=false}
 };
 $("mfaCode").focus();
}
async function finishAuthentication(){
 const user=session&&session.user;if(!user)throw new Error("No authenticated session was returned.");
 if(!user.email_confirmed_at){await client.auth.signOut({scope:"local"});throw new Error("Verify your email address before accessing Admin.");
 }
 const profile=await client.from("momin_profiles").select("profile_completed").eq("user_id",user.id).maybeSingle();
 if(profile.error)throw profile.error;
 if(!profile.data||profile.data.profile_completed!==true){
  location.replace("/profile-complete.html?next="+encodeURIComponent("/admin/"));return;
 }
 await checkMfa();
 const s=await client.auth.getSession();session=s.data.session;
 await loadAdminSession();
}
async function loadAdminSession(){
 const result=await api("session");
 staff=result.staff;permissions=result.permissions||[];
 hideAuth();renderNavigation();navigate("dashboard");
}
function renderNavigation(){
 document.querySelectorAll(".nav-item").forEach(el=>{
  const p=el.dataset.page;
  const permission=requiredPermissionForPage(p);
  const visible=!permission||hasPermission(permission);
  el.style.display=visible?"flex":"none";
  if(!visible)el.setAttribute("aria-hidden","true");else el.removeAttribute("aria-hidden");
 });
 $("profileMenu").querySelector("strong").textContent=staff.display_name||"Administrator";
 $("profileMenu").querySelector("small").textContent=(staff.role||"staff").replace(/_/g," ");
}
function requiredPermissionForPage(page){
 if(["users","active-users","devices","user-support","suspended"].includes(page))return "users.view";
 if(["notifications","create-notification","templates","scheduled","delivery-reports","announcements"].includes(page))return "notifications.view";
 if(page==="approvals")return "notifications.approve";
 if(page==="audit")return "audit.view";
 return null;
}
function pageMeta(page){
 return titles[page]||["ADMINISTRATION",routes.find(x=>x[0]===page)?.[1]||"Module","This module is part of the MOMIN administration roadmap."];
}
function setPageHeader(page){
 const meta=pageMeta(page);$("pageEyebrow").textContent=meta[0];$("pageTitle").textContent=meta[1];$("pageSubtitle").textContent=meta[2];$("breadcrumbCurrent").textContent=meta[1];
 $("pageActions").innerHTML="";
 if(page==="dashboard"){$("pageActions").innerHTML='<div class="select-wrap"><select id="dateRange"><option>Last 30 days</option><option>Today</option><option>Last 7 days</option><option>Last 90 days</option><option>This year</option></select></div><span class="phase-badge">LIVE DATA</span>'}
 if(page==="users"||page==="active-users"||page==="suspended")$("pageActions").innerHTML='<button class="btn btn-secondary" id="exportUsers">Export CSV</button>';
 if(page==="notifications"||page==="scheduled"||page==="announcements")$("pageActions").innerHTML='<button class="btn btn-primary" id="newNotification">＋ Create Notification</button>';
 if(page==="create-notification")$("pageActions").innerHTML='<button class="btn btn-secondary" id="backNotifications">← Campaigns</button>';
}
function navigate(page){
 if(!routes.some(x=>x[0]===page))page="dashboard";
 currentPage=page;
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 document.querySelectorAll(".nav-group").forEach(g=>{if(g.querySelector('.nav-item.active'))g.classList.remove("collapsed")});
 $("workspace").classList.remove("mobile-nav-open");
 $("quickMenu").classList.add("hidden");
 setPageHeader(page);
 if($("exportUsers"))$("exportUsers").onclick=exportUsersCSV;
 if($("newNotification"))$("newNotification").onclick=()=>navigate("create-notification");
 if($("backNotifications"))$("backNotifications").onclick=()=>navigate("notifications");
 const handlers={
 dashboard:renderDashboard,users:()=>renderUsers("all"),"active-users":()=>renderUsers("active"),
 suspended:()=>renderUsers("suspended"),devices:()=>renderUsers("all",true),
 "user-support":()=>renderUsers("all",true),
 notifications:()=>renderCampaigns("all"),scheduled:()=>renderCampaigns("scheduled"),
 announcements:()=>renderCampaigns("all"),"delivery-reports":()=>renderCampaigns("reports"),
 "create-notification":()=>renderComposer(),templates:()=>renderTemplates(),
 approvals:()=>renderApprovals(),audit:()=>renderAudit(),roles:()=>renderRoles()
 };
 if(handlers[page])handlers[page]().catch(e=>renderError(e));
 else renderPlaceholder(page);
}
function renderError(error){
 $("pageContent").innerHTML='<div class="card"><div class="phase-badge">REQUEST ERROR</div><h3 style="margin:12px 0 6px;color:var(--gold-hi)">Could not load this page</h3><p class="muted">'+esc(error.message||"Unexpected error")+'</p><button class="btn btn-secondary" id="retryPage" style="margin-top:15px">Try again</button></div>';
 $("retryPage").onclick=()=>navigate(currentPage);
}
function renderMetric(label,value,foot,symbol){
 return '<div class="card metric-card"><div class="metric-top"><span>'+esc(label)+'</span>'+icon(symbol)+'</div><span class="metric-value">'+esc(value==null?"—":value)+'</span><div class="metric-foot">'+esc(foot||"From live MOMIN records")+'</div></div>';
}
async function renderDashboard(){
 const r=await api("dashboard"),m=r.metrics||{};
 $("pageContent").innerHTML='<div class="info-callout"><span>●</span><div><strong>Live MOMIN records</strong><br>Dashboard values are taken from the current Supabase records. Activity and engagement analytics are limited to the data currently collected by MOMIN.</div></div>'+
 '<div class="metric-grid">'+
 renderMetric("Registered users",num(m.registered_users),"MOMIN profiles","♙")+
 renderMetric("Verified accounts",num(m.verified_accounts),"Verified email records","✓")+
 renderMetric("Completed profiles",num(m.completed_profiles),"Required onboarding complete","◉")+
 renderMetric("New registrations today",num(m.new_registrations_today),"Created since midnight","＋")+
 renderMetric("Devices active in 24h",num(m.active_devices_24h),"Devices with recent activity","▣")+
 renderMetric("Registered devices",num(m.registered_devices),"All recorded devices","▤")+
 renderMetric("Push-enabled devices",num(m.push_enabled_devices),"Active web push subscriptions","♧")+
 renderMetric("Notification campaigns",num(m.notification_campaigns),"Admin-created campaigns","▤")+
 renderMetric("Push attempts",num(m.notification_attempts),"Existing push delivery records","↗")+
 renderMetric("Provider-accepted pushes",num(m.accepted_pushes),"Not a confirmed device delivery","✓")+
 renderMetric("Push failures",num(m.failed_pushes),"Recorded failed attempts","!")+
 renderMetric("Unread in-app messages",num(m.unread_in_app),"Campaign inbox items","✉")+
 renderMetric("Pending approvals",num(m.pending_approvals),"Items awaiting a decision","◇")+
 '</div><div class="dashboard-grid two"><section class="card"><div class="card-title"><div><h3>Recent registrations</h3><p>Most recent MOMIN profiles</p></div><span class="phase-badge">LIVE</span></div><div class="table-wrap"><table class="audit-table"><thead><tr><th>User</th><th>Provider</th><th>Profile</th><th>Joined</th></tr></thead><tbody>'+
 (r.recent_users||[]).map(u=>'<tr><td>'+esc(u.display_name||"MOMIN user")+'</td><td>'+esc(u.auth_provider||"—")+'</td><td>'+badge(u.profile_completed?"Complete":"Incomplete")+'</td><td>'+fmtDateOnly(u.created_at)+'</td></tr>').join("")+
 '</tbody></table></div><button class="btn btn-secondary" id="viewAllUsers" style="margin-top:13px">Open User Management</button></section><section class="card"><div class="card-title"><div><h3>Quick actions</h3><p>Common founder tasks</p></div></div><div class="feature-list" style="grid-template-columns:1fr 1fr"><button class="feature-tile" data-nav="users"><strong>♙ Find a user</strong><small>Search accounts and devices</small></button><button class="feature-tile" data-nav="create-notification"><strong>♧ Create notification</strong><small>Message opted-in recipients</small></button><button class="feature-tile" data-nav="templates"><strong>▤ Templates</strong><small>Reusable message templates</small></button><button class="feature-tile" data-nav="approvals"><strong>◇ Approvals</strong><small>Review high-impact actions</small></button><button class="feature-tile" data-nav="audit"><strong>≡ Audit logs</strong><small>Review admin activity</small></button><button class="feature-tile" data-nav="roles"><strong>⚿ Permissions</strong><small>Inspect available roles</small></button></div></section></div>';
 $("viewAllUsers").onclick=()=>navigate("users");
 bindPageNavigation();
}
async function renderUsers(status,deviceOnly){
 currentUsersStatus=status||"all";const page=usersPage,perPage=50;
 const r=await api("users.list",{page,per_page:perPage,status:status==="all"?"":status,search:$("userSearch")?.value||""});
 const users=r.users||[];
 $("pageContent").innerHTML='<div class="card"><div class="audit-toolbar"><div class="quick-stat-row"><span class="quick-stat">Users matched <strong>'+num(r.total)+'</strong></span><span class="quick-stat">PII '+(r.pii_masked?"masked":"authorized")+'</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="userSearch" class="filter-input" type="search" placeholder="Search name, email or user ID…" value="'+esc($("userSearch")?.value||"")+'"><select id="userStatus" class="filter-select"><option value="all">All accounts</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="verified">Verified email</option><option value="unverified">Unverified email</option></select><button class="btn btn-secondary" id="refreshUsers">Refresh</button></div></div><div class="table-wrap"><table class="audit-table"><thead><tr><th>User</th><th>Email</th><th>Provider</th><th>Last sign in</th><th>Verified</th><th>Profile</th><th>Devices</th><th>Push devices</th><th>App announcements</th><th>Status</th><th></th></tr></thead><tbody>'+
 (users.length?users.map(u=>'<tr><td><div style="display:flex;align-items:center;gap:8px">'+(u.avatar_url?'<img src="'+esc(u.avatar_url)+'" alt="" style="width:27px;height:27px;border-radius:50%;object-fit:cover">':'<span class="avatar" style="width:27px;height:27px">'+esc((u.display_name||"U").charAt(0).toUpperCase())+'</span>')+'<span><strong>'+esc(u.display_name||"—")+'</strong><div class="muted tiny">'+esc(u.user_id.slice(0,8))+'…</div></span></div></td><td>'+esc(u.email||"Hidden")+'</td><td>'+esc(u.auth_provider||"—")+'</td><td>'+fmtDate(u.last_sign_in_at)+'</td><td>'+badge(u.email_verified?"verified":"unverified")+'</td><td>'+badge(u.profile_completed?"complete":"incomplete")+'</td><td>'+num(u.device_count)+'</td><td>'+num(u.push_device_count)+'</td><td>'+badge(u.announcements_enabled?"opted in":"opted out")+'</td><td>'+badge(u.account_status)+'</td><td><button class="btn btn-secondary btn-small" data-user-detail="'+esc(u.user_id)+'">View</button></td></tr>').join(""):'<tr><td colspan="11"><div class="module-placeholder"><div><div class="placeholder-icon">♙</div><h2>No users found</h2><p>No accounts match the selected filter.</p></div></div></td></tr>')+
 '</tbody></table></div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:13px"><span class="muted tiny">Page '+page+' · Showing '+users.length+' of '+num(r.total)+' accounts</span><div style="display:flex;gap:7px"><button class="btn btn-secondary btn-small" id="usersPrev" '+(page<=1?'disabled':'')+'>Previous</button><button class="btn btn-secondary btn-small" id="usersNext" '+(!r.has_more?'disabled':'')+'>Next</button></div></div></div>';
 const inp=$("userSearch"),sel=$("userStatus");if(sel)sel.value=status||"all";
 if(inp)inp.addEventListener("input",()=>{clearTimeout(userSearchTimer);usersPage=1;userSearchTimer=setTimeout(()=>renderUsers(sel.value,deviceOnly).catch(renderError),350)});
 if(sel)sel.addEventListener("change",()=>{usersPage=1;renderUsers(sel.value,deviceOnly).catch(renderError)});
 $("refreshUsers").onclick=()=>renderUsers(sel.value,deviceOnly);
 $("usersPrev").onclick=()=>{if(usersPage>1){usersPage--;renderUsers(sel.value,deviceOnly).catch(renderError)}};
 $("usersNext").onclick=()=>{if(r.has_more){usersPage++;renderUsers(sel.value,deviceOnly).catch(renderError)}};
 $("pageContent").querySelectorAll("[data-user-detail]").forEach(b=>b.addEventListener("click",()=>renderUserDetail(b.dataset.userDetail)));
}
async function exportUsersCSV(){
 try{
  const query=$("userSearch")?.value||"";
  const status=$("userStatus")?.value||currentUsersStatus;
  const data=await api("users.list",{page:usersPage,per_page:100,search:query,status:status==="all"?"":status});
  const fields=["user_id","display_name","email","auth_provider","email_verified","profile_completed","last_sign_in_at","account_status","device_count","push_device_count","announcements_enabled"];
  const rows=[fields.join(",")].concat((data.users||[]).map(row=>fields.map(k=>'"'+String(row[k]??"").replace(/"/g,'""')+'"').join(",")));
  const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="momin-users-page-"+usersPage+".csv";link.click();URL.revokeObjectURL(link.href);
  toast("CSV export downloaded for the current filtered page.");
 }catch(e){toast(e.message||"Export failed")}
}
async function renderUserDetail(userId){
 const r=await api("users.detail",{user_id:userId}),u=r.user||{};
 const profile=u.profile||{};
 const devices=r.devices||[],push=r.push_devices||[];
 showModal(u.display_name||"User details",'<div class="quick-stat-row"><span class="quick-stat">Account '+badge(u.account_status)+'</span><span class="quick-stat">Provider <strong>'+esc(u.provider||"—")+'</strong></span></div><div class="section-grid" style="margin-top:14px"><div><div class="eyebrow">EMAIL</div><p>'+esc(u.email||"Hidden")+'</p></div><div><div class="eyebrow">EMAIL VERIFIED</div><p>'+badge(u.email_verified?"Yes":"No")+'</p></div><div><div class="eyebrow">CREATED</div><p>'+fmtDate(u.created_at)+'</p></div><div><div class="eyebrow">LAST SIGN IN</div><p>'+fmtDate(u.last_sign_in_at)+'</p></div><div><div class="eyebrow">PROFILE</div><p>'+badge(profile.profile_completed?"Complete":"Incomplete")+'</p></div></div><div class="eyebrow" style="margin-top:18px">REGISTERED DEVICES</div><div class="table-wrap"><table class="audit-table"><thead><tr><th>Device</th><th>Last active</th><th>Status</th><th></th></tr></thead><tbody>'+devices.map(d=>'<tr><td>'+esc(d.device_name||"Device")+'</td><td>'+fmtDate(d.last_seen_at)+'</td><td>'+badge(d.revoked_at?"revoked":"active")+'</td><td>'+(d.revoked_at?"":'<button class="btn btn-danger btn-small" data-revoke-device="'+esc(d.id)+'">Revoke</button>')+'</td></tr>').join("")+'</tbody></table></div><div class="eyebrow" style="margin-top:18px">PUSH DEVICES</div><div class="table-wrap"><table class="audit-table"><thead><tr><th>Device</th><th>Push</th><th>App announcements</th><th>Last accepted</th></tr></thead><tbody>'+push.map(p=>'<tr><td>'+esc(p.device_name||"Device")+'</td><td>'+badge(p.is_active?"active":"inactive")+'</td><td>'+badge(p.announcements?"opted in":"not opted in")+'</td><td>'+fmtDate(p.last_successful_push_at)+'</td></tr>').join("")+'</tbody></table></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px"><button class="btn btn-secondary" id="notifyThisUser">Send notification</button><button class="btn btn-danger" id="suspendThisUser">'+(u.account_status==="suspended"?"Reactivate account":"Suspend account")+'</button></div><p class="muted tiny" style="margin-top:10px">Actions are permission-checked on the server and audit-logged. PII visibility depends on your role.</p>','Close',null);
 $("notifyThisUser").onclick=()=>{closeModal();selectedUsers=[{id:userId,name:u.display_name||u.email||userId}];navigate("create-notification")};
 $("suspendThisUser").onclick=()=>confirmUserStatus(userId,u.account_status!=="suspended");
 $("modalBody").querySelectorAll("[data-revoke-device]").forEach(b=>b.onclick=async()=>{
   const id=b.dataset.revokeDevice;
   showModal("Revoke device","<p>Revoke this MOMIN device and deactivate its push subscription? The device will be signed out when it next contacts MOMIN.</p><label class='field-label' for='revokeReason'>Reason</label><input id='revokeReason' class='field-input' maxlength='250' placeholder='Reason for revoking this device'>","Revoke device",async()=>{
     const reason=$("revokeReason").value.trim();if(reason.length<3)throw new Error("Enter a reason.");
     await api("users.revoke_device",{device_id:id,reason});toast("Device revoked.");closeModal();renderUserDetail(userId);
   });
 });
}
function confirmUserStatus(userId,suspend){
 showModal(suspend?"Suspend user account":"Reactivate user account",'<p>'+(suspend?"This user will be blocked from signing in. Their existing sessions may remain until token expiry; the device and push records should also be revoked.":"This user will be able to sign in again.")+'</p><label class="field-label" for="userReason">Reason (required)</label><textarea id="userReason" class="field-input" rows="3" placeholder="Enter the reason for this action"></textarea><p class="muted tiny">This action is recorded in the administrative audit log.</p>',suspend?"Suspend account":"Reactivate",async()=>{
  const reason=$("userReason").value.trim();if(reason.length<3)throw new Error("Enter a reason of at least three characters.");
  await api(suspend?"users.suspend":"users.reactivate",{user_id:userId,reason});toast(suspend?"Account suspended.":"Account reactivated.");closeModal();renderUserDetail(userId);
 });
}
async function renderCampaigns(mode){
 const r=await api("notifications.campaigns"),items=r.campaigns||[];
 const filtered=mode==="scheduled"?items.filter(x=>x.status==="scheduled"||x.status==="processing"||x.status==="awaiting_approval"):mode==="reports"?items.filter(x=>["sent","partially_sent","failed","processing"].includes(x.status)):items;
 $("pageContent").innerHTML='<div class="section-grid"><div class="card"><div class="card-title"><div><h3>Campaign overview</h3><p>Database-backed notification campaigns</p></div>'+badge("live records")+'</div><div class="quick-stat-row"><span class="quick-stat">Total <strong>'+num(items.length)+'</strong></span><span class="quick-stat">Scheduled <strong>'+num(items.filter(x=>x.status==="scheduled").length)+'</strong></span><span class="quick-stat">Sent <strong>'+num(items.filter(x=>x.status==="sent").length)+'</strong></span></div></div><div class="card"><div class="card-title"><div><h3>Recipient policy</h3><p>App Announcements is opt-in and separate from prayer reminders.</p></div>'+badge("opt-in only")+'</div><p class="muted tiny">Campaigns target users who explicitly enabled App Announcements. They do not target inferred worship or other sensitive behaviour.</p></div></div><div class="card" style="margin-top:14px"><div class="card-title"><div><h3>'+ (mode==="scheduled"?"Scheduled campaigns":mode==="reports"?"Campaign delivery reports":"Recent campaigns")+'</h3><p>Images, routes, channels and outcomes</p></div><button class="btn btn-primary" id="createCampaign">＋ Create Notification</button></div><div class="table-wrap"><table class="audit-table"><thead><tr><th>Campaign</th><th>Audience</th><th>Channel</th><th>Schedule</th><th>Recipients</th><th>Accepted</th><th>Failed</th><th>Status</th><th></th></tr></thead><tbody>'+
 (filtered.length?filtered.map(x=>'<tr><td><strong>'+esc(x.title)+'</strong><div class="muted tiny">'+esc(x.campaign_name||"")+'</div></td><td>'+esc(x.audience_type||"all")+'</td><td>'+esc(x.channel||"—")+'</td><td>'+fmtDate(x.scheduled_at)+'</td><td>'+num(x.recipient_count)+'</td><td>'+num(x.accepted_count)+'</td><td>'+num(x.failed_count)+'</td><td>'+badge(x.status)+'</td><td><button class="btn btn-secondary btn-small" data-campaign-report="'+esc(x.id)+'">Report</button>'+(["draft","scheduled","awaiting_approval"].includes(x.status)?' <button class="btn btn-danger btn-small" data-cancel-campaign="'+esc(x.id)+'">Cancel</button>':"")+'</td></tr>').join(""):'<tr><td colspan="9"><div class="module-placeholder"><div><div class="placeholder-icon">♧</div><h2>No campaigns yet</h2><p>Compose a notification, select an opted-in audience and save it as a draft.</p></div></div></td></tr>')+
 '</tbody></table></div></div>';
 $("createCampaign").onclick=()=>navigate("create-notification");
 $("pageContent").querySelectorAll("[data-campaign-report]").forEach(b=>b.onclick=()=>renderCampaignReport(b.dataset.campaignReport));
 $("pageContent").querySelectorAll("[data-cancel-campaign]").forEach(b=>b.onclick=()=>showModal("Cancel campaign","<p>Cancel this draft or scheduled campaign? The scheduler will no longer process it.</p>","Cancel campaign",async()=>{await api("notifications.cancel",{campaign_id:b.dataset.cancelCampaign});toast("Campaign cancelled.");closeModal();renderCampaigns(mode)}));
}
function selectedAudiencePayload(){
 const type=$("audienceType").value,filter={};
 if(type==="individual"||type==="selected")filter.user_ids=selectedUsers.map(x=>x.id);
 if(type==="country")filter.countries=($("audienceCountries").value||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(type==="recent")filter.days=Number($("recentDays").value)||7;
 if(type==="device_type")filter.device_type=$("deviceType").value;
 return {type,filter};
}
function renderSelectedUsers(){
 const wrap=$("selectedUserChips");if(!wrap)return;
 wrap.innerHTML=selectedUsers.map((u,i)=>'<span class="chip">'+esc(u.name||u.id)+' <button type="button" data-remove-user="'+i+'" aria-label="Remove recipient">×</button></span>').join("");
 wrap.querySelectorAll("[data-remove-user]").forEach(b=>b.onclick=()=>{selectedUsers.splice(Number(b.dataset.removeUser),1);renderSelectedUsers()});
}
async function searchRecipients(term){
 if(term.trim().length<2){$("recipientMatches").innerHTML="";return}
 const r=await api("users.list",{page:1,per_page:50,search:term,status:"all"});
 $("recipientMatches").innerHTML=(r.users||[]).slice(0,10).map(u=>'<button type="button" class="search-result" data-add-user="'+esc(u.user_id)+'" data-name="'+esc(u.display_name||u.email||u.user_id)+'"><span class="avatar">'+esc((u.display_name||"U").charAt(0).toUpperCase())+'</span><span>'+esc(u.display_name||"MOMIN user")+'</span><small>'+esc(u.email||"Hidden")+'</small></button>').join("")||'<p class="muted tiny">No users found.</p>';
 $("recipientMatches").querySelectorAll("[data-add-user]").forEach(b=>b.onclick=()=>{
  const id=b.dataset.addUser;if(!selectedUsers.some(x=>x.id===id))selectedUsers.push({id,name:b.dataset.name});
  renderSelectedUsers();$("recipientSearch").value="";$("recipientMatches").innerHTML="";
 });
}
function composerMarkup(){
 return '<div class="info-callout"><span>ⓘ</span><div><strong>App Announcements opt-in</strong><br>Only users who explicitly enable App Announcements in MOMIN Settings are eligible. This does not modify prayer reminders or target sensitive personal behaviour.</div></div>'+
 '<div class="section-grid composer-grid"><section class="card"><div class="card-title"><div><h3>1. Audience and delivery</h3><p>Choose who can receive the message.</p></div></div>'+
 '<label class="field-label" for="audienceType">Audience</label><select id="audienceType" class="field-input"><option value="all">All opted-in users</option><option value="individual">One individual user</option><option value="selected">Selected users</option><option value="country">Selected countries</option><option value="recent">Recently registered users</option><option value="push_enabled">Push-enabled devices</option><option value="device_type">Device type</option></select>'+
 '<div id="recipientSelector" class="hidden"><label class="field-label" for="recipientSearch">Find a user by name, email or ID</label><input id="recipientSearch" class="field-input" placeholder="Start typing…"><div id="recipientMatches" class="search-results"></div><div id="selectedUserChips" class="chip-row"></div></div>'+
 '<div id="countrySelector" class="hidden"><label class="field-label" for="audienceCountries">Countries (comma separated)</label><input id="audienceCountries" class="field-input" placeholder="India, UAE"><p class="muted tiny">Country targeting uses the location associated with the push-enabled device and opt-in profile.</p></div>'+
 '<div id="recentSelector" class="hidden"><label class="field-label" for="recentDays">Registered in last (days)</label><input id="recentDays" class="field-input" type="number" min="1" max="365" value="7"></div><div id="deviceTypeSelector" class="hidden"><label class="field-label" for="deviceType">Registered device type</label><select id="deviceType" class="field-input"><option value="android">Android</option><option value="ios">iPhone / iPad</option><option value="web">Desktop / Web</option></select></div><p class="muted tiny">Language targeting is not available yet because MOMIN does not currently store a reliable account language field.</p>'+
 '<label class="field-label" for="channel">Delivery channel</label><select id="channel" class="field-input"><option value="push_and_in_app">Push + In-app inbox</option><option value="in_app">In-app inbox only</option><option value="push">Push only</option></select>'+
 '<label class="field-label" for="priority">Priority</label><select id="priority" class="field-input"><option value="normal">Normal</option><option value="high">High</option></select>'+
 '<label class="field-label" for="expiresAt">Optional expiry</label><input id="expiresAt" class="field-input" type="datetime-local">'+
 '</section><section class="card"><div class="card-title"><div><h3>2. Message content</h3><p>Title, message and optional image.</p></div></div>'+
 '<label class="field-label" for="campaignName">Campaign name</label><input id="campaignName" class="field-input" maxlength="100" placeholder="Example: Jumu’ah announcement">'+
 '<label class="field-label" for="messageTitle">Notification title <span class="muted">(max 60)</span></label><input id="messageTitle" class="field-input" maxlength="60" placeholder="Assalamu Alaikum">'+
 '<label class="field-label" for="messageBody">Message <span class="muted">(max 180)</span></label><textarea id="messageBody" class="field-input" rows="4" maxlength="180" placeholder="Write a clear, helpful message…"></textarea><div class="muted tiny" id="messageCounter">0 / 180</div>'+
 '<label class="field-label" for="messageImage">Image / banner (JPG, PNG, WebP · max 2 MB)</label><input id="messageImage" class="field-input" type="file" accept="image/jpeg,image/png,image/webp"><div id="imagePreview" class="image-preview hidden"></div><p id="imageStatus" class="muted tiny">Images are stored in the MOMIN notification media bucket.</p>'+
 '<label class="field-label" for="destination">Open destination when tapped</label><select id="destination" class="field-input"><option value="home">Home</option><option value="prayers">Prayer Times</option><option value="quran">Quran</option><option value="duas">Duas</option><option value="calendar">Islamic Calendar</option><option value="notifications">Notifications</option><option value="journey">Journey</option><option value="giving">Giving</option></select>'+
 '<label class="field-label" for="actionLabel">Optional action label</label><input id="actionLabel" class="field-input" maxlength="40" placeholder="Read more">'+
 '</section></div><section class="card" style="margin-top:14px"><div class="card-title"><div><h3>3. Schedule and preview</h3><p>Review the message before submitting.</p></div><span class="phase-badge">NO AUTO-SEND</span></div><div class="section-grid"><div><label class="field-label" for="scheduleAt">Send date and time</label><input id="scheduleAt" class="field-input" type="datetime-local"><p class="muted tiny">The scheduler processes due campaigns once per minute. “Send now” queues for the next scheduler run.</p><div class="quick-stat-row"><span class="quick-stat">Eligible audience <strong id="audienceEstimate">Not estimated</strong></span></div></div><div class="notification-preview"><div class="eyebrow">MOBILE PREVIEW</div><div class="phone-preview"><div class="phone-top">MOMIN · now</div><div id="previewImage" class="phone-image hidden"></div><strong id="previewTitle">Notification title</strong><p id="previewBody">Your message preview will appear here.</p><span class="phone-route" id="previewRoute">Home</span></div></div></div></section>'+
 '<div class="composer-actions"><button class="btn btn-secondary" id="backCampaigns">Cancel</button><button class="btn btn-secondary" id="testMyDevice">Test to my device</button><button class="btn btn-secondary" id="saveNotificationDraft">Save draft</button><button class="btn btn-primary" id="scheduleNotification">Review audience & schedule</button></div>';
}
function renderComposer(){
 selectedUsers=selectedUsers||[];uploadedImage=null;campaignId=null;
 $("pageContent").innerHTML=composerMarkup();
 $("backCampaigns").onclick=()=>navigate("notifications");
 $("audienceType").onchange=()=>{const t=$("audienceType").value;$("recipientSelector").classList.toggle("hidden",!["individual","selected"].includes(t));$("countrySelector").classList.toggle("hidden",t!=="country");$("recentSelector").classList.toggle("hidden",t!=="recent");$("deviceTypeSelector").classList.toggle("hidden",t!=="device_type");$("audienceEstimate").textContent="Not estimated";};
 $("recipientSearch").addEventListener("input",()=>{clearTimeout(userSearchTimer);userSearchTimer=setTimeout(()=>searchRecipients($("recipientSearch").value).catch(e=>toast(e.message)),350)});
 $("messageBody").addEventListener("input",()=>{$("messageCounter").textContent=$("messageBody").value.length+" / 180";$("previewBody").textContent=$("messageBody").value||"Your message preview will appear here."});
 $("messageTitle").addEventListener("input",()=>{$("previewTitle").textContent=$("messageTitle").value||"Notification title";$("campaignName").placeholder=$("messageTitle").value||"Campaign name"});
 $("destination").onchange=()=>{$("previewRoute").textContent=$("destination").selectedOptions[0].textContent};
 $("messageImage").onchange=async()=>{
  const file=$("messageImage").files&&$("messageImage").files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){toast("Choose a JPG, PNG or WebP image no larger than 2 MB.");$("messageImage").value="";return}
  const reader=new FileReader();reader.onload=()=>{$("imagePreview").classList.remove("hidden");$("imagePreview").innerHTML='<img src="'+reader.result+'" alt="Notification image preview">';$("previewImage").classList.remove("hidden");$("previewImage").style.backgroundImage='url("'+reader.result+'")'};
  reader.readAsDataURL(file);
  $("imageStatus").textContent="Uploading image securely…";
  const data=await fileToBase64(file);
  try{uploadedImage=await api("notifications.upload_image",{mime_type:file.type,base64:data});$("imageStatus").textContent="Image uploaded. It will be included in the notification."}
  catch(e){uploadedImage=null;$("imageStatus").textContent=e.message;toast(e.message)}
 };
 $("saveNotificationDraft").onclick=()=>saveDraft(false).catch(e=>toast(e.message));
 $("scheduleNotification").onclick=()=>saveDraft(true).catch(e=>toast(e.message));
 $("testMyDevice").onclick=async()=>{
  const key=localStorage.getItem("momin-device-key-v1");
  if(!key){toast("Open MOMIN on this device and enable background notifications first.");return}
  const button=$("testMyDevice");button.disabled=true;
  try{
   const result=await client.functions.invoke("momin-push-register",{body:{action:"test",device_key:key}});
   if(result.error)throw result.error;
   if(result.data&&result.data.error)throw new Error(result.data.error);
   toast("A test push was sent to this device.");
  }catch(e){toast(e.message||"Test push failed. Enable push notifications on this device in MOMIN first.")}
  finally{button.disabled=false}
 };
 $("campaignName").value="";$("messageTitle").value="";$("messageBody").value="";
 if(selectedUsers.length){$("audienceType").value=selectedUsers.length===1?"individual":"selected";$("recipientSelector").classList.remove("hidden");renderSelectedUsers()}
 const two=new Date(Date.now()+2*60000);$("scheduleAt").value=two.getFullYear()+"-"+String(two.getMonth()+1).padStart(2,"0")+"-"+String(two.getDate()).padStart(2,"0")+"T"+String(two.getHours()).padStart(2,"0")+":"+String(two.getMinutes()).padStart(2,"0");
}
function fileToBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");reader.onerror=()=>reject(new Error("Could not read the image."));reader.readAsDataURL(file)})}
async function saveDraft(schedule){
 const title=$("messageTitle").value.trim(),body=$("messageBody").value.trim();
 if(title.length<1||body.length<1)throw new Error("Enter a notification title and message.");
 const audience=selectedAudiencePayload();
 if(["individual","selected"].includes(audience.type)&&!audience.filter.user_ids.length)throw new Error("Select at least one user.");
 if(audience.type==="individual"&&audience.filter.user_ids.length!==1)throw new Error("Choose exactly one user for an individual notification.");
 const scheduledValue=$("scheduleAt").value;if(schedule&&!scheduledValue)throw new Error("Select the schedule date and time.");
 const scheduledAt=scheduledValue?new Date(scheduledValue).toISOString():null;
 if(schedule&&new Date(scheduledAt).getTime()<Date.now()-30000)throw new Error("Choose a future schedule time.");
 const payload={
  campaign_name:$("campaignName").value.trim()||title,title,message:body,
  image_url:uploadedImage&&uploadedImage.image_url||null,image_path:uploadedImage&&uploadedImage.path||null,
  route:$("destination").value,action_label:$("actionLabel").value.trim()||null,
  audience_type:audience.type,audience_filter:audience.filter,channel:$("channel").value,
  priority:$("priority").value,scheduled_at:scheduledAt,
  timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Kolkata"
 };
 const saved=await api("notifications.save_draft",payload);campaignId=saved.campaign_id;
 if(!schedule){toast("Notification draft saved.");navigate("notifications");return}
 const estimate=await api("notifications.estimate",{audience_type:audience.type,audience_filter:audience.filter});
 $("audienceEstimate").textContent=num(estimate.eligible_users)+" opted-in users";
 showModal("Confirm notification schedule",'<div class="info-callout"><span>!</span><div><strong>'+num(estimate.eligible_users)+' eligible users</strong><br>Only users who opted into App Announcements will be included. No message is sent until its scheduled time.</div></div><p><strong>'+esc(title)+'</strong></p><p class="muted">'+esc(body)+'</p><p class="muted tiny">Scheduled for '+fmtDate(scheduledAt)+' · Channel: '+esc(payload.channel)+'</p><label class="field-label" for="sendConfirm">Type SCHEDULE to confirm</label><input class="field-input" id="sendConfirm" placeholder="SCHEDULE">',"Schedule campaign",async()=>{
  if($("sendConfirm").value.trim()!=="SCHEDULE")throw new Error("Type SCHEDULE to confirm.");
  const result=await api("notifications.send_or_schedule",{campaign_id:campaignId,scheduled_at:scheduledAt});
  toast(result.status==="awaiting_approval"?"Campaign submitted for approval.":"Campaign scheduled for "+fmtDate(result.scheduled_at));
  closeModal();selectedUsers=[];navigate("scheduled");
 });
}
function renderSelectedPlaceholder(){}
async function renderTemplates(){
 const r=await api("notifications.templates"),templates=r.templates||[];
 $("pageContent").innerHTML='<div class="card"><div class="card-title"><div><h3>Notification templates</h3><p>Reusable starting points for communications.</p></div><button id="newTemplate" class="btn btn-primary">＋ New template</button></div><div class="section-grid">'+(templates.length?templates.map(t=>'<div class="card"><div class="card-title"><h3>'+esc(t.name)+'</h3>'+badge(t.category)+'</div><strong>'+esc(t.title)+'</strong><p class="muted tiny">'+esc(t.body)+'</p><button class="btn btn-secondary btn-small" data-use-template="'+esc(t.id)+'">Use template</button></div>').join(""):'<div class="module-placeholder"><div><div class="placeholder-icon">▤</div><h2>No templates yet</h2><p>Create reusable approved message templates for announcements and campaigns.</p></div></div>')+'</div></div>';
 $("newTemplate").onclick=()=>showModal("Create notification template",'<label class="field-label" for="tplName">Template name</label><input id="tplName" class="field-input" maxlength="80"><label class="field-label" for="tplCategory">Category</label><input id="tplCategory" class="field-input" maxlength="50" value="General"><label class="field-label" for="tplTitle">Title</label><input id="tplTitle" class="field-input" maxlength="60"><label class="field-label" for="tplBody">Message</label><textarea id="tplBody" class="field-input" maxlength="180" rows="3"></textarea><label class="field-label" for="tplRoute">Destination</label><select id="tplRoute" class="field-input"><option value="home">Home</option><option value="giving">Giving</option><option value="notifications">Notifications</option><option value="quran">Quran</option></select>',"Save template",async()=>{
  const r=await api("notifications.templates.create",{name:$("tplName").value,category:$("tplCategory").value,title:$("tplTitle").value,message:$("tplBody").value,route:$("tplRoute").value});
  toast("Template created.");closeModal();renderTemplates();
 });
 $("pageContent").querySelectorAll("[data-use-template]").forEach(b=>b.onclick=()=>{const t=templates.find(x=>x.id===b.dataset.useTemplate);if(!t)return;selectedUsers=[];navigate("create-notification");setTimeout(()=>{$("campaignName").value=t.name;$("messageTitle").value=t.title;$("messageBody").value=t.body;$("previewTitle").textContent=t.title;$("previewBody").textContent=t.body;$("destination").value=t.route||"home";},100)});
}
async function renderCampaignReport(id){
 const r=await api("notifications.report",{campaign_id:id}),c=r.campaign||{},rows=r.recipients||[];
 showModal("Campaign delivery report",'<div class="quick-stat-row"><span class="quick-stat">Recipients <strong>'+num(c.recipient_count)+'</strong></span><span class="quick-stat">In-app / user outcomes <strong>'+num(c.accepted_count)+'</strong></span><span class="quick-stat">Unsuccessful recipients <strong>'+num(c.failed_count)+'</strong></span><span class="quick-stat">Push accepted <strong>'+num((r.push_deliveries||[]).filter(x=>x.status==="accepted").length)+'</strong></span><span class="quick-stat">Push failed <strong>'+num((r.push_deliveries||[]).filter(x=>x.status==="failed").length)+'</strong></span></div><p style="margin:13px 0">'+badge(c.status)+' &nbsp; '+esc(c.title||"Campaign")+'</p><div class="table-wrap"><table class="audit-table"><thead><tr><th>User reference</th><th>Outcome</th><th>Time</th></tr></thead><tbody>'+rows.slice(0,100).map(x=>'<tr><td>'+esc(x.user_id.slice(0,8))+'…</td><td>'+badge(x.status)+'</td><td>'+fmtDate(x.created_at)+'</td></tr>').join("")+'</tbody></table></div><p class="muted tiny">Push “accepted” means the push provider accepted the request; it does not confirm the alert appeared on the device. In-app inbox creation is recorded separately.</p>',"Close",null);
}
async function renderApprovals(){
 const r=await api("approvals.list"),items=r.approvals||[];
 $("pageContent").innerHTML='<div class="card"><div class="card-title"><div><h3>Pending approvals</h3><p>A requester cannot approve their own action.</p></div>'+badge("two-person review")+'</div>'+(items.length?items.map(x=>'<div class="card" style="margin:12px 0"><div class="card-title"><div><h3>'+esc(x.request_summary)+'</h3><p>'+fmtDate(x.created_at)+' · Requested by '+esc(x.requested_by.slice(0,8))+'…</p></div>'+badge(x.risk_level)+'</div><div class="quick-stat-row"><span class="quick-stat">Type <strong>'+esc(x.request_type)+'</strong></span><span class="quick-stat">Status <strong>'+esc(x.status)+'</strong></span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:13px"><button class="btn btn-success" data-approval="'+esc(x.id)+'" data-decision="approved">Approve</button><button class="btn btn-secondary" data-approval="'+esc(x.id)+'" data-decision="changes_requested">Request changes</button><button class="btn btn-danger" data-approval="'+esc(x.id)+'" data-decision="rejected">Reject</button></div></div>').join(""):'<div class="module-placeholder"><div><div class="placeholder-icon">◇</div><h2>No pending approvals</h2><p>Large notification broadcasts and other sensitive actions will appear here.</p></div></div>')+'</div>';
 $("pageContent").querySelectorAll("[data-approval]").forEach(b=>b.onclick=()=>showModal("Record approval decision",'<label class="field-label" for="approvalNote">Decision note (required)</label><textarea id="approvalNote" class="field-input" rows="3" placeholder="Explain your decision"></textarea>',"Confirm decision",async()=>{
  const note=$("approvalNote").value.trim();if(note.length<3)throw new Error("Add a decision note.");
  await api("approvals.decide",{approval_id:b.dataset.approval,decision:b.dataset.decision,note});
  toast("Approval decision recorded.");closeModal();renderApprovals();
 }));
}
async function renderAudit(){
 const r=await api("audit.list",{limit:100}),rows=r.entries||[];
 $("pageContent").innerHTML='<div class="card"><div class="card-title"><div><h3>Administrative audit trail</h3><p>Append-only administrative records.</p></div>'+badge("immutable log")+'</div><div class="table-wrap"><table class="audit-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Outcome</th><th>Details</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+fmtDate(x.created_at)+'</td><td>'+esc((x.actor_id||"System").slice(0,8))+'…</td><td>'+esc(x.action)+'</td><td>'+esc(x.target_type)+(x.target_id?" · "+esc(x.target_id.slice(0,8))+"…":"")+'</td><td>'+badge(x.outcome)+'</td><td><button class="btn btn-secondary btn-small" data-audit-detail="'+esc(x.id)+'">View</button></td></tr>').join("")+'</tbody></table></div></div>';
 $("pageContent").querySelectorAll("[data-audit-detail]").forEach(b=>b.onclick=()=>{const x=rows.find(x=>x.id===b.dataset.auditDetail);showModal("Audit event",'<pre style="white-space:pre-wrap;word-break:break-word;color:var(--text-2);font-size:11px">'+esc(JSON.stringify(x,null,2))+'</pre>',"Close",null)});
}
function renderRoles(){
 const roles=["Founder / Super Admin","System Administrator","User Manager","Notification Manager","Giving Manager","Finance Manager","Islamic Scholar / Reviewer","Content Editor","Support Agent","Analyst / Read-only"];
 const perms=["Dashboard","View users","View full PII","Suspend users","View notifications","Create notifications","Send notifications","Approve broadcasts","View audit logs"];
 const rows=[["Founder","✓","✓","✓","✓","✓","✓","✓","✓","✓"],["System Admin","✓","✓","✓","✓","✓","✓","✓","—","✓"],["User Manager","✓","✓","✓","✓","—","—","—","—","—"],["Notification Manager","✓","—","—","—","✓","✓","✓","—","—"],["Giving Manager","✓","—","—","—","—","—","—","—","—"],["Finance Manager","✓","—","—","—","—","—","—","—","—"],["Scholar","✓","—","—","—","—","—","—","✓","—"],["Content Editor","✓","—","—","—","—","—","—","—","—"],["Support Agent","✓","—","—","—","—","—","—","—","—"],["Analyst","✓","—","—","—","—","—","—","—","—"]];
 $("pageContent").innerHTML='<div class="info-callout"><span>⚿</span><div><strong>Server-enforced roles</strong><br>The permission model is evaluated inside the Supabase Edge Function. Hiding a page in the browser is not the security boundary.</div></div><div class="card"><div class="card-title"><div><h3>Role catalogue</h3><p>Roles currently defined for MOMIN administration.</p></div></div><div class="feature-list">'+roles.map((x,i)=>'<div class="feature-tile"><strong>'+esc(x)+'</strong><small>'+(i===0?"Full Founder access":i===3?"Notification drafting and sending":"Permissions scoped to assigned duties")+'</small></div>').join("")+'</div></div><div class="card" style="margin-top:14px"><div class="card-title"><div><h3>Permission comparison</h3><p>Current Phase 2 permissions are shown; additional modules are staged for later phases.</p></div></div><div class="table-wrap"><table class="role-table"><thead><tr><th>Role</th>'+perms.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>'<td class="'+(i===0?"":x==="✓"?"permission-yes":"permission-no")+'">'+esc(x)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div><p class="muted tiny" style="margin-top:10px">The final per-role permission matrix is being expanded alongside Giving, Content and Finance modules.</p></div>';
}
function renderPlaceholder(page){
 const name=routes.find(x=>x[0]===page)?.[1]||"Module";
 $("pageContent").innerHTML='<div class="card module-placeholder"><div><div class="placeholder-icon">✧</div><span class="phase-badge">PLANNED PHASE</span><h2>'+esc(name)+'</h2><p>This module is included in your approved MOMIN Admin roadmap. It will be connected in its scheduled development phase. It is not represented as a working production control yet.</p><button class="btn btn-secondary" data-nav="dashboard">Return to Dashboard</button></div></div>';
 bindPageNavigation();
}
function bindPageNavigation(){
 $("pageContent").querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
}
function renderNavigationEvents(){
 document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
 document.querySelectorAll(".nav-group-toggle").forEach(b=>b.addEventListener("click",()=>{const g=b.closest(".nav-group");g.classList.toggle("collapsed");b.setAttribute("aria-expanded",String(!g.classList.contains("collapsed")))}));
 $("collapseSidebar").onclick=()=>$("workspace").classList.toggle("sidebar-collapsed");
 $("desktopMenu").onclick=()=>$("workspace").classList.toggle("sidebar-collapsed");
 $("mobileMenu").onclick=()=>$("workspace").classList.toggle("mobile-nav-open");
 $("sidebarScrim").onclick=()=>$("workspace").classList.remove("mobile-nav-open");
 $("quickCreate").onclick=()=>$("quickMenu").classList.toggle("hidden");
 $("quickMenu").querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>{const q=b.dataset.quick;navigate(q==="Notification"?"create-notification":q==="Staff invitation"?"staff":q==="Content"?"content":q==="Announcement"?"announcements":"create-campaign")});
 $("globalSearchButton").onclick=openSearch;
 $("adminBell").onclick=()=>navigate("approvals");
 $("profileMenu").onclick=()=>showModal("Administrator session",'<p><strong>'+esc(staff.display_name||"MOMIN Admin")+'</strong></p><p class="muted">'+esc(staff.role)+'</p><p class="muted tiny">Your access is protected by Supabase authentication and two-step verification.</p>',"Sign out",async()=>{await client.auth.signOut({scope:"local"});session=null;staff=null;permissions=[];closeModal();showLogin("You have signed out of MOMIN Admin.")});
 document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add("hidden"));
 $("modalOverlay").addEventListener("click",e=>{if(e.target===$("modalOverlay"))closeModal()});
 $("togglePassword").onclick=()=>{$("demoPassword").type=$("demoPassword").type==="password"?"text":"password"};
 $("demoLoginForm").addEventListener("submit",signIn);
 $("mfaBackDashboard").onclick=()=>loadAdminSession().catch(renderError);
 $("quickCreate").setAttribute("aria-haspopup","menu");
 document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
  if(e.key==="Escape"){closeModal();$("searchOverlay").classList.add("hidden");$("quickMenu").classList.add("hidden")}
 });
 $("globalSearchInput").addEventListener("input",renderSearchResults);
 $("globalSearchInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&searchItems[searchIndex]){e.preventDefault();navigate(searchItems[searchIndex][0]);$("searchOverlay").classList.add("hidden")}});
 $("dateRange")?.addEventListener("change",()=>toast("Dashboard dates: "+$("dateRange").value));
}
function openSearch(){$("searchOverlay").classList.remove("hidden");$("globalSearchInput").value="";renderSearchResults();$("globalSearchInput").focus()}
function renderSearchResults(){
 const q=$("globalSearchInput").value.toLowerCase().trim();
 searchItems=routes.filter(x=>x[1].toLowerCase().includes(q)||x[0].includes(q));
 searchIndex=0;
 $("searchResults").innerHTML=searchItems.slice(0,20).map((x,i)=>'<button class="search-result '+(i===0?"selected":"")+'" data-search-nav="'+esc(x[0])+'"><span>⌁</span>'+esc(x[1])+'<small>'+esc(pageMeta(x[0])[0])+'</small></button>').join("")||'<p class="muted tiny">No pages match this search.</p>';
 $("searchResults").querySelectorAll("[data-search-nav]").forEach(b=>b.onclick=()=>{$("searchOverlay").classList.add("hidden");navigate(b.dataset.searchNav)});
}
function renderErrorPage(e){console.error(e);renderError(e)}
async function start(){
 if(!window.supabase||!window.supabase.createClient){showLogin("The secure sign-in library could not load. Refresh this page and try again.");return}
 client=window.mominSupabase||window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 window.mominSupabase=client;
 renderNavigationEvents();
 try{
  const r=await client.auth.getSession();session=r.data&&r.data.session;
  if(!session){showLogin();return}
  await finishAuthentication();
 }catch(e){showLogin(e.message||"Could not verify administrator access.");}
 client.auth.onAuthStateChange((event,next)=>{
  if(event==="SIGNED_OUT"){session=null;staff=null;permissions=[];showLogin("Your administrator session has ended. Sign in again.")}
  else if(event==="SIGNED_IN"&&!staff){session=next;finishAuthentication().catch(e=>showLogin(e.message||"Could not verify administrator access."))}
 });
}
start();
})();