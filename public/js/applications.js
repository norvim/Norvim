if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "admin-login.html";
}
console.log("applications.js connected");

const container = document.getElementById("applicationsContainer");

async function loadApplications() {
    try {
        const response = await fetch("/api/applications");
        const applications = await response.json();

       /* console.log("Notifications:", notifications);*/

        if (applications.length === 0) {
            container.innerHTML = "<p>No applications found.</p>";
            return;
        }

        let html = "";

        applications.forEach(application => {
            html += `
                <div class="application-card">
                    <h3>${application.name}</h3>
                    <p><strong>Email:</strong> ${application.email}</p>
                    <p><strong>Phone:</strong> ${application.phone}</p>
                    <p><strong>jobTitle:</strong> ${application.jobTitle}</p>
                    <label>Status:</label>

<select onchange="updateStatus('${application._id}', this.value)">
    <option value="Pending" ${application.status === "Pending" ? "selected" : ""}>Pending</option>
    <option value="Reviewed" ${application.status === "Reviewed" ? "selected" : ""}>Reviewed</option>
    <option value="Shortlisted" ${application.status === "Shortlisted" ? "selected" : ""}>Shortlisted</option>
    <option value="Rejected" ${application.status === "Rejected" ? "selected" : ""}>Rejected</option>
</select>
                      <strong>CV:</strong>
                      <a href="/uploads/cvs/${application.cv}" target="_blank">
                      Open CV
                      </a>
                     <br><br>
<button onclick="deleteApplication('${application._id}')">
    Delete Application
</button> 
                      </p>
                </div>
                <hr>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Failed to load applications.</p>";
    }
}

loadApplications();

async function updateStatus(id, status) {


    console.log("UPDATE STATUS CALLED:", id, status);

    try {

        await fetch(`/api/applications/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: status
            })
        });

        alert("Status updated");

    } catch (error) {

        console.log(error);
        alert("Failed to update status");

    }

}

async function deleteApplication(id) {

    const confirmDelete = confirm("Are you sure you want to delete this application?");

    if (!confirmDelete) {
        return;
    }

    try {

        await fetch(`/api/applications/${id}`, {
            method: "DELETE"
        });

        alert("Application deleted successfully");

        loadApplications();

    } catch (error) {

        console.log(error);
        alert("Failed to delete application");

    }

}

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", function() {

    localStorage.removeItem("adminLoggedIn");

    window.location.href = "admin-login.html";

});