console.log("saved-jobs.js connected");

const container = document.getElementById("savedJobsContainer");

const token = localStorage.getItem("applicantToken");

if (!token) {

    alert("Please login as an applicant first");
    window.location.href = "applicant-login.html";

}


async function loadSavedJobs() {

    try {

        const response = await fetch("/api/saved-jobs", {

            headers: {

                "Authorization": "Bearer " + token

            }

        });


        const savedJobs = await response.json();


        if (savedJobs.length === 0) {

            container.innerHTML = "<h2>No saved jobs yet.</h2>";
            return;

        }


        container.innerHTML = "";


        savedJobs.forEach(saved => {

            const job = saved.jobId;


            container.innerHTML += `

                <div class="job-card">

                    <h3>${job.title}</h3>

                    <p><strong>Company:</strong> ${job.company}</p>

                    <p><strong>Category:</strong> ${job.category}</p>

                    <p><strong>Location:</strong> ${job.location}</p>

                    <p><strong>Salary:</strong> ${job.salary}</p>


                    <button onclick="viewJob('${job._id}')">
                        View Details
                    </button>


                    <button onclick="removeSaved('${saved._id}')">
                        Remove
                    </button>

                </div>

            `;

        });


    } catch (error) {

        console.error(error);

        container.innerHTML = "<h2>Failed to load saved jobs.</h2>";

    }

}



function viewJob(id) {

    localStorage.setItem("selectedJob", id);

    window.location.href = "job.html";

}



async function removeSaved(id) {


    await fetch(`/api/saved-jobs/${id}`, {

        method: "DELETE",

        headers: {

            "Authorization": "Bearer " + token

        }

    });


    loadSavedJobs();

}



loadSavedJobs();