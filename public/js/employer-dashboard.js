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

<img src="${application.applicantId.profilePhoto}"
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