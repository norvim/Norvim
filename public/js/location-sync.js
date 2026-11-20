/* Live worker GPS sync. Location sharing is opt-in and discovery expires after
   five minutes without a fresh GPS heartbeat. Browser GPS cannot run after the
   browser/OS has fully stopped this page; while backgrounded, updates are best-effort. */
(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token || !navigator.geolocation) return;
  let enabled = localStorage.getItem('norvimLocationSharing') !== 'off';
  let lastSent = 0;
  let watchId = null;
  let sending = false;

  const send = async (pos) => {
    if (!enabled || !pos?.coords || sending) return;
    const coordinates = [Number(pos.coords.longitude), Number(pos.coords.latitude)];
    if (!coordinates.every(Number.isFinite) || coordinates[0] < -180 || coordinates[0] > 180 || coordinates[1] < -90 || coordinates[1] > 90) return;
    const now = Date.now();
    if (now - lastSent < 15000) return;
    sending = true;
    try {
      const r = await fetch('/api/marketplace/location', {
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
        body:JSON.stringify({enabled:true, coordinates})
      });
      if (r.ok) {
        lastSent = now;
        localStorage.setItem('norvimLocationSharing','on');
        localStorage.setItem('norvimCurrentCoordinates', JSON.stringify({coordinates, updatedAt: now}));
      }
    } catch (_) {} finally { sending = false; }
  };

  const sync = () => {
    enabled = localStorage.getItem('norvimLocationSharing') !== 'off';
    if (!enabled || document.visibilityState === 'prerender') return;
    navigator.geolocation.getCurrentPosition(send, () => {}, {enableHighAccuracy:true, timeout:12000, maximumAge:0});
  };
  const startWatch = () => {
    if (!enabled || watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(send, () => {}, {enableHighAccuracy:true, maximumAge:0, timeout:20000});
  };
  const stopWatch = () => {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  };
  const disable = async () => {
    enabled = false; stopWatch();
    localStorage.setItem('norvimLocationSharing','off');
    localStorage.removeItem('norvimCurrentCoordinates');
    try { await fetch('/api/marketplace/location', {method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({enabled:false})}); } catch (_) {}
  };
  const enable = () => { enabled = true; localStorage.setItem('norvimLocationSharing','on'); sync(); startWatch(); };
  window.norvimDisableLocationSharing = disable;
  window.norvimEnableLocationSharing = enable;
  window.addEventListener('norvim-location-sharing-change', () => {
    enabled = localStorage.getItem('norvimLocationSharing') !== 'off';
    if (enabled) { sync(); startWatch(); } else stopWatch();
  });
  window.addEventListener('storage', e => { if (e.key === 'norvimLocationSharing') { enabled = e.newValue !== 'off'; if (enabled) { sync(); startWatch(); } else stopWatch(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { sync(); startWatch(); } });
  window.addEventListener('pageshow', sync);
  sync(); startWatch();
  setInterval(sync, 30000);
})();
