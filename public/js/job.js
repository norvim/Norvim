console.log("job.js connected");

const container = document.getElementById("jobDetails");


const jobId = localStorage.getItem("selectedJob");



async function loadJob() {

    try {

        const response = await fetch(`/api/jobs/${jobId}`);

        const job = await response.json();
        

if (job.message) {
    container.innerHTML = `
        <h2>Job not found. Go back and try again.</h2>
    `;
    return;
}


        if (!job) {

            container.innerHTML = `
                <h2>Job not found. Go back and try again.</h2>
            `;

            return;
        }


       container.innerHTML = `
       ${job.logo ? `<img src="${job.logo}" width="120" alt="Company Logo">` : ""}
    <h2>${job.title}</h2>

    <p><b>Company:</b> ${job.company}</p>

    <p><b>Category:</b> ${job.category}</p>

    <p><b>Location:</b> ${job.location}</p>

    <p><b>Salary:</b> ${job.salary}</p>

    <h3>Job Description</h3>

    <p>${job.description}</p>

    <button onclick="applyJob('${job._id}', '${job.title}')">
    Apply Now
</button>

<button onclick="saveJob('${job._id}')">
    ❤️ Save Job
</button>
<button type="button" onclick="reportJob('${job._id}')">Report Job</button>
<p class="market-muted">Stay safe: Never pay to secure a job or interview. Never share your PINs or passwords.</p>
`;


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <h2>Failed to load job details</h2>
        `;

    }

}


function applyJob(jobId, title) {

    localStorage.setItem("jobId", jobId);
    localStorage.setItem("jobTitle", title);

    window.location.href = "apply.html";

}

async function saveJob(jobId) {

    const token = localStorage.getItem("applicantToken");

    if (!token) {
        alert("Please login as an applicant first");
        window.location.href = "applicant-login.html";
        return;
    }


    const response = await fetch("/api/saved-jobs", {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            "Authorization": "Bearer " + token

        },

        body: JSON.stringify({

            jobId: jobId

        })

    });


    const data = await response.json();

    alert(data.message);

}loadJob();
async function reportJob(id) {
 const reasons = ["Fake job","Requests payment","Suspicious employer","Misleading salary","Fraudulent contact details","Other"];
 const reason = prompt("Why are you reporting this job?\n" + reasons.map((x,i)=>`${i+1}. ${x}`).join("\n") + "\n\nEnter the number:");
 const selected = reasons[Number(reason)-1]; if (!selected) return;
 const details = prompt("Add any details that may help Norvim review this job (optional):") || "";
 try { const r = await fetch(`/api/jobs/${encodeURIComponent(id)}/report`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({reason:selected,details}) }); const d=await r.json(); alert(d.message || "Report submitted."); } catch(e) { alert("Could not submit the report. Please try again."); }
}
