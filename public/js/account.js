const token = localStorage.getItem('applicantToken');
const h = { Authorization: 'Bearer ' + token };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
async function api(url, options = {}) {
  const headers = { ...h, ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { ...options, headers });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.message || 'Request failed.');
  return d;
}
async function loadAccount() {
  if (!token) { location.href = 'applicant-login.html'; return; }
  try {
    const d = await api('/api/account/summary');
    $('accountUser').textContent = `${d.applicant.name} · ${d.applicant.email}`;
    $('balance').textContent = `KSh ${Number(d.balance || 0).toLocaleString()}`;
    if ($('walletStatus')) $('walletStatus').textContent = Number(d.balance || 0) < 0 ? 'Negative balance' : 'Available';
    const txs = d.transactions || [];
    $('transactions').innerHTML = txs.length ? txs.map(t => `<article class="wallet-tx"><div><strong>${esc(t.description)}</strong><small>${new Date(t.createdAt).toLocaleString()}</small></div><span class="wallet-tx-amount ${Number(t.amount) >= 0 ? 'credit' : 'debit'}">${Number(t.amount) >= 0 ? '+' : ''}KSh ${Number(t.amount).toLocaleString()}</span><small>Balance: KSh ${Number(t.balanceAfter).toLocaleString()}</small></article>`).join('') : '<p class="market-muted">No wallet transactions yet.</p>';
  } catch (e) { $('accountUser').textContent = e.message; }
}
async function startPremium(product, btn) {
  btn.disabled = true; btn.textContent = 'Starting…';
  try {
    const r = await api('/api/premium/request', { method:'POST', body:JSON.stringify({ product }) });
    alert(r.message || 'Complete the M-PESA prompt on your phone.');
    pollPayment(r.reference);
  } catch(e) { alert(e.message); btn.disabled=false; btn.textContent='Get Premium'; }
}
async function pollPayment(reference) {
  let attempts = 0;
  const poll = setInterval(async () => {
    attempts++;
    try {
      const v = await api('/api/payments/verify/' + encodeURIComponent(reference));
      if (v.status === 'success' || v.status === 'failed' || v.status === 'refunded' || attempts >= 12) { clearInterval(poll); await loadAccount(); }
    } catch(e) { if (attempts >= 12) clearInterval(poll); }
  }, 5000);
}
$('walletTopupForm')?.addEventListener('submit', async e => {
  e.preventDefault(); const btn = e.submitter || $('walletTopupBtn'); const amount = Number($('walletTopupAmount').value);
  if (!Number.isFinite(amount) || amount < 10) return alert('Enter at least KSh 10.');
  btn.disabled=true; btn.textContent='Starting M-PESA…';
  try { const r=await api('/api/account/wallet/topup',{method:'POST',body:JSON.stringify({amount})}); alert(r.message || 'Complete the M-PESA prompt on your phone.'); $('walletTopupAmount').value=''; pollWallet(r.reference); }
  catch(e){alert(e.message)} finally {btn.disabled=false;btn.textContent='Add Money';}
});
async function pollWallet(reference){let n=0;const t=setInterval(async()=>{n++;try{const v=await api('/api/payments/verify/'+encodeURIComponent(reference));if(v.status==='success'||v.status==='failed'||n>=12){clearInterval(t);await loadAccount();}}catch(e){if(n>=12)clearInterval(t)}},5000)}
$('logout')?.addEventListener('click',()=>{localStorage.removeItem('applicantToken');location.href='applicant-login.html'});
loadAccount();

$('walletWithdrawForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.submitter || $('walletWithdrawBtn');
  const amount = Number($('walletWithdrawAmount').value);
  if (!Number.isFinite(amount) || amount < 10) return alert('Enter at least KSh 10.');
  btn.disabled = true; btn.textContent = 'Processing…';
  try {
    const r = await api('/api/account/wallet/withdraw', { method:'POST', body:JSON.stringify({ amount }) });
    alert(r.message || 'Withdrawal submitted.');
    $('walletWithdrawAmount').value = '';
    await loadAccount();
  } catch(e) { alert(e.message); }
  finally { btn.disabled = false; btn.textContent = 'Withdraw Funds'; }
});
