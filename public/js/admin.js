console.log("admin.js connected");

const applicationContainer = document.getElementById("applications");
const jobsContainer = document.getElementById("jobs");


// Load applications
async function loadApplications() {

    const response = await fetch("/api/admin/applications", {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
});

const applications = await response.json();

if (!Array.isArray(applications)) {
    console.error("Applications response:", applications);
    return;
}

    /*const applications = await response.json();*/

    applicationContainer.innerHTML = "";

    applications.forEach(application => {

        applicationContainer.innerHTML += `
            <div class="job-card">

                <h3>${application.name}</h3>

                <p><b>Email:</b> ${application.email}</p>

                <p><b>Phone:</b> ${application.phone}</p>

                <p><b>Applied For:</b> ${application.jobTitle}</p>

                <p><b>Status:</b> ${application.status}</p>

                <a href="${application.cv}" target="_blank">
                    Open CV
                </a>

                <br><br>

                <button onclick="updateStatus('${application._id}', 'Shortlisted')">
                    Shortlist
                </button>

                <button onclick="updateStatus('${application._id}', 'Rejected')">
                    Reject
                </button>

                <button onclick="deleteApplication('${application._id}')">
    Delete Application
</button>

            </div>
        `;
    });
}


// Load jobs
async function loadJobs() {

    const response = await fetch("/api/jobs");

const data = await response.json();

const jobs = data.jobs || data;
    jobsContainer.innerHTML = "";


    jobs.forEach(job => {

        jobsContainer.innerHTML += `
            <div class="job-card">

            ${job.logo ? `<img src="${job.logo}" width="80">` : ""}

                <h3>${job.title}</h3>

                <p><b>Company:</b> ${job.company}</p>

                <p><b>Location:</b> ${job.location}</p>

                <p><b>Salary:</b> ${job.salary}</p>


                <button onclick="editJob('${job._id}')">
    Edit Job
</button>

<button onclick="deleteJob('${job._id}')">
    Delete Job
</button>

            </div>
        `;

    });

}


// Update application status
async function updateStatus(id, status) {

    const response = await fetch(`/api/admin/applications/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("adminToken")
        },

        body: JSON.stringify({
            status: status
        })

    });

    const data = await response.json();

    alert(data.message || "Status updated successfully");

    loadApplications();

}


// Delete job
async function deleteJob(id) {

    const confirmDelete = confirm("Delete this job?");

    if (!confirmDelete) return;

    const response = await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("adminToken")
        }
    });

const data = await response.json();

alert(data.message);

loadJobs();
}
function editJob(id) {

    localStorage.setItem("editJobId", id);

    localStorage.setItem("editSource", "admin");

    window.location.href = "edit-job.html";

}

async function deleteApplication(id) {

   const response = await fetch(`/api/admin/applications/${id}`, {
    method: "DELETE",
    headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
});

const data = await response.json();

alert(data.message || "Application deleted successfully");

loadApplications();

}


loadApplications();
loadJobs();

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch("/api/dashboard/stats");
        const stats = await response.json();

        document.getElementById("totalJobs").textContent = stats.totalJobs;
        document.getElementById("totalApplications").textContent = stats.totalApplications;

        document.getElementById("totalApplicants").textContent = stats.totalApplicants;

document.getElementById("totalEmployers").textContent = stats.totalEmployers;

    } catch (error) {
        console.error("Failed to load dashboard stats:", error);
    }
}

// Load statistics when the page opens
loadDashboardStats();
loadActivities();
setInterval(loadActivities, 15000);

function viewApplicants() {

    window.location.href = "admin-applicants.html";

}

function viewEmployers() {

    window.location.href = "admin-employers.html";

}

async function loadActivities() {
    try {
        const response = await fetch("/api/admin/activities?kind=general", { headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") } });
        const activities = await response.json();
        if (!Array.isArray(activities)) return;
        const generalActivities = activities.filter(a => a.kind !== "payment");
        const unreadGeneral = generalActivities.filter(a => a.read !== true);
        document.getElementById("activityCount").textContent = unreadGeneral.length;
        const renderGeneral = a => `<div class="job-card activity-item ${a.read ? "read" : "unread"}"><div class="activity-content"><p>${escActivity(a.message)}</p><small>${new Date(a.createdAt).toLocaleString()}</small><br><button onclick="markActivityAsRead('${a._id}')">${a.read ? "Viewed" : "View"}</button> <button onclick="deleteActivity('${a._id}')">Delete</button></div></div>`;
        document.getElementById("activityContainer").innerHTML = generalActivities.length ? generalActivities.map(renderGeneral).join('') : '<p>No notifications.</p>';
    } catch (error) { console.error("Failed to load admin notifications", error); }
}

function escActivity(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

async function markActivityAsRead(id) {

    await fetch(`/api/admin/activities/${id}`, {

        method: "PUT",

        headers: {
            Authorization: "Bearer " + localStorage.getItem("adminToken")
        }

    });

    loadActivities();
    if (typeof window.loadWalletPaymentMessages === "function") window.loadWalletPaymentMessages();

}

async function loadFeedback() {

    try {

        const response = await fetch("/api/admin/feedback", {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("adminToken")
            }
        });

        const feedback = await response.json();

        console.log("Feedback:", feedback);


        const count = document.getElementById("feedbackCount");

        if (count) {
            count.innerText = feedback.length;
        }


        const container = document.getElementById("feedbackContainer");

        container.innerHTML = "";


        feedback.forEach(item => {

            container.innerHTML += `

            <div class="job-card">

                <p><strong>${item.name}</strong> (${item.role})</p>

                <p>${item.message}</p>

                <small>
                    ${item.email}
                    <br>
                    ${new Date(item.createdAt).toLocaleString()}
                </small>

                <br>

                <button onclick="deleteFeedback('${item._id}')">
                    Delete
                </button>

            </div>

            `;

        });


    } catch(error) {

        console.error("Failed to load feedback:", error);

    }

}


loadFeedback();

async function deleteFeedback(id) {

    const confirmDelete = confirm(
        "Delete this feedback?"
    );

    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `/api/admin/feedback/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                    "Bearer " + localStorage.getItem("adminToken")
                }
            }
        );


        const data = await response.json();

        alert(data.message);


        loadFeedback();


    } catch(error) {

        console.error(error);

        alert("Failed to delete feedback");

    }

}

async function deleteActivity(id) {

    await fetch(`/api/admin/activities/${id}`, {

        method: "DELETE",

        headers: {
            Authorization: "Bearer " + localStorage.getItem("adminToken")
        }

    });

    loadActivities();

}

async function deleteAllActivities() {
    const confirmDelete = confirm("Are you sure you want to delete all activities?");
    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch("/api/admin/activities", {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("adminToken")
            }
        });

        if (response.ok) {
            loadActivities();
        } else {
            console.error("Failed to delete all activities");
        }
    } catch (error) {
        console.error("Error deleting all activities:", error);
    }
}

function logoutAdmin() {

    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
}


