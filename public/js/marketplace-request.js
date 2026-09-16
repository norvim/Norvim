const token = localStorage.getItem('applicantToken');
const requestedWorkerId = new URLSearchParams(location.search).get('worker');
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let requestCoords = null;

async function api(url, options = {}) {
  options.headers = { ...(options.headers || {}), Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const r = await fetch(url, options);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const err = Error(d.message || 'Request failed'); Object.assign(err, d); throw err; }
  return d;
}
async function loadServiceCategories() {
  const select = $('serviceCategory');
  if (!select) return;
  try {
    const r = await fetch('/api/marketplace/categories');
    const cats = await r.json().catch(() => []);
    if (r.ok && Array.isArray(cats)) select.innerHTML = '<option value="">Select a service (optional)</option>' + cats.map(c => `<option value="${esc(c._id)}">${esc(c.name)}</option>`).join('');
  } catch (_) {}
}
function setLocationStatus(message, error = false) {
  $('locationStatus').textContent = message;
  $('locationStatus').className = error ? 'market-error' : 'market-muted';
}
function captureLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const e = new Error('Location is not supported by this browser.');
      setLocationStatus(e.message, true); reject(e); return;
    }
    setLocationStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      pos => { requestCoords = [pos.coords.longitude, pos.coords.latitude]; localStorage.setItem('norvimCurrentCoordinates', JSON.stringify({coordinates:requestCoords, updatedAt:Date.now()})); setLocationStatus('✓ Location captured automatically.'); resolve(requestCoords); },
      err => {
        const messages = {1:'Location permission was denied. Allow location access for Norvim and try again.',2:'Location could not be determined. Turn on Location/GPS and try again.',3:'Location request timed out. Try again.'};
        const e = new Error(messages[err.code] || 'Unable to get your location.');
        setLocationStatus(e.message, true); reject(e);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  });
}
async function loadSavedLocation() {
  try {
    const local = JSON.parse(localStorage.getItem('norvimCurrentCoordinates') || 'null');
    const c = Array.isArray(local?.coordinates) ? local.coordinates : local?.location?.coordinates?.coordinates;
    if (local && Date.now() - Number(local.updatedAt || 0) <= 10 * 60 * 1000 && Array.isArray(c) && c.length === 2 && c.every(Number.isFinite)) {
      requestCoords = [Number(c[0]), Number(c[1])];
      setLocationStatus('✓ Using your recent current location.');
      return;
    }
  } catch (_) {}
  try {
    const r = await fetch('/api/marketplace/location', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return;
    const d = await r.json();
    const c = d.location?.coordinates?.coordinates;
    if (d.enabled !== false && Array.isArray(c) && c.length === 2 && c.every(Number.isFinite)) {
      requestCoords = [Number(c[0]), Number(c[1])];
      setLocationStatus('✓ Using your saved current location.');
    }
  } catch (_) {}
}


(async () => {
  try {
    if (!token) throw Error('Please log in as an applicant first.');
    await loadServiceCategories();
    if (requestedWorkerId) setLocationStatus('Requesting a specific worker. Your location can still be used for distance matching.');
    await loadSavedLocation();
    if (!requestCoords && navigator.geolocation) captureLocation().catch(() => {});
  } catch (e) { $('message').innerHTML = `<p class=\"market-error\">${esc(e.message)}</p>`; }
})();

$('useLocation').addEventListener('click', captureLocation);
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const submit = e.submitter;
  if (submit) { submit.disabled = true; submit.textContent = 'Getting location…'; }
  try {
    if (!requestCoords && !requestedWorkerId) await captureLocation();
    const location = { country: 'Kenya', county: $('county').value, area: $('area').value };
    if (requestCoords) location.coordinates = requestCoords;
    const d = await api('/api/marketplace/requests', {
      method:'POST',
      body:JSON.stringify({ workerId:requestedWorkerId || undefined, serviceCategoryId:$('serviceCategory')?.value || undefined, title:$('title').value, description:$('description').value, location, budget:{ type:$('budgetType').value, amount:$('amount').value ? Number($('amount').value) : undefined } })
    });
    $('message').innerHTML = `<p class="market-success">${esc(d.message)} <a href="applicant-dashboard.html">Go to dashboard</a></p>`;
    $('form').reset(); requestCoords = null; setLocationStatus('Recommended for finding nearby workers.');
  } catch (e) {
    $('message').innerHTML = `<p class="market-error">${esc(e.message)}</p>${e.previousRequestId ? `<p><a class="market-btn market-primary" href="applicant-dashboard.html#marketplaceBookings">Go to Dashboard to Complete Previous Work</a></p>` : ''}`;
  }
  finally { if (submit) { submit.disabled = false; submit.textContent = 'Post Request'; } }
});
