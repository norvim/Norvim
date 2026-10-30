(function () {
  const button = document.getElementById('marketplacePushOptIn');
  const status = document.getElementById('marketplacePushStatus');
  if (!button || !status) return;
  const say = text => { status.textContent = text; };
  const token = () => button.dataset.accountType === 'employer' ? localStorage.getItem('employerToken') : (localStorage.getItem('applicantToken') || localStorage.getItem('employerToken'));
  const supported = () => ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);

  function decodeKey(base64) {
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: 'Bearer ' + token() } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
  async function enablePush() {
    if (!supported()) throw new Error('This browser does not support background push notifications. Try an updated Chrome browser.');
    if (!token()) throw new Error('Please log in to your Norvim account first, then enable background notifications.');
    if (!window.isSecureContext) throw new Error('Notifications require HTTPS. Open Norvim using its secure https:// address.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permission was not granted. Allow notifications in your browser or phone settings.');
    const keyResult = await api('/api/push/public-key');
    if (!keyResult.enabled || !keyResult.publicKey) throw new Error(keyResult.message || 'Background notifications are not configured on the server yet.');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(keyResult.publicKey) });
    const saved = await api('/api/push/member/subscribe', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
    say(saved.message || 'Background notifications are enabled on this device.');
    button.textContent = 'Job Alerts Enabled';
    button.dataset.enabled = 'true';
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    say('Setting up background notifications…');
    try { await enablePush(); }
    catch (error) { say(error.message || 'Could not enable notifications.'); }
    finally { button.disabled = false; }
  });
  (async () => {
    if (!supported()) { button.disabled = true; say('Background push is not supported in this browser.'); return; }
    if (!window.isSecureContext) { say('Use Norvim over HTTPS to enable background notifications.'); return; }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const subscription = await registration.pushManager.getSubscription();
      if (subscription && token()) {
        await api('/api/push/member/subscribe', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
        button.textContent = 'Job Alerts Enabled';
        button.dataset.enabled = 'true';
        say('Background notifications are enabled for this device.');
      } else if (!token()) say('Log in to your Norvim account to enable background notifications.');
      else say('Enable alerts to receive important job and marketplace updates even when Norvim is not open.');
    } catch (_) { say('Tap Enable Job Alerts to configure notifications for this device.'); }
  })();
})();
