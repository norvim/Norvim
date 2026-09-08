console.log("post-job.js connected");

const form = document.getElementById("jobForm");

form.addEventListener("submit", async function (e) {
    console.log("Form submitted");
    e.preventDefault();

   const formData = new FormData(form);
   const button = document.getElementById("postJobBtn");
   button.disabled = true;
   button.textContent = "Posting Job...";

    try {
       const token = localStorage.getItem("employerToken");

const response = await fetch("/api/jobs", {
    method: "POST",
    headers: {
        "Authorization": "Bearer " + token
    },
    body: formData
});

        const data = await response.json();
        button.disabled = false;
        button.textContent = "Post Job";

        alert(data.message);

        if (data.success) {
            form.reset();
        }

    } catch (error) {
        button.disabled = false;
        button.textContent = "Post Job";
        console.error(error);
        alert("Failed to post job.");
    }
});