(() => {
  const adminToken = () => localStorage.getItem('adminToken') || '';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const auth = () => ({ Authorization: 'Bearer ' + adminToken(), 'Content-Type':'application/json' });
  let installPrompt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || document.referrer.startsWith('android-app://com.norvim.twa');
  async function installationPing() {
    if (!standalone()) return;
    let id = localStorage.getItem('norvimInstallId');
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})); localStorage.setItem('norvimInstallId', id); }
    try { await fetch('/api/app-installations/activate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({installId:id})}); } catch (_) {}
  }
  async function setupPublicInstall() {
    const button = document.getElementById('norvimInstallAppButton');
    if (!button) return;
    const setVisible = visible => { button.hidden = !visible; button.style.display = visible ? 'block' : 'none'; };
    setVisible(false); // Fail closed: never flash the public install button before admin status is known.
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt=e; });
    try {
      const r=await fetch('/api/app-distribution', { cache: 'no-store' });
      if (!r.ok) throw new Error('Could not read app distribution status.');
      const d=await r.json();
      let alreadyInstalled=standalone();
      if (!alreadyInstalled && navigator.getInstalledRelatedApps) { try { const apps=await navigator.getInstalledRelatedApps(); alreadyInstalled=apps.length>0; } catch (_) {} }
      if (!d.enabled || alreadyInstalled) { setVisible(false); return; }
      setVisible(true);
    } catch (_) { setVisible(false); return; }
    button.addEventListener('click', async () => {
      if (standalone()) { setVisible(false); return; }
      if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice.catch(()=>{}); installPrompt=null; }
      else alert('To install Norvim, open your browser menu and choose “Install app” or “Add to Home screen”.');
    });
    window.addEventListener('appinstalled', () => { setVisible(false); });
  }
  async function adminApi(url, options={}) { const r=await fetch(url,{...options,headers:{...auth(),...(options.headers||{})}}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.message||'Request failed'); return d; }
  async function loadReleaseControl() {
    const root=document.getElementById('norvimMuffAdmin'); if(!root) return;
    try {
      const [setting, stats, reports, appeals, reviewJobs]=await Promise.all([
        adminApi('/api/app-distribution').catch(()=>({enabled:false})),
        adminApi('/api/admin/app-installations').catch(()=>({total:0,android:0,recent:0,rows:[]})),
        adminApi('/api/admin/job-reports').catch(()=>[]),
        adminApi('/api/admin/suspension-appeals').catch(()=>[]),
        adminApi('/api/admin/jobs/under-review').catch(()=>[])
      ]);
      root.innerHTML = `<section class="market-card"><h2>Norvim App Distribution</h2><p>Public downloads are currently <strong>${setting.enabled?'ACTIVE':'HIDDEN'}</strong>. Existing installations continue working when public downloads are hidden.</p><button id="muffToggleDistribution" class="market-btn ${setting.enabled?'secondary':'primary'}">${setting.enabled?'Hide App Downloads':'Activate App Downloads'}</button><div class="mp-stats"><div class="mp-stat"><b>${stats.total||0}</b><span>Unique app activations</span></div><div class="mp-stat"><b>${stats.android||0}</b><span>Android activations</span></div><div class="mp-stat"><b>${stats.recent||0}</b><span>First activations in last 30 days</span></div></div><p class="market-muted">Counts are based on first app activation, not installations that have never been opened.</p></section>
      <section class="market-card"><h2>Jobs Awaiting Safety Review (${reviewJobs.length})</h2>${reviewJobs.length?reviewJobs.map(j=>`<article class="mp-admin-card"><h3>${esc(j.title)}</h3><p>${esc(j.company)} · ${esc(j.location)}</p><p>Employer: ${esc(j.employerId?.companyName||'Unknown')} · ${esc(j.employerId?.email||'')}</p><p>${esc(j.description||'')}</p><div class="mp-actions"><button onclick="window.muffJobDecision('${j._id}','Active')">Approve & Publish</button><button onclick="window.muffJobDecision('${j._id}','Closed')">Close Job</button></div></article>`).join(''):'<p>No jobs awaiting review.</p>'}</section>
      <section class="market-card"><h2>Job Reports (${reports.length})</h2>${reports.length?reports.map(x=>`<article class="mp-admin-card"><h3>${esc(x.jobId?.title||'Deleted / unavailable job')}</h3><p><b>Reason:</b> ${esc(x.reason)} · <b>Status:</b> ${esc(x.status)}</p><p>${esc(x.details||'No additional details.')}</p><small>${new Date(x.createdAt).toLocaleString()}</small><div class="mp-actions"><button onclick="window.muffReportDecision('${x._id}','reviewed')">Mark Reviewed</button><button onclick="window.muffReportDecision('${x._id}','dismissed')">Dismiss</button><button onclick="window.muffReportDecision('${x._id}','confirmed')">Confirm & Hide Job</button></div></article>`).join(''):'<p>No job reports yet.</p>'}</section>
      <section class="market-card"><h2>Suspension Appeals (${appeals.filter(a=>a.status==='pending').length} pending)</h2>${appeals.length?appeals.map(a=>`<article class="mp-admin-card"><h3>${esc(a.accountType)} · ${esc(a.accountId)}</h3><p><b>Suspension reason:</b> ${esc(a.reason)}</p><p><b>User explanation:</b> ${esc(a.explanation)}</p><p><b>Status:</b> ${esc(a.status)}</p>${a.status==='pending'?`<div class="mp-actions"><button onclick="window.muffAppealDecision('${a._id}','approved')">Approve & Restore</button><button onclick="window.muffAppealDecision('${a._id}','rejected')">Reject Appeal</button></div>`:''}</article>`).join(''):'<p>No suspension appeals yet.</p>'}</section>`;
      document.getElementById('muffToggleDistribution').onclick=async()=>{try{const d=await adminApi('/api/admin/app-distribution',{method:'PUT',body:JSON.stringify({enabled:!setting.enabled})});alert(d.message);loadReleaseControl()}catch(e){alert(e.message)}};
    } catch(e) { root.innerHTML=`<p>Norvim Muff admin controls could not load: ${esc(e.message)}</p>`; }
  }
  window.muffReportDecision=async(id,status)=>{const adminNote=prompt('Optional admin note:')||'';try{const d=await adminApi('/api/admin/job-reports/'+id,{method:'PUT',body:JSON.stringify({status,adminNote})});alert(d.message);loadReleaseControl()}catch(e){alert(e.message)}};
  window.muffAppealDecision=async(id,status)=>{let adminResponse='';if(status==='rejected'){adminResponse=await window.norvimAdminDialog({title:'Reject suspension appeal',message:'Explain why this appeal is rejected. The explanation will be recorded for the account holder.',requireReason:true,confirmText:'Reject appeal'});if(adminResponse===null)return;}try{const d=await adminApi('/api/admin/suspension-appeals/'+id,{method:'PUT',body:JSON.stringify({status,adminResponse})});const root=document.getElementById('norvimMuffAdmin');if(root){const note=document.createElement('p');note.textContent=d.message||'Appeal decision saved.';root.prepend(note);}loadReleaseControl()}catch(e){console.error('Suspension appeal decision failed:',e);const root=document.getElementById('norvimMuffAdmin');if(root)root.insertAdjacentText('afterbegin','Appeal decision failed: '+e.message+' ');}};
  window.muffJobDecision=async(id,status)=>{try{const d=await adminApi('/api/admin/jobs/'+id+'/review-status',{method:'PUT',body:JSON.stringify({status})});alert(d.message);loadReleaseControl()}catch(e){alert(e.message)}};
  document.addEventListener('DOMContentLoaded',()=>{installationPing();setupPublicInstall();loadReleaseControl();});
})();
