(() => {
  const token = localStorage.getItem('applicantToken');
  if (!token || !navigator.geolocation) return;
  let enabled = localStorage.getItem('norvimLocationSharing') !== 'off';

  const sync = () => {
    if (!enabled || document.visibilityState === 'prerender') return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const coordinates = [pos.coords.longitude, pos.coords.latitude];
      localStorage.setItem('norvimCurrentCoordinates', JSON.stringify({coordinates, updatedAt: Date.now()}));
      try {
        const r = await fetch('/api/marketplace/location', {
          method:'PUT',
          headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
          body:JSON.stringify({enabled:true, coordinates})
        });
        if (r.ok) localStorage.setItem('norvimLocationSharing','on');
      } catch (_) {}
    }, () => {}, {enableHighAccuracy:false, timeout:8000, maximumAge:120000});
  };

  const disable = async () => {
    enabled = false;
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
  };

  window.norvimDisableLocationSharing = disable;
  window.norvimEnableLocationSharing = enable;
  sync();
  setInterval(sync, 120000);
})();
