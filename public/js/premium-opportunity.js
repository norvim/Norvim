/* Premium notification tones for Norvim pages. Background push sound is controlled by the device/browser. */
(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token) return;
  let premium=false, initialized=false, seen=new Set(), audioCtx=null;
  const headers={Authorization:'Bearer '+token};
  const patterns={
    bell:{tones:[880,1175],wave:'triangle',gap:.17,duration:.34,volume:.14},
    chime:{tones:[659,988,1319],wave:'sine',gap:.19,duration:.42,volume:.15},
    soft:{tones:[523,659],wave:'sine',gap:.22,duration:.42,volume:.075},
    alert:{tones:[1175,880,1175],wave:'square',gap:.14,duration:.25,volume:.12}
  };
  async function getJson(url){const r=await fetch(url,{headers});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'Request failed');return d;}
  function unlockAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(_){}}
  function playSound(){
    const selected=localStorage.getItem('norvimPremiumRingtone')||'bell';
    if(selected==='none')return;
    const p=patterns[selected]||patterns.bell;
    unlockAudio(); if(!audioCtx)return;
    try{const start=audioCtx.currentTime+.02;p.tones.forEach((hz,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),at=start+i*p.gap;o.type=p.wave;o.frequency.setValueAtTime(hz,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(p.volume,at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+p.duration);o.connect(g).connect(audioCtx.destination);o.start(at);o.stop(at+p.duration+.02);});}catch(_){}
  }
  function vibrate(){try{if(navigator.vibrate)navigator.vibrate([180,90,180]);}catch(_){}}
  async function refreshPremium(){try{const d=await getJson('/api/premium');const now=Date.now();const active=(d.subscriptions||[]).filter(x=>x.status==='active'&&(!x.expiresAt||new Date(x.expiresAt).getTime()>now)&&['jobs','marketplace'].includes(x.product));premium=active.length>0;const latest=active.sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0))[0];if(latest?.notificationSound)localStorage.setItem('norvimPremiumRingtone',latest.notificationSound);}catch(_){premium=false;}}
  async function poll(){if(!premium)return;try{const notes=await getJson('/api/notifications');if(!Array.isArray(notes))return;if(!initialized){notes.forEach(n=>seen.add(String(n._id)));initialized=true;return;}for(const n of notes.slice().reverse()){const id=String(n._id);if(seen.has(id))continue;seen.add(id);if(document.visibilityState==='visible'){playSound();vibrate();}else if('Notification'in window&&Notification.permission==='granted'){try{new Notification(n.title||'Norvim update',{body:n.message||'You have an important update.',icon:'/images/logo.png',silent:false});}catch(_){}}}if(seen.size>300)seen=new Set(notes.slice(0,200).map(n=>String(n._id)));}catch(_){}}
  document.addEventListener('click',unlockAudio,{passive:true});document.addEventListener('touchstart',unlockAudio,{passive:true});
  async function init(){await refreshPremium();if(!premium)return;await poll();setInterval(async()=>{await refreshPremium();await poll();},15000);}
  init();
})();
