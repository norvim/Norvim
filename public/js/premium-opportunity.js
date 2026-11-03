(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token) return;
  let premium = false, initialized = false, seen = new Set(), audioCtx = null;
  const headers = { Authorization: 'Bearer ' + token };
  async function getJson(url) { const r=await fetch(url,{headers}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.message||'Request failed'); return d; }
  function activateAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(_){}}
  async function playSound(){
    const chosen=localStorage.getItem('norvimPremiumRingtone')||'bell'; if(chosen==='none')return;
    if(chosen==='custom')try{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('norvim-premium-audio',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});const blob=await new Promise((resolve,reject)=>{const tx=db.transaction('sounds','readonly');const q=tx.objectStore('sounds').get('premium');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});db.close();if(blob){const a=new Audio(URL.createObjectURL(blob));a.volume=1;await a.play();setTimeout(()=>URL.revokeObjectURL(a.src),15000);return;}}catch(_){}
    activateAudio();if(!audioCtx)return;try{const patterns={bell:[880,1175],chime:[659,988,1319],soft:[523,659],alert:[1175,880,1175]};const style=chosen==='custom'?'bell':chosen,fs=patterns[style]||patterns.bell,now=audioCtx.currentTime;fs.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=now+i*.16;o.type=style==='soft'?'sine':'triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(style==='soft'?.10:.15,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+.36);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.38);});}catch(_){}
  }
  function vibrate(){try{if(navigator.vibrate)navigator.vibrate([180,90,180,90,300]);}catch(_){}}
  async function refreshPremium(){try{const d=await getJson('/api/premium');const now=Date.now();const active=(d.subscriptions||[]).filter(x=>x.status==='active'&&(!x.expiresAt||new Date(x.expiresAt).getTime()>now)&&['jobs','marketplace'].includes(x.product));premium=active.length>0;const latest=active.sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0))[0];if(latest?.notificationSound)localStorage.setItem('norvimPremiumRingtone',latest.notificationSound);}catch(_){premium=false;}}
  async function poll(){if(!premium)return;try{const notes=await getJson('/api/notifications');if(!Array.isArray(notes))return;if(!initialized){notes.forEach(n=>seen.add(String(n._id)));initialized=true;return;}for(const n of notes.slice().reverse()){const id=String(n._id);if(seen.has(id))continue;seen.add(id);if(document.visibilityState==='visible'){await playSound();vibrate();}if('Notification'in window&&Notification.permission==='granted'&&document.visibilityState!=='visible'){try{new Notification(n.title||'Norvim update',{body:n.message||'You have an important update.',icon:'/images/logo.png',silent:false});}catch(_){}}}if(seen.size>300)seen=new Set(notes.slice(0,200).map(n=>String(n._id)));}catch(_){}}
  document.addEventListener('click',activateAudio,{passive:true});document.addEventListener('touchstart',activateAudio,{passive:true});
  async function init(){await refreshPremium();if(!premium)return;await poll();setInterval(async()=>{await refreshPremium();await poll();},15000);}
  init();
})();