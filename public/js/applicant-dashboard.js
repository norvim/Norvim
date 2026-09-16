console.log("Applicant dashboard connected");


const token = localStorage.getItem("applicantToken");
let applicant = JSON.parse(localStorage.getItem("applicant")) || {};

(async()=>{ try { const pr=await fetch("/api/applicants/profile",{headers:{Authorization:"Bearer "+token}}); const fresh=await pr.json(); if(pr.ok){ applicant={...applicant,...fresh}; localStorage.setItem("applicant",JSON.stringify(applicant)); const img=document.getElementById("dashboardPhoto"); if(img&&applicant.profilePhoto){img.src=applicant.profilePhoto;img.classList.add("norvim-profile-photo");} const w=document.getElementById("welcome"); if(w) w.innerHTML=`Welcome ${escText(applicant.name||"")}`; } }catch(_){} })();

if (applicant && applicant.profilePhoto) {
    document.getElementById("dashboardPhoto").src = applicant.profilePhoto; document.getElementById("dashboardPhoto").classList.add("norvim-profile-photo");
}


if (!token || !applicant) {

    alert("Please login first");
    window.location.href = "applicant-login.html";

}


// Show applicant name
document.getElementById("welcome").innerHTML =
    `Welcome ${applicant.name}`;


// Load applications

async function loadApplications() {

    try {

        const response = await fetch(
            "/api/applicants/applications",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        const applications = await response.json();


        const container = document.getElementById("applications");


        if (applications.length === 0) {

            container.innerHTML =
            "<p>No applications found</p>";

            return;

        }


        container.innerHTML = "";


       applications.forEach(app => {

    container.innerHTML += `

    <div class="application-card">

        <div class="application-header">

            <div>

                <h3>${app.jobId ? app.jobId.title : app.jobTitle}</h3>

                <p class="company-name">
                    ${app.jobId ? app.jobId.company : "Not available"}
                </p>

            </div>

            <span class="status-badge ${app.status.toLowerCase()}">
    ${app.status}
</span>

        </div>

        <p><strong>📍 Location:</strong>
        ${app.jobId ? app.jobId.location : "Not available"}</p>

        <p><strong>💰 Salary:</strong>
        ${app.jobId ? app.jobId.salary : "Not available"}</p>

        <p><strong>📅 Applied:</strong>
        ${new Date(app.appliedAt).toDateString()}</p>

        <button
            onclick="withdrawApplication('${app._id}')"
            ${app.status === "Withdrawn" ? "disabled" : ""}>

            Withdraw Application

        </button>

    </div>

    `;

});
    } catch(error) {

        console.log(error);

        alert("Failed to load applications");

    }

}


loadApplications();



// Logout

document.getElementById("logout").addEventListener("click", () => {

    localStorage.removeItem("applicantToken");
    localStorage.removeItem("applicant");

    window.location.href = "applicant-login.html";

});

document.getElementById("profileBtn").addEventListener("click", () => {
    window.location.href = "applicant-profile.html";
});

document.getElementById("savedJobsBtn").addEventListener("click", () => {

    window.location.href = "saved-jobs.html";

});

async function withdrawApplication(id) {

    const confirmWithdraw = confirm(
        "Are you sure you want to withdraw this application?"
    );

    if (!confirmWithdraw) return;

    try {

        const response = await fetch(
            `/api/applicants/applications/${id}/withdraw`,
            {
                method: "PUT",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await response.json();

        alert(data.message);

        loadApplications();

    } catch (error) {

        console.error(error);

        alert("Failed to withdraw application.");

    }

}

document.getElementById("deleteAccount")
.addEventListener("click", async () => {


    const confirmDelete = confirm(
        "Are you sure you want to permanently delete your account?"
    );


    if (!confirmDelete) {
        return;
    }


    const response = await fetch(
        "/api/applicants/account",
        {
            method: "DELETE",

            headers: {
                "Authorization": "Bearer " + token
            }
        }
    );


    const data = await response.json();


    alert(data.message);


    if (response.ok) {

        localStorage.removeItem("applicantToken");
        localStorage.removeItem("applicant");

        window.location.href =
        "applicant-login.html";

    }

});

let marketplaceAction=null;
function openMarketplaceAction(title,hint,fn){document.getElementById('marketActionTitle').textContent=title;document.getElementById('marketActionHint').textContent=hint;document.getElementById('marketActionText').value='';document.getElementById('marketActionModal').hidden=false;marketplaceAction=fn;document.getElementById('marketActionSubmit').onclick=async()=>{const text=document.getElementById('marketActionText').value.trim();if(text.length<5){alert('Please enter at least 5 characters.');return}try{await marketplaceAction(text);closeMarketplaceAction();loadMarketplaceBookings()}catch(e){alert(e.message)}}}
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
            const reported=!!b.cancellationReport;
            return `<div class="application-card"><div class="application-header"><div><h3>${escText(b.requestId?.title||'Labour booking')}</h3><p class="company-name">Marketplace</p></div><span class="status-badge">${escText(b.status)}</span></div>${cancelled?`<p><strong>Cancellation reason:</strong> ${escText(b.cancellationReason||'Not provided')}</p>`:''}${!cancelled&&['accepted','in_progress'].includes(b.status)&&!b.cancelledByMe?`<button onclick="cancelMarketplaceBooking('${b._id}')">Cancel Booking</button>`:''}${cancelled&&!b.cancelledByMe&&!reported?`<button onclick="reportMarketplaceCancellation('${b._id}')">Report Cancellation</button>`:''}${cancelled&&reported?`<p>✓ Cancellation report submitted.</p>`:''}${isRequester&&b.status==='in_progress'&&canPay?`<div class="booking-payment"><p><strong>Pay the worker through Norvim</strong></p><input id="pay-${b._id}" type="number" min="10" step="1" value="${Number(b.agreedAmount||'')||''}" placeholder="Agreed amount (KSh)"><button onclick="payMarketplaceWorker('${b._id}')">Pay Worker</button><button class="secondary" onclick="paidOutsideNorvim('${b._id}')">Paid Outside Norvim</button><small>Only the person who posted this job can pay. Paying outside Norvim applies a KSh 150 fine.</small></div>`:''}${isRequester&&b.paymentStatus==='outside_norvim'?`<div class="market-warning"><strong>Paid Outside Norvim</strong><p>A KSh 150 fine was applied. You can now mark the job complete.</p>${canComplete?`<button onclick="markMarketplaceComplete('${b._id}')">Mark Job Complete</button>`:''}</div>`:''}${isRequester&&b.paymentStatus==='paid'?`<div class="market-success"><p>✓ Payment confirmed through Norvim. Worker earnings have been credited to the worker's Norvim wallet.</p>${canComplete?`<button onclick="markMarketplaceComplete('${b._id}')">Mark Job Complete</button>`:''}</div>`:''}${!isRequester&&b.paymentStatus==='paid'?`<p>✓ Customer payment received by Norvim. Worker earnings: KSh ${Number(b.workerEarnings||0).toLocaleString()}.</p>`:''}${!isRequester&&b.paymentStatus==='outside_norvim'?`<p class="market-muted">Customer reported paying outside Norvim. No Norvim worker payout was created for this booking.</p>`:''}</div>`;
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
    const message=prompt('Explain why you are reporting this cancellation:');
    if(message===null)return;
    if(message.trim().length<5){alert('Please provide at least 5 characters.');return;}
    const r=await fetch('/api/marketplace/bookings/'+id+'/report-cancellation',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({message:message.trim()})});
    const d=await r.json();alert(d.message||'Done');if(r.ok)loadMarketplaceBookings();
};
async function loadMyLabourRequests(){
 const box=document.getElementById('myLabourRequests'); if(!box||!token)return;
 try{const r=await fetch('/api/marketplace/my-requests',{headers:{Authorization:'Bearer '+token}});const rows=await r.json();if(!Array.isArray(rows))throw Error(rows.message||'Failed to load labour requests');
 box.innerHTML=rows.length?rows.map(x=>{const interested=x.interestedWorkerIds||[];return `<div class="application-card"><div class="application-header"><h3>${escText(x.title)}</h3><span class="status-badge">${escText(x.status)}</span></div><p>${escText(x.description)}</p><p><strong>Location:</strong> ${escText([x.location?.area,x.location?.county].filter(Boolean).join(', ')||'GPS location saved')}</p><p><strong>Budget:</strong> KSh ${Number(x.budget?.amount||0).toLocaleString()} · ${escText(x.budget?.type||'negotiable')}</p>${x.status==='pending'&&interested.length?`<h4>Workers who requested this job</h4>${interested.map(w=>`<div class="application-card"><strong>${escText(w.displayName||w.applicantId?.name||'Worker')}</strong><p>${escText((w.services||[]).map(s=>s.name).join(', '))}</p><button onclick="acceptLabourWorker('${x._id}','${w._id}')">Accept Worker</button></div>`).join('')}`:''}</div>`}).join(''):'<p>No labour requests yet.</p>';
 }catch(e){box.innerHTML=`<p>${escText(e.message)}</p>`}
}
window.acceptLabourWorker=async function(requestId,workerId){try{const r=await fetch('/api/marketplace/requests/'+requestId+'/accept-worker',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({workerId})});const d=await r.json();if(!r.ok)throw Error(d.message||'Unable to accept worker');alert(d.message||'Worker accepted.');loadMyLabourRequests();loadMarketplaceBookings();}catch(e){alert(e.message)}};
loadMarketplaceBookings();
loadMyLabourRequests();
