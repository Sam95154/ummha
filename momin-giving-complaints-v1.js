/* MOMIN Complaints V1 — user-facing pages backed by authenticated Supabase access. */
(function () {
  "use strict";
  const client = () => window.mominSupabase || null;
  const view = () => document.getElementById("view");
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const notify = msg => { if (typeof window.toast === "function") window.toast(msg); else console.info(msg); };
  const currency = (n, code) => {
    try { return new Intl.NumberFormat("en-IN",{style:"currency",currency:code||"INR",maximumFractionDigits:0}).format(Number(n||0)); }
    catch (_) { return (code||"INR")+" "+Number(n||0).toLocaleString("en-IN"); }
  };
  const fmtDate = value => value ? new Date(value).toLocaleDateString([], {day:"numeric",month:"short",year:"numeric"}) : "—";
  const state = { complaints:[], complaintsLoaded:false, loadingComplaints:false, selectedComplaint:null, replies:[], loadingReplies:false, currentUser:null };
  function clientReady() {
    const sb = client();
    if (!sb) throw new Error("MOMIN account services are unavailable. Please refresh and sign in again.");
    return sb;
  }
  async function getUser() {
    const sb = clientReady();
    const {data,error} = await sb.auth.getUser();
    if (error || !data || !data.user) throw new Error("Please sign in to MOMIN again.");
    state.currentUser = data.user;
    return data.user;
  }
  function heading(title, subtitle) {
    return '<div class="page-title"><div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div><span class="tag">MOMIN</span></div>';
  }
  function localDateKey() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  }
  function safeImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw, location.href);
      return parsed.protocol === "https:" ? parsed.href : "";
    } catch (_) { return ""; }
  }
  function complaintsMarkup() {
    if(state.selectedComplaint){
      const c=state.selectedComplaint;
      return heading("Complaint details",c.ticket_id)+
        '<button type="button" class="plain" data-complaint-action="back">← My complaints</button>'+
        '<div class="card mt"><div class="rowbetween"><h3>'+esc(c.subject)+'</h3><span class="tag">'+esc(c.status)+'</span></div>'+
        '<p class="sub">'+esc(c.category)+' · '+esc(c.priority)+' · Submitted '+fmtDate(c.created_at)+'</p>'+
        '<p>'+esc(c.description)+'</p>'+(c.attachment_url?'<p class="sub"><a href="'+esc(c.attachment_url)+'" target="_blank" rel="noopener noreferrer">View submitted attachment ↗</a></p>':'')+
        '<div class="sectionhead"><h2>Conversation and status history</h2></div>'+
        '<div class="timeline">'+(state.replies||[]).map(r=>'<div class="timeline-item"><b>'+(r.author_type==="admin"?"MOMIN Support":"You")+'</b><p>'+esc(r.message)+'</p><small>'+fmtDate(r.created_at)+'</small></div>').join("")+
        '<div class="timeline-item"><b>Current status: '+esc(c.status)+'</b><small>Last updated '+fmtDate(c.updated_at)+'</small></div></div></div>';
    }
    const rows=state.complaints.map(c=>'<button type="button" class="card" data-complaint-open="'+esc(c.id)+'" style="width:100%;text-align:left;margin:0 0 10px"><div class="rowbetween"><b>'+esc(c.ticket_id)+'</b><span class="tag">'+esc(c.status)+'</span></div><h3 style="margin-top:8px">'+esc(c.subject)+'</h3><p class="sub">'+esc(c.category)+' · '+esc(c.priority)+' · '+fmtDate(c.created_at)+'</p><span class="plain">View details →</span></button>').join("");
    return heading("My complaints","Submit a support request and track Admin responses.")+
      '<div class="card"><h3>Submit a complaint</h3><form id="momin-complaint-form">'+
      '<label class="sub" for="momin-complaint-category">Category</label><select class="search" id="momin-complaint-category" name="category"><option>Login</option><option>Notifications</option><option>Quran</option><option>Prayer Times</option><option>Account</option><option>Other</option></select>'+
      '<label class="sub" for="momin-complaint-subject">Subject</label><input class="search" id="momin-complaint-subject" name="subject" maxlength="120" required>'+
      '<label class="sub" for="momin-complaint-description">Describe the issue</label><textarea class="search" id="momin-complaint-description" name="description" minlength="10" maxlength="5000" rows="4" required></textarea>'+
      '<label class="sub" for="momin-complaint-file">Attachment (optional · image or PDF · max 5 MB)</label><input class="search" style="padding:8px" id="momin-complaint-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf">'+
      '<button class="primary" type="submit" style="border:0;border-radius:11px;padding:12px 18px;background:linear-gradient(135deg,#e8ca86,#b88837);color:#211808;font-weight:700">Submit complaint</button></form></div>'+
      '<div class="sectionhead"><h2>My tickets</h2><button class="plain" type="button" data-complaint-action="refresh">Refresh</button></div>'+
      (state.loadingComplaints?'<div class="card"><p class="sub">Loading your complaints…</p></div>':rows||'<div class="card"><div class="empty"><h3>No complaints yet</h3><p>Your submitted support tickets will appear here.</p></div></div>');
  }
  async function loadComplaints() {
    if(state.loadingComplaints)return;
    state.loadingComplaints=true;renderCustom();
    try{
      const sb=clientReady(),user=await getUser();
      const {data,error}=await sb.from("momin_complaints").select("id,ticket_id,category,subject,description,priority,status,attachment_path,created_at,updated_at,resolved_at,closed_at")
        .eq("user_id",user.id).order("updated_at",{ascending:false}).limit(100);
      if(error)throw error;
      state.complaints=data||[];state.complaintsLoaded=true;
    }catch(error){notify(error.message);}
    finally{state.loadingComplaints=false;state.complaintsLoaded=true;renderCustom();}
  }
  async function openComplaint(id) {
    try{
      const sb=clientReady(),user=await getUser();
      const {data,error}=await sb.from("momin_complaints").select("*").eq("id",id).eq("user_id",user.id).single();
      if(error)throw error;
      const {data:replies,error:replyError}=await sb.from("momin_complaint_replies")
        .select("id,author_type,message,created_at").eq("complaint_id",id).order("created_at",{ascending:true});
      if(replyError)throw replyError;
      let attachmentUrl=null;
      if(data.attachment_path){
        const signed=await sb.storage.from("momin-complaint-attachments").createSignedUrl(data.attachment_path,3600);
        if(!signed.error&&signed.data)attachmentUrl=signed.data.signedUrl;
      }
      state.selectedComplaint={...data,attachment_url:attachmentUrl};state.replies=replies||[];renderCustom();
    }catch(error){notify(error.message);}
  }
  async function submitComplaint(form) {
    const sb=clientReady(),user=await getUser(),data=new FormData(form);
    const subject=String(data.get("subject")||"").trim(),description=String(data.get("description")||"").trim();
    if(subject.length<2||description.length<10)throw new Error("Enter a subject and describe your issue in at least 10 characters.");
    const file=data.get("file");let attachmentPath=null;
    if(file instanceof File&&file.size){
      if(file.size>5*1024*1024)throw new Error("Attachment must be 5 MB or smaller.");
      const types=["image/jpeg","image/png","image/webp","application/pdf"];
      if(!types.includes(file.type))throw new Error("Only JPG, PNG, WebP, or PDF attachments are supported.");
      const ext=file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g,"");
      attachmentPath=user.id+"/"+crypto.randomUUID()+"."+(ext||"dat");
      const {error:uploadError}=await sb.storage.from("momin-complaint-attachments").upload(attachmentPath,file,{upsert:false,contentType:file.type});
      if(uploadError)throw uploadError;
    }
    const {data:created,error}=await sb.from("momin_complaints").insert({
      user_id:user.id,category:String(data.get("category")||"Other"),subject,description,
      priority:"Normal",status:"Open",attachment_path:attachmentPath
    }).select("id,ticket_id").single();
    if(error)throw error;
    notify("Complaint submitted. Your ticket ID is "+created.ticket_id+".");
    form.reset();state.selectedComplaint=null;await loadComplaints();
  }
  function renderCustom() {
    const target=view();if(!target)return;
    if(typeof page==="undefined")return;
    if(page==="complaints"){target.innerHTML=complaintsMarkup();if(!state.complaintsLoaded&&!state.loadingComplaints&&!state.selectedComplaint)loadComplaints();}
    try{if(window.MominSharedShellV1)window.MominSharedShellV1.sync()}catch(_){}
  }
  const originalRender=window.render;
  window.render=function(){
    if(typeof page!=="undefined"&&page==="complaints")return renderCustom();
    const result=originalRender?originalRender.apply(this,arguments):undefined;
    if(typeof page!=="undefined"&&page==="home"){
      setTimeout(function(){
        const grid=document.querySelector(".quickgrid");
        if(grid&&!grid.querySelector("[data-momin-complaints-quick]")){
          grid.insertAdjacentHTML("beforeend",
            '<button class="quick" data-momin-complaints-quick onclick="go(\'complaints\')"><span class="qico">✉</span><b>Complaints</b><span>Contact MOMIN support</span></button>');
        }
      },0);
    }
    return result;
  };
  document.addEventListener("click",function(event){
    const open=event.target.closest("[data-complaint-open]");
    if(open){openComplaint(open.dataset.complaintOpen);return;}
    const action=event.target.closest("[data-complaint-action]");
    if(action){
      if(action.dataset.complaintAction==="back"){state.selectedComplaint=null;state.replies=[];renderCustom();}
      if(action.dataset.complaintAction==="refresh"){state.selectedComplaint=null;loadComplaints();}
    }
  });
  document.addEventListener("submit",function(event){
    if(event.target&&event.target.id==="momin-complaint-form"){
      event.preventDefault();
      submitComplaint(event.target).catch(error=>notify(error.message||"Could not submit your complaint."));
    }
  });
  window.MominComplaintsV1={refresh:renderCustom,loadComplaints};
})();