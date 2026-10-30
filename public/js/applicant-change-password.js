console.log("Applicant Change Password connected");

const token = localStorage.getItem("applicantToken");

if (!token) {
    alert("Please login first");
    window.location.href = "applicant-login.html";
}

document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const response = await fetch("/api/applicants/change-password", {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },

        body: JSON.stringify({
            currentPassword,
            newPassword
        })

    });

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
        window.location.href = "applicant-profile.html";
    }

});