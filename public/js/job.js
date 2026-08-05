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
       ${job.logo ? `<img src="/uploads/${job.logo}" width="120" alt="Company Logo">` : ""}
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