let allApplicants= [];
console.log("admin-applicants.js connected");

const container = document.getElementById("applicantsContainer");

async function loadApplicants() {

    try {

        const response = await fetch("/api/admin/applicants", {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
});

        const applicants = await response.json();

        allApplicants = applicants;

        container.innerHTML = "";

        if (applicants.length === 0) {

            container.innerHTML = "<p>No applicants found.</p>";

            return;

        }

        allApplicants.forEach(applicant => {

            container.innerHTML += `

                <div class="job-card">

                    <h3>${applicant.name}</h3>

                    <p><b>Email:</b> ${applicant.email}</p>

                    <p><b>Phone:</b> ${applicant.phone}</p>

                </div>

                <hr>

            `;

        });

    } catch (error) {

        console.error(error);

        container.innerHTML = "<p>Failed to load applicants.</p>";

    }

}

loadApplicants();

function searchApplicants() {

    const search = document
        .getElementById("searchApplicant")
        .value
        .toLowerCase();

    const filtered = allApplicants.filter(applicant =>

        applicant.name.toLowerCase().includes(search) ||
        applicant.email.toLowerCase().includes(search) ||
        applicant.phone.toLowerCase().includes(search)

    );

    const container = document.getElementById("applicantsContainer");

    container.innerHTML = "";

    filtered.forEach(applicant => {

        container.innerHTML += `

        <div class="job-card">

            <h3>${applicant.name}</h3>

            <p><b>Email:</b> ${applicant.email}</p>

            <p><b>Phone:</b> ${applicant.phone}</p>

        </div>

        <hr>

        `;

    });

}