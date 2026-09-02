const token = localStorage.getItem('applicantToken');
const requestedWorkerId = new URLSearchParams(location.search).get('worker');
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let requestCoords = null;

async function api(url, options = {}) {
  options.headers = { ...(options.headers || {}), Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const r = await fetch(url, options);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.message || 'Request failed');
  return d;
}
function setLocationStatus(message, error = false) {
  $('locationStatus').textContent = message;
  $('locationStatus').className = error ? 'market-error' : 'market-muted';
}
function captureLocation() {
  if (!navigator.geolocation) return setLocationStatus('Location is not supported by this browser. You can continue with county and area.', true);
  setLocationStatus('Getting your location…');
  navigator.geolocation.getCurrentPosition(
    pos => { requestCoords = [pos.coords.longitude, pos.coords.latitude]; setLocationStatus('✓ Location captured automatically.'); },
    err => {
      const messages = {1:'Location permission was denied. You can allow it in browser/site settings, or continue manually.',2:'Location could not be determined. Turn on Location/GPS or continue manually.',3:'Location request timed out. Try again or continue manually.'};
      setLocationStatus(messages[err.code] || 'Unable to get your location. You can continue manually.', true);
    },
    { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
  );
}

(async () => {
  try {
    if (!token) throw Error('Please log in as an applicant first.');
    if (requestedWorkerId) {
      setLocationStatus('Requesting a specific worker. Your location can still be used for distance matching.');
    }
  } catch (e) { $('message').innerHTML = `<p class=\"market-error\">${esc(e.message)}</p>`; }
})();

$('useLocation').addEventListener('click', captureLocation);
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const location = { country: 'Kenya', county: $('county').value, area: $('area').value };
    if (requestCoords) location.coordinates = requestCoords;
    const d = await api('/api/marketplace/requests', {
      method:'POST',
      body:JSON.stringify({ workerId:requestedWorkerId || undefined, title:$('title').value, description:$('description').value, location, budget:{ type:$('budgetType').value, amount:$('amount').value ? Number($('amount').value) : undefined } })
    });
    $('message').innerHTML = `<p class="market-success">${esc(d.message)} <a href="applicant-dashboard.html">Go to dashboard</a></p>`;
    $('form').reset(); requestCoords = null; setLocationStatus('Recommended for finding nearby workers.');
  } catch (e) { $('message').innerHTML = `<p class="market-error">${esc(e.message)}</p>`; }
});
