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
/*
// Show profile photo
if (applicant.profilePhoto) {

    document.getElementById("dashboardPhoto").src =
        "/uploads/" + applicant.profilePhoto;

}
*/


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