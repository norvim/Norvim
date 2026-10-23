(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token || !navigator.geolocation) return;
  let enabled = localStorage.getItem('norvimLocationSharing') !== 'off';
  let lastSent = 0;
  let watchId = null;

  const send = async (pos) => {
    if (!enabled || !pos?.coords) return;
    const coordinates = [Number(pos.coords.longitude), Number(pos.coords.latitude)];
    if (!coordinates.every(Number.isFinite)) return;
    const now = Date.now();
    localStorage.setItem('norvimCurrentCoordinates', JSON.stringify({coordinates, updatedAt: now}));
    // Avoid flooding the server while still updating quickly when the worker moves.
    if (now - lastSent < 15000) return;
    lastSent = now;
    try {
      const r = await fetch('/api/marketplace/location', {
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
        body:JSON.stringify({enabled:true, coordinates})
      });
      if (r.ok) localStorage.setItem('norvimLocationSharing','on');
    } catch (_) {}
  };

  const sync = () => {
    if (!enabled || document.visibilityState === 'prerender') return;
    navigator.geolocation.getCurrentPosition(send, () => {}, {
      enableHighAccuracy:true,
      timeout:10000,
      maximumAge:15000
    });
  };

  const startWatch = () => {
    if (!enabled || watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(send, () => {}, {
      enableHighAccuracy:true,
      maximumAge:10000,
      timeout:15000
    });
  };

  const disable = async () => {
    enabled = false;
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    localStorage.setItem('norvimLocationSharing','off');
    localStorage.removeItem('norvimCurrentCoordinates');
    try {
      await fetch('/api/marketplace/location', {
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
        body:JSON.stringify({enabled:false})
      });
    } catch (_) {}
  };

  const enable = () => {
    enabled = true;
    localStorage.setItem('norvimLocationSharing','on');
    sync();
    startWatch();
  };

  window.norvimDisableLocationSharing = disable;
  window.norvimEnableLocationSharing = enable;
  sync();
  startWatch();
  setInterval(sync, 30000);
})();