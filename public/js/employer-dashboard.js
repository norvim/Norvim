const employerToken = localStorage.getItem("employerToken");

if (!employerToken) {
    window.location.href = "employer-login.html";
}

console.log("employer-dashboard.js connected");

const employer = JSON.parse(localStorage.getItem("employer"));
console.log(employer);
console.log(employer.Logo);

if (employer && employer.logo) {
    document.getElementById("employerLogo").src = employer.logo;
}


const jobsContainer = document.getElementById("jobs");
const applicationsContainer = document.getElementById("applications");


async function loadEmployerJobs(){

    const token = localStorage.getItem("employerToken");


    const response = await fetch("/api/employer/jobs", {

        headers: {
            "Authorization": "Bearer " + token
        }

    });


    const jobs = await response.json();
    

    jobsContainer.innerHTML = "";


    jobs.forEach(job => {

        jobsContainer.innerHTML += `

        <div class="job-card">

            <h3>${job.title}</h3>

            <p>${job.company}</p>

            <p>${job.location}</p>

            <p>${job.salary}</p>

            <button onclick="editJob('${job._id}')">
Edit
</button>
<button onclick="viewJob('${job._id}')">
    View Details
</button>
            <button onclick="deleteJob('${job._id}')">
Delete
</button>

<button onclick="toggleJobStatus('${job._id}', '${job.status}')">
    ${job.status === "Active" ? "Close Job" : "Open Job"}
</button>

        </div>

        `;

    });

}


loadEmployerJobs();

async function deleteJob(id) {

    const confirmDelete = confirm("Delete this job?");

    if (!confirmDelete) return;

    try {

        const token = localStorage.getItem("employerToken");

const response = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
    headers: {
        Authorization: `Bearer ${token}`
    }
});

        const data = await response.json();

        alert(data.message);

        location.reload();

    } catch (error) {

        console.log(error);

    }

}

function editJob(id) {

    localStorage.setItem("editJobId", id);

    localStorage.setItem("editSource", "employer");

    window.location.href = "edit-job.html";

}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("employerToken");
        localStorage.removeItem("employer");

        alert("Logged out successfully.");

        window.location.href = "employer-login.html";
    });
}

async function toggleJobStatus(id, currentStatus) {

    const newStatus = currentStatus === "Active" ? "Closed" : "Active";

    const token = localStorage.getItem("employerToken");

    const res = await fetch(`/api/jobs/${id}/status`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
            status: newStatus
        })

    });

    const data = await res.json();

    alert(data.message);

    location.reload();

}

function viewJob(id) {

    localStorage.setItem("selectedJob", id);

    window.location.href = "job.html";

}

async function loadApplications() {

    try {

        const token = localStorage.getItem("employerToken");

        const response = await fetch("/api/employer/applications", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const applications = await response.json();

        applicationsContainer.innerHTML = "";

        if (applications.length === 0) {
            applicationsContainer.innerHTML = "<p>No applications yet.</p>";
            return;
        }

        applications.forEach(application => {

            applicationsContainer.innerHTML += `
    <div class="job-card">

    ${application.applicantId && application.applicantId.profilePhoto ? `

<img class="norvim-profile-photo" src="${application.applicantId.profilePhoto}"
     width="100"
     height="100"
     style="border-radius:50%; object-fit:cover;">

` : ""}

        <h3>${application.name}</h3>

        <p>Email: ${application.email}</p>

        <p>Phone: ${application.phone}</p>

        <p>Job: ${application.job.title}</p>

        <p>Status: <strong>${application.status}</strong></p>

        <p>
            <a href="${application.cv}" target="_blank">
                View CV
            </a>
        </p>

        <button onclick="updateApplicationStatus('${application._id}', 'Shortlisted')">
            Shortlist
        </button>

        <button onclick="updateApplicationStatus('${application._id}', 'Rejected')">
            Reject
        </button>

        ${application.applicantId ? `
<button onclick="viewApplicant('${application.applicantId._id}')">
    View Full Profile
</button>
` : ""}

    </div>
`;

        });

    } catch (error) {
        console.error(error);
    }

}

loadApplications();

async function updateApplicationStatus(id, status) {

    try {

        const token = localStorage.getItem("employerToken");

        const response = await fetch(`/api/employer/applications/${id}/status`, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },

            body: JSON.stringify({
                status: status
            })

        });

        if (!response.ok) {
            throw new Error("Failed to update application.");
        }

        alert("Application status updated successfully.");

        loadApplications();

    } catch (error) {

        console.error(error);

        alert("Failed to update application status.");

    }

}

document.getElementById("deleteAccount")
.addEventListener("click", async () => {


    const confirmDelete = confirm(
        "Are you sure you want to permanently delete your employer account?"
    );


    if (!confirmDelete) {
        return;
    }


    try {

        const token = localStorage.getItem("employerToken");


        const response = await fetch(
            "/api/employers/account",
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

            localStorage.removeItem("employerToken");
            localStorage.removeItem("employer");

            window.location.href =
            "employer-login.html";

        }


    } catch (error) {

        console.error(error);

        alert("Failed to delete account.");

    }

});

function viewApplicant(id) {
    console.log("Selected Applicant ID:", id);

    localStorage.setItem("selectedApplicant", id);

    window.location.href = "applicant-view.html";

}

// Visible free-post counter and 30-day paid activation for employers.
(async function initJobPostingPlan(){
 const card=document.getElementById('jobPostingPlan'); if(!card)return;
 const token=localStorage.getItem('employerToken'); const $=id=>document.getElementById(id);
 const status=$('jobPlanStatus'); let paidUntil=null; let planData=null;
 async function request(url,opts={}){const r=await fetch(url,{...opts,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'Request failed');return d;}
 function render(){if(!planData)return;const limit=Number(planData.freeLimit||15),remaining=Number(planData.freeRemaining||0),used=Math.max(0,limit-remaining);$('jobPlanProgress').style.width=Math.min(100,used/limit*100)+'%';if(planData.subscriptionActive&&paidUntil){const ms=Math.max(0,new Date(paidUntil)-Date.now());const days=Math.floor(ms/86400000),hours=Math.floor(ms%86400000/3600000),mins=Math.floor(ms%3600000/60000);$('jobPlanMessage').textContent='Your KSh 1,000 job-posting plan is active. Renew when it expires to keep posting.';$('jobPlanCountdown').textContent='Paid posting expires in '+days+'d '+hours+'h '+mins+'m · '+new Date(paidUntil).toLocaleDateString();$('jobPlanActions').style.display='none';}else if(remaining>0){$('jobPlanMessage').textContent='Your first 15 job posts are free. Every successful post uses one free post; after they run out, activate posting for KSh 1,000 per 30 days.';$('jobPlanCountdown').textContent='FREE POSTS COUNTDOWN: '+remaining+' / '+limit+' remaining · '+used+' used. '+(remaining===1?'Next post ends your free allowance.':'Keep posting free until the counter reaches 0.');$('jobPlanActions').style.display='flex';$('activateJobPlanWallet').disabled=true;$('activateJobPlanMpesa').disabled=true;$('activateJobPlanWallet').title='You can activate the paid plan after all 15 free posts are used.';$('activateJobPlanMpesa').title='You can activate the paid plan after all 15 free posts are used.';}else{$('jobPlanMessage').textContent='Your 15 free job posts have ended. Pay KSh 1,000 for 30 days (one month) to activate unlimited job posting during the active period.';$('jobPlanCountdown').textContent='Free posts used: '+used+'/'+limit+' · Subscription required';$('jobPlanActions').style.display='flex';$('activateJobPlanWallet').disabled=false;$('activateJobPlanMpesa').disabled=false;}}
 async function refresh(){try{planData=await request('/api/employer/job-posting/plan');paidUntil=planData.paidUntil;render();}catch(e){status.textContent=e.message;}}
 async function pay(mode){try{status.textContent='Starting payment…';if(!planData)await refresh();if(planData.freeRemaining>0){throw Error('You still have '+planData.freeRemaining+' free job post(s). Payment activation becomes available after all 15 are used.');}const phone=$('jobPlanPhone').value.trim();const d=await request('/api/employer/job-posting/subscribe',{method:'POST',body:JSON.stringify({paymentMode:mode,phone})});if(d.status==='success'){status.textContent=d.message;await refresh();return;}if(d.reference){status.textContent=(d.message||'Payment prompt started.')+' Check your phone, approve the M-PESA prompt, then verify payment here.';let attempts=0;const check=async()=>{attempts++;try{const v=await request('/api/employer/job-posting/verify/'+encodeURIComponent(d.reference));if(v.status==='success'){status.textContent='Payment verified. Job posting is active for 30 days.';await refresh();return;}if(v.status==='failed'){status.textContent='Payment failed. Please try again.';return;}}catch(e){}if(attempts<12)setTimeout(check,5000);else status.textContent='Payment is still pending. Use the refresh button below to check again.';};check();}else status.textContent=d.message||'Payment initiated.';}catch(e){status.textContent=e.message;}}
 $('activateJobPlanWallet').addEventListener('click',()=>pay('wallet'));$('activateJobPlanMpesa').addEventListener('click',()=>pay('mpesa'));
 const refreshBtn=document.createElement('button');refreshBtn.type='button';refreshBtn.textContent='Refresh plan / payment status';refreshBtn.style.cssText='margin-top:10px;padding:9px 12px;border:0;border-radius:9px;cursor:pointer';refreshBtn.onclick=refresh;$('jobPlanActions').after(refreshBtn);
 await refresh();setInterval(()=>{if(planData)render();},1000);
})();
