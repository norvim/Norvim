const token = localStorage.getItem('applicantToken');
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let existing = false;
let workerCoords = null;
let locationSharingEnabled = true;

async function api(url, o = {}) {
  o.headers = { ...(o.headers || {}), Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const r = await fetch(url, o);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.message || 'Request failed');
  return d;
}

function setLocationStatus(message, error = false) {
  if (!$('locationStatus')) return;
  $('locationStatus').textContent = message;
  $('locationStatus').className = error ? 'market-error' : 'market-muted';
}

function captureLocation() {
  if (!navigator.geolocation) return setLocationStatus('Location is not supported by this browser. County and area can still be saved.', true);
  setLocationStatus('Getting your current location…');
  navigator.geolocation.getCurrentPosition(pos => {
    workerCoords = [pos.coords.longitude, pos.coords.latitude];
    locationSharingEnabled = true;
    localStorage.setItem('norvimLocationSharing','on');
    if ($('locationSharing')) $('locationSharing').checked = true;
    setLocationStatus('✓ Current location captured. Norvim will keep it updated while location sharing is on.');
  }, err => {
    const m = {1:'Location permission was denied. You can enable it in browser/site settings.',2:'Location could not be determined. Turn on Location/GPS and try again.',3:'Location request timed out. Try again.'};
    setLocationStatus(m[err.code] || 'Unable to get your location.', true);
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
}

async function init() {
  if (!token) throw Error('Please log in as an applicant first.');
  const catsResponse = await fetch('/api/marketplace/categories');
  const cats = await catsResponse.json().catch(() => []);
  if (!catsResponse.ok || !Array.isArray(cats)) throw Error(cats.message || 'Failed to load service categories.');
  $('services').innerHTML = cats.map(c => `<option value="${esc(c._id)}">${esc(c.name)}</option>`).join('');
  try {
    const applicant = await api('/api/applicants/profile');
    const applicantPhoto = String(applicant.profilePhoto || '');
    $('photoPreview').innerHTML = applicantPhoto ? `<img class="norvim-profile-photo" src="${esc(applicantPhoto)}" alt="Your Norvim profile photo" loading="eager" decoding="async">` : '<span>👤</span>';
    const p = await api('/api/marketplace/worker-profile');
    existing = true;
    $('displayName').value = p.displayName || '';
    $('phone').value = p.applicantId?.phone || '';
    $('bio').value = p.bio || '';
    $('experience').value = p.experience || '';
    $('county').value = p.location?.county || '';
    $('area').value = p.location?.area || '';
    $('status').value = p.availability?.status || 'Offline';
    $('radius').value = p.availability?.serviceRadiusKm || 10;
    $('priceType').value = p.pricing?.type || 'negotiable';
    $('amount').value = p.pricing?.amount ?? '';
    workerCoords = p.location?.coordinates?.coordinates || null;
    locationSharingEnabled = p.locationSharingEnabled !== false; localStorage.setItem('norvimLocationSharing', locationSharingEnabled ? 'on' : 'off');
    if ($('locationSharing')) $('locationSharing').checked = locationSharingEnabled;
    $('customServices').value = (p.customServices || []).join(', ');
    const ids = (p.services || []).map(s => s._id);
    [...$('services').options].forEach(o => o.selected = ids.includes(o.value));
  } catch (e) {
    if (!String(e.message).includes('not found')) $('message').innerHTML = `<p class="market-error">${esc(e.message)}</p>`;
  }
  // Capture current GPS automatically when the browser allows it, but never block profile creation.
  if (locationSharingEnabled && navigator.geolocation) captureLocation();
}

$('useLocation').addEventListener('click', captureLocation);
if ($('locationSharing')) $('locationSharing').addEventListener('change', async e => {
  locationSharingEnabled = e.target.checked;
  localStorage.setItem('norvimLocationSharing', locationSharingEnabled ? 'on' : 'off');
  if (!locationSharingEnabled) {
    workerCoords = null;
    setLocationStatus('Location sharing is off. You will not appear in location-based worker discovery or receive location-based opportunities.');
    if (existing) {
      try { await api('/api/marketplace/location', { method:'PUT', body:JSON.stringify({ enabled:false }) }); } catch (_) {}
    }
  } else {
    captureLocation();
  }
});

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const location = { country:'Kenya', county:$('county').value, area:$('area').value };
    if (workerCoords && locationSharingEnabled) location.coordinates = workerCoords;
    const payload = {
      displayName:$('displayName').value,
      phone:$('phone').value.trim(),
      bio:$('bio').value,
      services:[...$('services').selectedOptions].map(o => o.value),
      customServices:$('customServices').value.split(',').map(v => v.trim()).filter(Boolean).slice(0,20),
      experience:$('experience').value,
      location,
      availability:{ status:$('status').value, serviceRadiusKm:Number($('radius').value) },
      pricing:{ type:$('priceType').value, amount:$('amount').value ? Number($('amount').value) : undefined },
      locationSharingEnabled
    };
    const d = await api('/api/marketplace/worker-profile', { method:existing ? 'PUT' : 'POST', body:JSON.stringify(payload) });
    existing = true;
    if (d.profile?.locationSharingEnabled !== undefined) locationSharingEnabled = d.profile.locationSharingEnabled;
    if ($('locationSharing')) $('locationSharing').checked = locationSharingEnabled;
    $('message').innerHTML = `<p class="market-success">${esc(d.message)}</p>`;
  } catch (e) {
    $('message').innerHTML = `<p class="market-error">${esc(e.message)}</p>`;
  }
});

init().catch(e => $('message').innerHTML = `<p class="market-error">${esc(e.message)}</p>`);
