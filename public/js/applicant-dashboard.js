console.log("Applicant dashboard connected");


const token = localStorage.getItem("applicantToken");
const applicant = JSON.parse(localStorage.getItem("applicant"));

if (applicant && applicant.profilePhoto) {
    document.getElementById("dashboardPhoto").src =
        applicant.profilePhoto;
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
        box.innerHTML=bookings.length?bookings.map(b=>{const cancelled=b.status==='cancelled';const reported=!!b.cancellationReport;return `<div class="application-card"><div class="application-header"><div><h3>${escText(b.requestId?.title||'Labour booking')}</h3><p class="company-name">Marketplace</p></div><span class="status-badge">${escText(b.status)}</span></div>${cancelled?`<p><strong>Cancellation reason:</strong> ${escText(b.cancellationReason||'Not provided')}</p>`:''}${!cancelled&&['accepted','in_progress'].includes(b.status)&&!b.cancelledByMe?`<button onclick="cancelMarketplaceBooking('${b._id}')">Cancel Booking</button>`:''}${cancelled&&!b.cancelledByMe&&!reported?`<button onclick="reportMarketplaceCancellation('${b._id}')">Report Cancellation</button>`:''}${cancelled&&reported?`<p>✓ Cancellation report submitted.</p>`:''}</div>`}).join(''):'<p>No marketplace bookings yet.</p>';
    }catch(e){box.innerHTML=`<p>${escText(e.message)}</p>`;}
}
function escText(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
window.reportMarketplaceCancellation=async function(id){
    const message=prompt('Explain why you are reporting this cancellation:');
    if(message===null)return;
    if(message.trim().length<5){alert('Please provide at least 5 characters.');return;}
    const r=await fetch('/api/marketplace/bookings/'+id+'/report-cancellation',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({message:message.trim()})});
    const d=await r.json();alert(d.message||'Done');if(r.ok)loadMarketplaceBookings();
};
loadMarketplaceBookings();
