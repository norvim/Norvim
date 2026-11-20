console.log("apply.js connected");

// Get job title and job ID
const jobTitle = localStorage.getItem("jobTitle");
const jobId = localStorage.getItem("jobId");

if (jobTitle) {
    document.getElementById("jobTitle").value = jobTitle;
}

const form = document.getElementById("applicationForm");

document.getElementById("cv")?.addEventListener("change", function() {
    const out = document.getElementById("cvError");
    if (!this.files.length) { out.textContent = ""; return; }
    const f = this.files[0];
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        out.textContent = "PDF CV files only. Please choose a PDF file.";
        this.value = "";
    } else out.textContent = "";
});

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const cv = document.getElementById("cv");
    const cvError = document.getElementById("cvError");
    cvError.textContent = "";
    if (!cv.files.length) { cvError.textContent = "PDF CV files only. Please choose a PDF CV file."; return; }
    const file = cv.files[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        cvError.textContent = "PDF CV files only. Please upload a PDF file.";
        cv.value = "";
        return;
    }

    const formData = new FormData(form);
    const applicant = JSON.parse(localStorage.getItem("applicant"));
    formData.append("jobId", jobId);

if (!applicant) {
    alert("Please login as an applicant first");
    return;
}

formData.append("applicantId", applicant.id);

    // Add the job ID
    formData.append("job", jobId);
    const button = document.getElementById("applyBtn");
    button.disabled = true;
    button.textContent = "Submitting application...";

    try {
        const response = await fetch("/apply", {
            method: "POST",
            headers: {
    "Authorization": "Bearer " + localStorage.getItem("applicantToken")
},
            body: formData
        });

        const data = await response.json();
        
        button.disabled = false;
        button.textContent = "Apply";

        if (response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);

    } catch (error) {
        button.disabled = false;
        button.textContent = "Apply";
        console.log(error);
        alert("Failed to submit application");
    }
});