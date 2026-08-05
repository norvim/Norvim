let allEmployers = [];
console.log("admin-employers.js connected");

const container = document.getElementById("employersContainer");

async function loadEmployers() {

    try {

        const response = await fetch("/api/admin/employers", {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
});

        const employers = await response.json();
        if (!Array.isArray(employers)) {
    console.error("Employers response:", employers);
    container.innerHTML = "<p>Failed to load employers.</p>";
    return;
}

        allEmployers = employers

        container.innerHTML = "";

        if (employers.length === 0) {

            container.innerHTML = "<p>No employers found.</p>";

            return;

        }


        allEmployers.forEach(employer => {

            container.innerHTML += `

                <div class="job-card">

                    ${employer.logo ? `<img src="/uploads/${employer.logo}" width="80">` : ""}

                    <h3>${employer.companyName}</h3>

                    <p><b>Email:</b> ${employer.email}</p>

                    <p><b>Phone:</b> ${employer.phone || "Not provided"}</p>

                </div>

                <hr>

            `;

        });

    } catch (error) {

        console.error(error);

        container.innerHTML = "<p>Failed to load employers.</p>";

    }

}

loadEmployers();

function searchEmployers() {

    const search = document
        .getElementById("searchEmployer")
        .value
        .toLowerCase();

    const filtered = allEmployers.filter(employer =>

        employer.companyName.toLowerCase().includes(search) ||
        employer.email.toLowerCase().includes(search) ||
        (employer.phone || "").toLowerCase().includes(search)

    );

    const container = document.getElementById("employersContainer");

    container.innerHTML = "";

    filtered.forEach(employer => {

        container.innerHTML += `

        <div class="job-card">

            ${employer.logo ? `<img src="/uploads/${employer.logo}" width="80">` : ""}

            <h3>${employer.companyName}</h3>

            <p><b>Email:</b> ${employer.email}</p>

            <p><b>Phone:</b> ${employer.phone || "Not provided"}</p>
            <p><b>Jobs Posted:</b> ${employer.jobsPosted}</p>
            <p><b>Active Jobs:</b> ${employer.activeJobs}</p>

<p><b>Closed Jobs:</b> ${employer.closedJobs}</p>
<p><b>Status:</b> ${employer.status}</p>

<button onclick="toggleEmployerStatus('${employer._id}')">
    ${employer.status === "Active" ? "Suspend" : "Activate"}
</button>

        </div>

        <hr>

        `;

    });

}

async function toggleEmployerStatus(id) {

    try {

        const response = await fetch(`/api/admin/employers/${id}/status`, {

            method: "PUT",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("adminToken")
            }
        });

        const data = await response.json();

        alert(data.message);

        loadEmployers();

    } catch (error) {

        console.log(error);

        alert("Failed to update employer status");

    }

}