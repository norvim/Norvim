(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token) return;
  let premium = false;
  let initialized = false;
  let seen = new Set();
  let audioCtx = null;

  async function getJson(url) {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.message || 'Request failed');
    return d;
  }

  function activateAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }

  function playOpportunitySound() {
    if (localStorage.getItem('norvimPremiumRingtone') === 'none') return;
    if (!audioCtx) activateAudio();
    if (!audioCtx) return;
    try {
      const style = localStorage.getItem('norvimPremiumRingtone') || 'bell';
      const patterns = {
        bell: [880,1175], chime: [659,988,1319], soft: [523,659], alert: [1175,880,1175]
      };
      const freqs = patterns[style] || patterns.bell; const now=audioCtx.currentTime;
      freqs.forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=now+i*.16;o.type=style==='soft'?'sine':'triangle';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(style==='soft'?.10:.15,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+.36);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.38);});
    } catch (_) {}
  }

  async function browserNotice(message) {
    if (!('Notification' in window)) return;
    try {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission === 'granted') new Notification('Norvim Premium Opportunity', { body: message.replace(/^🔔\s*(?:Premium opportunity|New marketplace opportunity):\s*/i, ''), icon: 'images/logo.png' });
    } catch (_) {}
  }

  async function poll() {
    if (!premium) return;
    try {
      const notes = await getJson('/api/notifications');
      if (!Array.isArray(notes)) return;
      const opportunities = notes.filter(n => /^🔔\s*(?:Premium opportunity|New marketplace opportunity):/i.test(String(n.message || '')));
      if (!initialized) {
        opportunities.forEach(n => seen.add(String(n._id)));
        initialized = true;
        return;
      }
      for (const note of opportunities.slice().reverse()) {
        const id = String(note._id);
        if (seen.has(id)) continue;
        seen.add(id);
        playOpportunitySound();
        browserNotice(String(note.message || 'New opportunity available.'));
      }
      if (seen.size > 100) seen = new Set(opportunities.slice(0, 100).map(n => String(n._id)));
    } catch (_) {}
  }

  async function init() {
    try {
      const data = await getJson('/api/premium');
      const active = Array.isArray(data.subscriptions) ? data.subscriptions.find(s => s.product === 'marketplace' && s.status === 'active' && (!s.expiresAt || new Date(s.expiresAt) > new Date())) : null;
      premium = Boolean(active);
      if (active?.notificationSound) localStorage.setItem('norvimPremiumRingtone', active.notificationSound);
      if (!premium) return;
      document.addEventListener('click', activateAudio, { passive: true });
      document.addEventListener('touchstart', activateAudio, { passive: true });
      await poll();
      setInterval(poll, 15000);
    } catch (_) {}
  }

  init();
})();
