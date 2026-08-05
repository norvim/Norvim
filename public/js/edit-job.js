console.log("edit-job.js connected");

const jobId = localStorage.getItem("editJobId");

console.log("Job ID:", jobId);


const title = document.getElementById("title");
const company = document.getElementById("company");
const jobLocation = document.getElementById("location");
const salary = document.getElementById("salary");
const description = document.getElementById("description");
const form = document.getElementById("editJobForm");


// Load existing job details
async function loadJob() {

    try {

        const response = await fetch(`/api/jobs/${jobId}`);

        const job = await response.json();

        if (!job._id) {

            alert("Job not found");

            return;

        }

        title.value = job.title;
        company.value = job.company;
        jobLocation.value = job.location;
        salary.value = job.salary;
        description.value = job.description;

    } catch (error) {

        console.error(error);

    }

}
// Update job
form.addEventListener("submit", async function(e) {

    e.preventDefault();
    const button = document.getElementById("editJobBtn");
    button.disabled = true;
    button.textContent = "Saving Changes...";

    try {

        const token = localStorage.getItem("employerToken");

const response = await fetch(`/api/admin/jobs/${jobId}`, {

    method: "PUT",

    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    },

    body: JSON.stringify({

        title: title.value,
        company: company.value,
        location: jobLocation.value,
        salary: salary.value,
        description: description.value

    })

});

        const data = await response.json();
        button.disabled = false;
        button.textContent = "Save Changes";


        if (data.success) {

            alert("Job updated successfully");

            const source = localStorage.getItem("editSource");

if (source === "employer") {

    window.location.href = "employer-dashboard.html";

} else {

    window.location.href = "admin.html";

}

        }


    } catch (error) {
        button.disabled = false;
        button.textContent = "Save Changes";

        console.error(error);

        alert("Failed to update job");

    }

});


loadJob();