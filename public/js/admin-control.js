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

async function loadComments() {
    try {
        const cs = await api('/api/admin/marketplace/comments');
        $('adminComments').innerHTML = cs.length ? cs.map(c => `<article class="market-card"><strong>${esc(c.name)}</strong><p>${esc(c.message)}</p><small>${esc(c.status)}${c.flagged ? ' · flagged' : ''}</small><div class="market-actions"><button onclick="commentStatus('${c._id}','approved')">Approve</button><button onclick="commentStatus('${c._id}','hidden')">Hide</button><button onclick="commentStatus('${c._id}','rejected')">Remove</button></div></article>`).join('') : '<p>No comments.</p>';
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
        const ps = await api('/api/admin/payments');
        const successful = ps.filter(p => p.status === 'success');
        const wallet = successful.filter(p => p.type === 'wallet_topup').reduce((n,p)=>n+Number(p.amount||0),0);
        const marketplace = successful.filter(p => p.type === 'marketplace_payment').reduce((n,p)=>n+Number(p.amount||0),0);
        const premium = successful.filter(p => p.type === 'premium').reduce((n,p)=>n+Number(p.amount||0),0);
        const payouts = ps.filter(p => p.type === 'payout' && p.status === 'payout_success').reduce((n,p)=>n+Number(p.amount||0),0);
        summary.innerHTML = `<div class="mp-stat"><strong>KSh ${wallet.toLocaleString()}</strong><span>Wallet top-ups</span></div><div class="mp-stat"><strong>KSh ${marketplace.toLocaleString()}</strong><span>Marketplace payments</span></div><div class="mp-stat"><strong>KSh ${premium.toLocaleString()}</strong><span>Premium payments</span></div><div class="mp-stat"><strong>KSh ${payouts.toLocaleString()}</strong><span>Worker payouts</span></div>`;
        box.innerHTML = ps.length ? ps.map(p => `<article class="market-card"><div class="mp-card-head"><strong>${esc(p.type)}</strong><span class="mp-status">${esc(p.status)}</span></div><p><strong>KSh ${Number(p.amount||0).toLocaleString()}</strong> · ${esc(p.currency||'KES')} · ${esc(p.provider||'')}</p><p>${esc(p.applicantId?.name || 'Account')} · ${esc(p.applicantId?.email || '')}</p><small>Reference: ${esc(p.reference)} · ${new Date(p.createdAt).toLocaleString()}</small>${p.status==='success' && p.type!=='payout' ? `<div class="market-actions"><button onclick="refundPayment('${p._id}')">Refund</button></div>` : ''}</article>`).join('') : '<p>No payment records yet.</p>';
    } catch(e) { box.innerHTML = `<p>${esc(e.message)}</p>`; }
}
window.refundPayment = async id => { if (!confirm('Refund this successful payment? This will call the payment provider.')) return; try { await api('/api/admin/payments/'+id+'/refund',{method:'POST'}); await loadPayments(); alert('Refund submitted.'); } catch(e){ alert(e.message); } };

window.moveHomepageMedia=async(id,sortOrder)=>{try{await api('/api/admin/homepage-media/'+id,{method:'PUT',body:JSON.stringify({sortOrder})});loadHomepageMedia()}catch(e){alert(e.message)}};
