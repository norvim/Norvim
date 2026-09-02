console.log("company.js connected");

const container = document.getElementById("companyDetails");

// Get employer ID from URL
const params = new URLSearchParams(window.location.search);
const employerId = params.get("id");

async function loadCompany() {

    try {

        const response = await fetch(`/api/company/${employerId}`);
        const data = await response.json();

        if (data.message) {
            container.innerHTML = `<h2>${data.message}</h2>`;
            return;
        }

        const company = data.company;
        const jobs = data.jobs;

        container.innerHTML = `
            ${company.logo ? `<img src="${company.logo}" width="120" alt="Company Logo">` : ""}

            <h2>${company.companyName}</h2>

            <p><strong>About:</strong> ${company.companyDescription || "Not provided"}</p>

            <p><strong>Industry:</strong> ${company.industry || "Not provided"}</p>

            <p><strong>Website:</strong> ${company.website || "Not provided"}</p>

            <p><strong>Location:</strong> ${company.location || "Not provided"}</p>

            <p><strong>Company Size:</strong> ${company.companySize || "Not provided"}</p>

            <p><strong>Founded:</strong> ${company.foundedYear || "Not provided"}</p>

            <h3>Active Jobs</h3>

            <div id="companyJobs"></div>
        `;

        const jobsContainer = document.getElementById("companyJobs");

        if (jobs.length === 0) {
            jobsContainer.innerHTML = "<p>No active jobs.</p>";
            return;
        }

        jobs.forEach(job => {
            jobsContainer.innerHTML += `
                <div class="job-card">
                    <h4>${job.title}</h4>
                    <p>${job.location}</p>
                    <p>${job.salary}</p>

                    <button onclick="viewJob('${job._id}')">
                        View Job
                    </button>
                </div>
            `;
        });

    } catch (err) {

        console.error(err);

        container.innerHTML = "<h2>Failed to load company profile.</h2>";

    }

}

function viewJob(jobId) {

    localStorage.setItem("selectedJob", jobId);

    window.location.href = "job.html";

}

loadCompany();

function goBack() {
    window.history.back();
}