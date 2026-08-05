console.log("Applicant Profile connected");

const token = localStorage.getItem("applicantToken");

if (!token) {
    alert("Please login first");
    window.location.href = "applicant-login.html";
}


// Load profile
async function loadProfile() {

    const response = await fetch("/api/applicants/profile", {

        headers: {
            "Authorization": "Bearer " + token
        }

    });

    const applicant = await response.json();

    document.getElementById("name").value = applicant.name;
    document.getElementById("email").value = applicant.email;
    document.getElementById("phone").value = applicant.phone;
    document.getElementById("about").value =
    applicant.about || "";

document.getElementById("skills").value =
    applicant.skills || "";

document.getElementById("education").value =
    applicant.education || "";

document.getElementById("experience").value =
    applicant.experience || "";

document.getElementById("linkedin").value =
    applicant.linkedin || "";

document.getElementById("portfolio").value =
    applicant.portfolio || "";

    if (applicant.profilePhoto) {

    document.getElementById("photoPreview").src =
        "/uploads/" + applicant.profilePhoto;

}


}


loadProfile();


// Update profile
document.getElementById("profileForm").addEventListener("submit", async (e) => {

    e.preventDefault();
    console.log("UPDATE BUTTON CLICKED");

    try {

        const formData = new FormData();

        formData.append("name", document.getElementById("name").value);
        formData.append("email", document.getElementById("email").value);
        formData.append("phone", document.getElementById("phone").value);
        formData.append("about", document.getElementById("about").value);
        formData.append("skills", document.getElementById("skills").value);
        formData.append("education", document.getElementById("education").value);
        formData.append("experience", document.getElementById("experience").value);
        formData.append("linkedin", document.getElementById("linkedin").value);
        formData.append("portfolio", document.getElementById("portfolio").value);

        if (document.getElementById("profilePhoto").files[0]) {
            formData.append(
                "profilePhoto",
                document.getElementById("profilePhoto").files[0]
            );
        }
        const button = document.getElementById("updateProfileBtn");
        button.disabled = true;
        button.textContent = "Updating Profile...";

        const response = await fetch("/api/applicants/profile", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        const data = await response.json();
        localStorage.setItem(
            "applicant",
            JSON.stringify(data.applicant)
        );
        button.disabled = false;
        button.textContent = "Update Profile";

        alert(data.message);

    } catch (error) {
        button.disabled = false;
        button.textContent = "Update Profile";
        console.error("Error updating profile:", error);
        alert("Failed to update profile");
    }

});


// Back button
document.getElementById("backDashboard").addEventListener("click", () => {

    window.location.href = "applicant-dashboard.html";

});


// Change Password
document.getElementById("changePassword").addEventListener("click", () => {

    window.location.href = "applicant-change-password.html";

});

document.getElementById("profilePhoto").addEventListener("change", function () {

    const file = this.files[0];

    if (file) {

        document.getElementById("photoPreview").src =
            URL.createObjectURL(file);

    }

});