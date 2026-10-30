/* Norvim Beamer: marketplace management moved from Applicant Dashboard to Worker Dashboard.
 * Uses the existing authenticated APIs and payment/dispute rules.
 */
(()=>{
const token=localStorage.getItem('applicantToken');
let marketplaceAction=null;
function openMarketplaceAction(title,hint,fn){const modal=document.getElementById('marketActionModal');const submit=document.getElementById('marketActionSubmit');if(!modal||!submit){alert('Marketplace action form is unavailable. Please refresh the dashboard.');return}document.getElementById('marketActionTitle').textContent=title;document.getElementById('marketActionHint').textContent=hint;document.getElementById('marketActionText').value='';modal.hidden=false;marketplaceAction=fn;submit.disabled=false;submit.textContent='Submit';submit.onclick=async()=>{const text=document.getElementById('marketActionText').value.trim();if(text.length<5){alert('Please enter at least 5 characters.');return}submit.disabled=true;submit.textContent='Submitting…';try{const action=marketplaceAction;if(typeof action!=='function')throw Error('This action expired. Please close and try again.');await action(text);closeMarketplaceAction();await loadMarketplaceBookings();}catch(e){alert(e.message||'Action failed.');submit.disabled=false;submit.textContent='Submit'}}}
window.closeMarketplaceAction=()=>{document.getElementById('marketActionModal').hidden=true;marketplaceAction=null};
window.cancelMarketplaceBooking=id=>openMarketplaceAction('Cancel booking','Please explain why you are cancelling this booking. The reason will be shown to the other party.',reason=>fetch('/api/marketplace/bookings/'+id+'/status',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled',cancellationReason:reason})}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message||'Failed to cancel booking');return d}));

async function loadMarketplaceBookings(){
    const box=document.getElementById('marketplaceBookings');
    if(!box||!token)return;
    try{
        const r=await fetch('/api/marketplace/bookings',{headers:{Authorization:'Bearer '+token}});
        const bookings=await r.json();
        if(!Array.isArray(bookings))throw Error(bookings.message||'Failed to load marketplace bookings');
        box.innerHTML=bookings.length?bookings.map(b=>{
            const cancelled=b.status==='cancelled';
            const isRequester=!!b.isRequester;
            const canPay=isRequester&&!cancelled&&b.status==='in_progress'&&b.paymentStatus!=='paid'&&b.paymentStatus!=='outside_norvim';
            const canComplete=isRequester&&!cancelled&&b.status==='in_progress'&&(b.paymentStatus==='paid'||b.paymentStatus==='outside_norvim');
            const reported=!!b.cancellationReport; const canDeleteBooking=['cancelled','completed'].includes(b.status);
            return `<div class="application-card"><div class="application-header"><div><h3>${escText(b.requestId?.title||'Labour booking')}</h3><p class="company-name">Marketplace</p></div><span class="status-badge">${escText(b.status)}</span></div>${cancelled?`<p><strong>Cancellation reason:</strong> ${escText(b.cancellationReason||'Not provided')}</p>`:''}${!cancelled&&['accepted','in_progress'].includes(b.status)?`<button type="button" onclick="cancelMarketplaceBooking('${b._id}')">Cancel Booking</button>`:''}${cancelled&&!reported?`<button type="button" onclick="reportMarketplaceCancellation('${b._id}')">Report Cancellation</button>`:''}${cancelled&&reported?`<p>✓ Cancellation report submitted.</p>`:''}${canDeleteBooking?`<button type="button" class="secondary" onclick="deleteMyBooking('${b._id}')">Delete Booking</button>`:''}${b.status==='completed'?`<a class="market-btn secondary" href="reviews.html?bookingId=${encodeURIComponent(b._id)}">⭐ Review worker/customer</a>`:''}<a class="market-btn secondary" href="messages.html?contextType=marketplace&amp;contextId=${encodeURIComponent(b._id)}">💬 Message ${isRequester?'worker':'customer'}</a>${isRequester&&b.status==='in_progress'&&canPay?`<div class="booking-payment"><p><strong>Pay the worker through Norvim</strong></p><input id="pay-${b._id}" type="number" min="10" step="1" value="${Number(b.agreedAmount||'')||''}" placeholder="Agreed amount (KSh)"><button onclick="payMarketplaceWorker('${b._id}')">Pay Worker</button><button class="secondary" onclick="paidOutsideNorvim('${b._id}')">Paid Outside Norvim</button><small>Only the person who posted this job can pay. Paying outside Norvim applies a KSh 150 fine.</small></div>`:''}${isRequester&&b.paymentStatus==='outside_norvim'?`<div class="market-warning"><strong>Paid Outside Norvim</strong><p>A KSh 150 fine was applied. You can now mark the job complete.</p>${canComplete?`<button onclick="markMarketplaceComplete('${b._id}')">Mark Job Complete</button>`:''}</div>`:''}${isRequester&&b.paymentStatus==='paid'?`<div class="market-success"><p>✓ Payment confirmed through Norvim. Worker earnings have been credited to the worker's Norvim wallet.</p>${canComplete?`<button onclick="markMarketplaceComplete('${b._id}')">Mark Job Complete</button>`:''}</div>`:''}${!isRequester&&b.paymentStatus==='paid'?`<p>✓ Customer payment received by Norvim. Worker earnings: KSh ${Number(b.workerEarnings||0).toLocaleString()}.</p>`:''}${!isRequester&&b.paymentStatus==='outside_norvim'?`<p class="market-muted">Customer reported paying outside Norvim. No Norvim worker payout was created for this booking.</p>`:''}</div>`;
        }).join(''):'<p>No marketplace bookings yet.</p>';
    }catch(e){box.innerHTML=`<p>${escText(e.message)}</p>`;}
}
async function verifyMarketplacePaymentUntilDone(reference){
    for(let i=0;i<20;i++){
        const r=await fetch('/api/payments/verify/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+token}});
        const d=await r.json().catch(()=>({}));
        if(r.ok && d.payment?.status==='success') return d;
        if(d.status==='success'||d.paymentStatus==='paid') return d;
        await new Promise(resolve=>setTimeout(resolve,3000));
    }
    throw Error('Payment is still pending. Check your M-PESA and refresh the dashboard shortly.');
}
window.payMarketplaceWorker=async function(id){
    const input=document.getElementById('pay-'+id); const amount=Number(input?.value);
    if(!Number.isFinite(amount)||amount<=0)return alert('Enter the agreed job amount.');
    try{
        const r=await fetch('/api/marketplace/bookings/'+id+'/pay',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({amount})});
        const d=await r.json(); if(!r.ok)throw Error(d.message||'Unable to start payment');
        alert(d.message||'Complete the M-PESA prompt on your phone.');
        await verifyMarketplacePaymentUntilDone(d.reference);
        alert('Payment confirmed. The worker earnings have been credited and you can now mark the job complete.');
        await loadMarketplaceBookings();
    }catch(e){alert(e.message)}
};
window.paidOutsideNorvim=async function(id){
    if(!confirm('Did you actually pay the worker outside Norvim? This will apply a fixed KSh 150 fine to your Norvim account and will not create a Norvim worker payout.'))return;
    try{
        const r=await fetch('/api/marketplace/bookings/'+id+'/paid-outside-norvim',{method:'POST',headers:{Authorization:'Bearer '+token}});
        const d=await r.json(); if(!r.ok)throw Error(d.message||'Unable to record outside-Norvim payment');
        alert(d.message||'Outside-Norvim payment recorded.');
        await loadMarketplaceBookings();
    }catch(e){alert(e.message)}
};
window.markMarketplaceComplete=async function(id){
    try{
        const r=await fetch('/api/marketplace/bookings/'+id+'/status',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:'completed'})});
        const d=await r.json(); if(!r.ok)throw Error(d.message||'Unable to mark job complete');
        alert(d.message||'Job marked complete.');
        await loadMarketplaceBookings(); await loadMyLabourRequests();
    }catch(e){alert(e.message)}
};

function escText(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
window.reportMarketplaceCancellation=async function(id){
    openMarketplaceAction('Report cancellation','Explain what went wrong with this cancellation. Your report will be sent to Norvim for review.',async message=>{
        const r=await fetch('/api/marketplace/bookings/'+id+'/report-cancellation',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({message})});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw Error(d.message||'Failed to submit cancellation report.');
        return d;
    });
};
async function loadMyLabourRequests(){
 const box=document.getElementById('myLabourRequests'); if(!box||!token)return;
 try{const r=await fetch('/api/marketplace/my-requests',{headers:{Authorization:'Bearer '+token}});const rows=await r.json();if(!Array.isArray(rows))throw Error(rows.message||'Failed to load labour requests');
 box.innerHTML=rows.length?rows.map(x=>{const interested=x.interestedWorkerIds||[];const cancellationSolved=!!x.cancellationSolved;const canCancelAccidental=x.status==='pending'&&interested.length===0;const canRemoveAccidental=['pending','cancelled'].includes(x.status)&&interested.length===0&&!x.cancellationReport;const canDeleteAccidental=canRemoveAccidental||x.status==='expired'||x.status==='completed'||(x.status==='cancelled'&&cancellationSolved);const canDelete=x.status==='completed'||x.status==='expired'||(x.status==='cancelled'&&cancellationSolved);const displayStatus=(x.status==='cancelled'&&cancellationSolved)?'solved':x.status;const deleteHint=x.status==='completed'?'Completed job — you can now remove this record.':(x.status==='cancelled'&&cancellationSolved?'Cancellation dispute solved by admin — you can now remove this record.':x.status==='expired'?'Expired job — you can remove this record.':'');return `<div class="application-card"><div class="application-header"><h3>${escText(x.title)}</h3><span class="status-badge">${escText(displayStatus)}</span></div><p>${escText(x.description)}</p><p><strong>Location:</strong> ${escText([x.location?.area,x.location?.county].filter(Boolean).join(', ')||'GPS location saved')}</p><p><strong>Budget:</strong> KSh ${Number(x.budget?.amount||0).toLocaleString()} · ${escText(x.budget?.type||'negotiable')}</p>${x.status==='cancelled'&&!cancellationSolved?`<p class="market-warning"><strong>Cancellation under admin review.</strong> You cannot delete this job until the cancellation report is decided.</p>`:''}${x.status==='cancelled'&&cancellationSolved?`<p class="market-success"><strong>✓ Cancellation solved.</strong> ${x.cancellationReport?.status==='fine_applied'?'A KSh 100 fine was applied to the responsible person.':'The cancellation report was cleared with no fine.'}</p>`:''}${x.status==='pending'&&interested.length?`<div class="marketplace-worker-choices"><h4>Workers ready to do this job</h4>${interested.map(w=>`<div class="application-card marketplace-worker-choice"><strong>${escText(w.displayName||w.applicantId?.name||'Worker')}</strong><p>${escText((w.services||[]).map(s=>s.name).join(', '))}</p><button class="marketplace-accept-btn" onclick="acceptLabourWorker('${x._id}','${w._id}')">✓ Accept Worker</button></div>`).join('')}</div>`:''}${canRemoveAccidental?`<div class="market-actions">${canCancelAccidental?`<button type="button" class="secondary" onclick="cancelMyLabourRequest('${x._id}')">Cancel Post</button>`:''}<button type="button" class="secondary" onclick="deleteMyLabourRequest('${x._id}')">Delete Post</button><small>No workers have requested this post, so you can remove an accidental post.</small></div>`:''}${canDelete?`<div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap"><small>${escText(deleteHint)}</small><button type="button" class="secondary" onclick="deleteMyLabourRequest('${x._id}')">Delete Marketplace Job</button></div>`:''}</div>`}).join(''):'<p>No labour requests yet.</p>';
 }catch(e){box.innerHTML=`<p>${escText(e.message)}</p>`}
}
window.acceptLabourWorker=async function(requestId,workerId){try{const r=await fetch('/api/marketplace/requests/'+requestId+'/accept-worker',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({workerId})});const d=await r.json();if(!r.ok)throw Error(d.message||'Unable to accept worker');alert(d.message||'Worker accepted.');loadMyLabourRequests();loadMarketplaceBookings();}catch(e){alert(e.message)}};
window.loadMarketplaceBookings=loadMarketplaceBookings;
window.loadMyLabourRequests=loadMyLabourRequests;
loadMarketplaceBookings();
loadMyLabourRequests();

window.deleteMyLabourRequest=async function(id){if(!confirm('Delete this marketplace job? This cannot be undone.'))return;try{const r=await fetch('/api/marketplace/my-requests/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'Failed to delete marketplace job.');alert(d.message||'Marketplace job deleted.');await loadMyLabourRequests();}catch(e){alert(e.message||'Failed to delete marketplace job.')}};

window.deleteMyBooking=async function(id){if(!confirm('Delete this completed/cancelled booking from your dashboard?'))return;try{const r=await fetch('/api/marketplace/bookings/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'Unable to delete booking');await loadMarketplaceBookings();}catch(e){alert(e.message||'Unable to delete booking')}};
window.cancelMyLabourRequest=async function(id){if(!confirm('Cancel this post? This is allowed only while nobody has requested it.'))return;try{const r=await fetch('/api/marketplace/my-requests/'+id+'/cancel',{method:'POST',headers:{Authorization:'Bearer '+token}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'Unable to cancel post');await loadMyLabourRequests();}catch(e){alert(e.message||'Unable to cancel post')}};
})();
