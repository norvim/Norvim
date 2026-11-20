console.log("script.js connected");

const jobsContainer = document.getElementById("jobsGrid");

const searchInput = document.getElementById("searchInput");
let allJobs = [];
let currentPage = 1;
let totalPages = 1;
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const categoryFilter = document.getElementById("categoryFilter");


async function loadJobs(page = 1) {

    try {

       const response = await fetch(`/api/jobs?page=${page}`);

const data = await response.json();

allJobs = data.jobs;

currentPage = data.currentPage;

totalPages = data.totalPages;

displayJobs(allJobs);

    } catch (error) {

        console.error("Failed to load jobs:", error);

        jobsContainer.innerHTML = '<p class="jobs-empty">Available jobs could not be loaded right now. Please refresh and try again.</p>';

    }

}


function viewJob(id) {

    localStorage.setItem("selectedJob", id);

    window.location.href = "job.html";

}
function viewCompany(employerId) {
    window.location.href = `company.html?id=${employerId}`;
}

loadJobs();

function displayJobs(jobs) {
    updatePagination();

    jobsContainer.innerHTML = "";
    if (!Array.isArray(jobs) || jobs.length === 0) { jobsContainer.innerHTML = '<p class="jobs-empty">No available jobs at the moment. Please check back soon.</p>'; return; }

    jobs.forEach(job => {

        jobsContainer.innerHTML += `
            <div class="job-card">
            ${job.logo ? `<img src="${job.logo}" width="80" alt="Company Logo">` : ""}
                <h3>${job.title}</h3>

                <p><strong>Company:</strong> ${job.company}</p>

                <p><strong>Category:</strong> ${job.category}</p>

                <p><strong>Location:</strong> ${job.location}</p>

                <p><strong>Salary:</strong> ${job.salary}</p>

                <div class="job-buttons">
    <button onclick="viewJob('${job._id}')">
        View Details
    </button>

   ${job.employerId ? `
    <button onclick="viewCompany('${job.employerId._id}')">
        🏢 View Company
    </button>
` : ""}
</div>
            </div>
        `;

    });

}

function updatePagination() {

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;

    nextBtn.disabled = currentPage === totalPages;

}

function filterJobs() {

    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredJobs = allJobs.filter(job => {

        const matchesSearch =
            job.title.toLowerCase().includes(searchText) ||
            job.company.toLowerCase().includes(searchText) ||
            job.location.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "" ||
            job.category === selectedCategory;

        return matchesSearch && matchesCategory;

    });

    displayJobs(filteredJobs);
}


searchInput.addEventListener("input", filterJobs);

categoryFilter.addEventListener("change", filterJobs);

prevBtn.addEventListener("click", () => {

    if (currentPage > 1) {

        loadJobs(currentPage - 1);

    }

});

nextBtn.addEventListener("click", () => {

    if (currentPage < totalPages) {

        loadJobs(currentPage + 1);

    }

});


