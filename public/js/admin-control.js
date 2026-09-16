const token = localStorage.getItem('adminToken');
const h = { Authorization: 'Bearer ' + token };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

async function api(u, o = {}) {
    const headers = { ...h, ...(o.headers || {}) };
    if (!(o.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const r = await fetch(u, { ...o, headers });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.message || 'Request failed.');
    return d;
}

async function loadWalletPaymentMessages() {
    const host = $('walletPaymentMessages');
    if (!host) return;
    try {
        const activities = await api('/api/admin/activities?kind=payment');
        const payments = Array.isArray(activities) ? activities : [];
        const unread = payments.filter(a => a.read !== true);
        const read = payments.filter(a => a.read === true);
        const refundableTypes = new Set(['wallet_topup','premium','advertisement_budget','marketplace_payment','admin_topup']);
        const renderUnread = a => `<article class="payment-notification unread"><div><strong>New payment / wallet message</strong><p>${esc(a.message)}</p><small>${new Date(a.createdAt).toLocaleString()}</small></div><div class="payment-notification-actions"><button class="market-btn market-primary" onclick="viewWalletPaymentMessage('${a._id}')">View</button></div></article>`;
        const renderRead = a => `<article class="payment-notification read"><div><strong>Viewed payment / wallet message</strong><p>${esc(a.message)}</p><small>${new Date(a.createdAt).toLocaleString()}</small></div><div class="payment-notification-actions">${a.reference ? `<button class="market-btn" onclick="viewPaymentDetails('${esc(a.reference)}')">Details</button>` : ''}${a.reference && refundableTypes.has(a.paymentType) ? `<button class="market-btn" onclick="refundPaymentByReference('${esc(a.reference)}')">Refund</button>` : ''}<button class="market-btn secondary" onclick="deleteWalletPaymentMessage('${a._id}')">Delete</button></div></article>`;
        host.innerHTML = `<div class="wallet-payment-message-head"><div><h3>Wallet Payment Messages</h3><p>New top-ups and payment events appear here. Tap View to archive a message under ⋮ Viewed.</p></div><button type="button" id="walletPaymentDots" class="notification-dots" title="Open viewed messages" aria-expanded="false">⋮ Viewed ${read.length}</button></div><div id="walletPaymentUnread">${unread.length ? unread.map(renderUnread).join('') : '<p>No new wallet payment messages.</p>'}</div><div id="walletPaymentRead" hidden>${read.length ? `<div class="read-activity-list">${read.map(renderRead).join('')}</div>` : '<p>No viewed payment messages.</p>'}</div>`;
        $('walletPaymentDots')?.addEventListener('click', () => { const box=$('walletPaymentRead'); box.hidden=!box.hidden; $('walletPaymentDots').setAttribute('aria-expanded', String(!box.hidden)); });
    } catch(e) { host.innerHTML = `<p>${esc(e.message)}</p>`; }
}
window.loadWalletPaymentMessages = loadWalletPaymentMessages;
window.viewWalletPaymentMessage = async id => { try { await api('/api/admin/activities/'+id,{method:'PUT'}); await loadWalletPaymentMessages(); } catch(e){ alert(e.message); } };
window.deleteWalletPaymentMessage = async id => { try { await api('/api/admin/activities/'+id,{method:'DELETE'}); await loadWalletPaymentMessages(); } catch(e){ alert(e.message); } };
window.viewPaymentDetails = async reference => { try { const p=await api('/api/admin/payments/by-reference/'+encodeURIComponent(reference)); alert(`Type: ${p.type}\nStatus: ${p.status}\nAmount: KSh ${Number(p.amount||0).toLocaleString()}\nReference: ${p.reference}`); } catch(e){ alert(e.message); } };

async function loadComments() {
    try {
        const cs = await api('/api/admin/marketplace/comments');
        $('adminComments').innerHTML = cs.length ? cs.map(c => `<article class="market-card"><strong>${esc(c.name)}</strong><p>${esc(c.message)}</p><small>${esc(c.status)}${c.flagged ? ' · flagged' : ''}</small><div class="market-actions"><button onclick="commentStatus('${c._id}','approved')">Approve</button><button onclick="commentStatus('${c._id}','hidden')">Hide</button><button onclick="commentStatus('${c._id}','rejected')">Remove</button><button onclick="deleteComment('${c._id}')">Delete</button></div></article>`).join('') : '<p>No comments.</p>';
    } catch (e) { console.error(e); }
}

async function loadPremium() {
    try {
        const ps = await api('/api/admin/premium');
        $('adminPremium').innerHTML = ps.length ? ps.map(p => `<article class="market-card"><strong>${esc(p.product)} Premium</strong><p>${esc(p.applicantId?.name || p.employerId?.companyName || 'Account')}</p><small>${esc(p.status)}${p.expiresAt ? ' · ' + new Date(p.expiresAt).toLocaleDateString() : ''}</small><button onclick="premiumStatus('${p._id}','cancelled')">Cancel</button></article>`).join('') : '<p>No Premium subscriptions.</p>';
    } catch (e) { console.error(e); }
}

async function loadHomepageMedia() {
    const box = $('adminHomepageMedia');
    if (!box) return;
    try {
        const media = await api('/api/admin/homepage-media');
        box.innerHTML = media.length ? media.map(item => {
            const preview = item.type === 'video'
                ? `<video class="admin-homepage-media-preview" controls preload="metadata" src="${esc(item.url)}"></video>`
                : `<img class="admin-homepage-media-preview" src="${esc(item.url)}" alt="${esc(item.title || 'Homepage media')}">`;
            return `<article class="admin-homepage-media-item">
                ${preview}
                <strong>${esc(item.title || 'Untitled')}</strong>
                <p>${esc(item.caption || '')}</p>
                <small>${esc(item.type)} · ${esc(item.status)}${item.featured ? ' · featured' : ''} · order ${Number(item.sortOrder || 0)}</small>
                <div class="market-actions">
                    <button onclick="toggleHomepageMedia('${item._id}','${item.status === 'published' ? 'hidden' : 'published'}')">${item.status === 'published' ? 'Hide' : 'Publish'}</button>
                    <button onclick="moveHomepageMedia('${item._id}',${Number(item.sortOrder||0)-1})">↑</button><button onclick="moveHomepageMedia('${item._id}',${Number(item.sortOrder||0)+1})">↓</button><button onclick="featureHomepageMedia('${item._id}',${!item.featured})">${item.featured ? 'Unfeature' : 'Feature'}</button>
                    <button onclick="deleteHomepageMedia('${item._id}')">Delete</button>
                </div>
            </article>`;
        }).join('') : '<p>No homepage media yet.</p>';
    } catch (e) {
        box.innerHTML = '<p>Failed to load homepage media.</p>';
        console.error(e);
    }
}

window.commentStatus = async (id, status) => { await api('/api/admin/marketplace/comments/' + id, { method:'PUT', body:JSON.stringify({ status }) }); loadComments(); };
window.deleteComment = async id => { if (!confirm('Delete this public comment permanently?')) return; try { await api('/api/admin/marketplace/comments/' + id, { method:'DELETE' }); loadComments(); } catch(e) { alert(e.message); } };
window.premiumStatus = async (id, status) => { await api('/api/admin/premium/' + id + '/status', { method:'PUT', body:JSON.stringify({ status }) }); loadPremium(); };
window.adjustBalance = async () => {
    try {
        const id = $('adjustApplicantId').value.trim();
        const amount = Number($('adjustAmount').value);
        const description = $('adjustDescription').value.trim();
        const d = await api('/api/admin/accounts/' + id + '/adjust-balance', { method:'POST', body:JSON.stringify({ amount, description }) });
        alert('New balance: KSh ' + Number(d.balance).toLocaleString());
    } catch(e) { alert(e.message); }
};

window.toggleHomepageMedia = async (id, status) => {
    try { await api('/api/admin/homepage-media/' + id, { method:'PUT', body:JSON.stringify({ status }) }); loadHomepageMedia(); }
    catch(e) { alert(e.message); }
};
window.featureHomepageMedia = async (id, featured) => {
    try { await api('/api/admin/homepage-media/' + id, { method:'PUT', body:JSON.stringify({ featured }) }); loadHomepageMedia(); }
    catch(e) { alert(e.message); }
};
window.deleteHomepageMedia = async id => {
    if (!confirm('Delete this homepage media?')) return;
    try { await api('/api/admin/homepage-media/' + id, { method:'DELETE' }); loadHomepageMedia(); }
    catch(e) { alert(e.message); }
};

const homepageMediaForm = $('homepageMediaForm');
if (homepageMediaForm) {
    homepageMediaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const file = $('homepageMediaFile').files[0];
        if (!file) return alert('Please choose a picture or video.');
        const data = new FormData(homepageMediaForm);
        data.set('featured', $('homepageMediaFeatured').checked ? 'true' : 'false');
        data.set('status', $('homepageMediaHidden').checked ? 'hidden' : 'published');
        try {
            await api('/api/admin/homepage-media', { method:'POST', body:data });
            homepageMediaForm.reset();
            $('homepageMediaOrder').value = '0';
            alert('Homepage media uploaded successfully.');
            loadHomepageMedia();
        } catch(e) { alert(e.message); }
    });
}

loadComments();
loadPremium();
loadHomepageMedia();
loadPayments();

async function loadPayments() {
    const box = $('adminPayments'); const summary = $('adminFinanceSummary');
    if (!box) return;
    try {
        const allPayments = await api('/api/admin/payments');
        const ps = allPayments.filter(p => !['wallet_topup','premium','advertisement_budget','admin_topup','marketplace_payment'].includes(p.type));
        const successful = ps.filter(p => p.status === 'success');
        const wallet = successful.filter(p => p.type === 'wallet_topup').reduce((n,p)=>n+Number(p.amount||0),0);
        const marketplace = successful.filter(p => p.type === 'marketplace_payment').reduce((n,p)=>n+Number(p.amount||0),0);
        const premium = successful.filter(p => p.type === 'premium').reduce((n,p)=>n+Number(p.amount||0),0);
        const adminTopups = successful.filter(p => p.type === 'admin_topup').reduce((n,p)=>n+Number(p.amount||0),0);
        const payouts = ps.filter(p => p.type === 'payout' && p.status === 'payout_success').reduce((n,p)=>n+Number(p.amount||0),0);
        summary.innerHTML = `<div class="mp-stat"><strong>KSh ${wallet.toLocaleString()}</strong><span>Wallet top-ups</span></div><div class="mp-stat"><strong>KSh ${marketplace.toLocaleString()}</strong><span>Marketplace payments</span></div><div class="mp-stat"><strong>KSh ${premium.toLocaleString()}</strong><span>Premium payments</span></div><div class="mp-stat"><strong>KSh ${payouts.toLocaleString()}</strong><span>Worker payouts</span></div><div class="mp-stat"><strong>KSh ${adminTopups.toLocaleString()}</strong><span>Norvim top-ups</span></div>`;
        box.innerHTML = ps.length ? ps.map(p => `<article class="market-card"><div class="mp-card-head"><strong>${esc(p.type)}</strong><span class="mp-status">${esc(p.status)}</span></div><p><strong>KSh ${Number(p.amount||0).toLocaleString()}</strong> · ${esc(p.currency||'KES')} · ${esc(p.provider||'')}</p><p>${esc(p.applicantId?.name || p.employerId?.companyName || 'Account')} · ${esc(p.applicantId?.email || p.employerId?.email || '')}</p><small>Reference: ${esc(p.reference)} · ${new Date(p.createdAt).toLocaleString()}</small>${p.status==='success' && p.type!=='payout' ? `<div class="market-actions"><button onclick="refundPayment('${p._id}')">Refund</button>${p.type==='marketplace_payment' && p.bookingId && p.bookingId.status==='completed' && p.bookingId.payoutStatus!=='paid' ? `<button class="market-btn market-primary" onclick="releasePayout('${p.bookingId._id}')">${p.bookingId.payoutStatus==='failed'?'Pay Worker Again':'Pay Worker'}</button>` : ''}</div>` : ''}${p.status==='payout_failed' && p.bookingId ? `<div class="market-actions"><button onclick="releasePayout('${p.bookingId._id}')">Retry Payout</button></div>` : ''}</article>`).join('') : '<p>No payment records yet.</p>';
    } catch(e) { box.innerHTML = `<p>${esc(e.message)}</p>`; }
}
window.refundPaymentByReference = async reference => { try { const p = await api('/api/admin/payments/by-reference/' + encodeURIComponent(reference)); if (p.status !== 'success') return alert('This payment is not refundable while its status is ' + p.status + '.'); if (!confirm('Refund this successful payment? This will call the payment provider.')) return; await refundPayment(p._id); } catch(e){ alert(e.message); } };
window.refundPayment = async id => { if (!confirm('Refund this successful payment? This will call the payment provider.')) return; try { await api('/api/admin/payments/'+id+'/refund',{method:'POST'}); await loadPayments(); alert('Refund submitted.'); } catch(e){ alert(e.message); } };

window.moveHomepageMedia=async(id,sortOrder)=>{try{await api('/api/admin/homepage-media/'+id,{method:'PUT',body:JSON.stringify({sortOrder})});loadHomepageMedia()}catch(e){alert(e.message)}};

window.releasePayout = async id => {
    if (!confirm('The worker has finished the job. Pay the worker now to the registered M-PESA number?')) return;
    try { await api('/api/admin/bookings/' + id + '/payout', { method:'POST' }); await loadPayments(); alert('Worker payout request submitted.'); }
    catch(e) { alert(e.message); }
};

async function loadFinanceSummary() {
    const box = $('adminFinanceSummary'); if (!box) return;
    try {
        const d = await api('/api/admin/finance-summary');
        box.innerHTML = `<div class="mp-stat"><strong>KSh ${Number(d.totalPlatformBalance).toLocaleString()}</strong><span>Total Platform Balance</span></div><div class="mp-stat"><strong>KSh ${Number(d.walletTopups).toLocaleString()}</strong><span>Wallet Top-Ups</span></div><div class="mp-stat"><strong>KSh ${Number(d.adminTopups||0).toLocaleString()}</strong><span>Norvim Top-Ups</span></div><div class="mp-stat"><strong>KSh ${Number(d.employerWalletBalance||0).toLocaleString()}</strong><span>Employer Wallet Balance</span></div><div class="mp-stat"><strong>KSh ${Number(d.adminWalletBalance||0).toLocaleString()}</strong><span>Admin Wallet Balance</span></div><div class="mp-stat"><strong>KSh ${Number(d.marketplacePayments).toLocaleString()}</strong><span>Marketplace Payments</span></div><div class="mp-stat"><strong>KSh ${Number(d.premiumRevenue).toLocaleString()}</strong><span>Premium Revenue</span></div><div class="mp-stat"><strong>KSh ${Number(d.advertisingRevenue).toLocaleString()}</strong><span>Advertising Revenue</span></div><div class="mp-stat"><strong>KSh ${Number(d.payouts).toLocaleString()}</strong><span>Total Worker Payouts</span></div><div class="mp-stat"><strong>KSh ${Number(d.commissionRevenue).toLocaleString()}</strong><span>Commission Revenue</span></div><div class="mp-stat"><strong>KSh ${Number(d.adminWithdrawals).toLocaleString()}</strong><span>Norvim Withdrawals</span></div>`; if($('adminAvailableEarnings')) $('adminAvailableEarnings').textContent='KSh '+Number(d.availableNorvimEarnings||0).toLocaleString();
    } catch(e) { box.innerHTML = `<p>${esc(e.message)}</p>`; }
}

async function loadAdvertisements() {
    const box = $('adminAdvertisements'); if (!box) return;
    try {
        const ads = await api('/api/admin/advertising');
        box.innerHTML = ads.length ? ads.map(a => `<article class="market-card"><div class="mp-card-head"><strong>${esc(a.title)}</strong><span class="mp-status">${esc(a.status)}</span></div><p>${esc(a.advertiserName)} · ${esc(a.mediaType)} · ${Number(a.qualifiedViews||0).toLocaleString()} views · ${Number(a.clicks||0).toLocaleString()} clicks</p><p>Budget: KSh ${Number(a.budget||0).toLocaleString()} · Remaining: KSh ${Number(a.remainingBudget||0).toLocaleString()} · KSh ${Number(a.costPerView||0).toFixed(2)} / qualified view</p><small>Spent: KSh ${Number(a.amountSpent||0).toLocaleString()}</small><div class="market-actions"><button onclick="setAdStatus('${a._id}','${a.status==='active'?'paused':'active'}')">${a.status==='active'?'Pause':'Activate'}</button><button onclick="fundAd('${a._id}')">Fund Budget</button><button onclick="deleteAd('${a._id}')">Delete</button></div></article>`).join('') : '<p>No advertisements yet.</p>';
    } catch(e) { box.innerHTML = `<p>${esc(e.message)}</p>`; }
}
window.setAdStatus = async (id,status) => { try { await api('/api/admin/advertising/'+id,{method:'PUT',body:JSON.stringify({status})}); loadAdvertisements(); } catch(e){alert(e.message);} };
window.deleteAd = async id => { if (!confirm('Delete this advertisement permanently?')) return; try { await api('/api/admin/advertising/'+id,{method:'DELETE'}); loadAdvertisements(); } catch(e){alert(e.message);} };
window.fundAd = async id => { const amount=Number(prompt('Advertising payment amount (KSh):','1000')); if(!Number.isFinite(amount)||amount<10)return; const email=prompt('Advertiser email:',''); if(!email)return; const phone=prompt('Advertiser M-PESA number:',''); if(!phone)return; try{const d=await api('/api/admin/advertising/'+id+'/pay',{method:'POST',body:JSON.stringify({amount,email,phone})});alert(d.message);loadAdvertisements();}catch(e){alert(e.message);} };
const adForm=$('advertisementForm');
if(adForm){adForm.addEventListener('submit',async e=>{e.preventDefault();const data=new FormData(adForm);try{await api('/api/admin/advertising',{method:'POST',body:data});adForm.reset();$('adCostPerView').value='0.50';alert('Advertisement created. Its budget will be charged automatically for qualified views.');loadAdvertisements();}catch(err){alert(err.message);}});}
loadFinanceSummary();
loadAdvertisements();
loadWalletPaymentMessages();

async function pollAdminTopup(reference){let n=0;const timer=setInterval(async()=>{n++;try{const d=await api('/api/payments/verify-admin/'+encodeURIComponent(reference));if(d.status==='success'){clearInterval(timer);$('adminTopupMessage').textContent='✓ Norvim admin wallet top-up successful.';await loadFinanceSummary();await loadPayments();}else if(d.status==='failed'||n>=18){clearInterval(timer);}}catch(e){if(n>=18)clearInterval(timer)}},5000);}

const adminWithdrawalForm = $('adminWithdrawalForm');
if (adminWithdrawalForm) {
  adminWithdrawalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.submitter; if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }
    try {
      const amount = Number($('adminWithdrawalAmount').value);
      const phone = $('adminWithdrawalPhone').value.trim();
      const d = await api('/api/admin/wallet/withdraw', { method:'POST', body:JSON.stringify({ amount, phone }) });
      $('adminWithdrawalMessage').textContent = d.message;
      $('adminWithdrawalAmount').value = '';
      await loadFinanceSummary();
      await loadPayments();
    } catch(e) { $('adminWithdrawalMessage').textContent = e.message; }
    finally { if(btn) { btn.disabled=false; btn.textContent='Withdraw Funds'; } }
  });
}
