const token = localStorage.getItem("employerToken");

if (!token) {
    window.location.href = "employer-login.html";
}

document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    const res = await fetch("/api/employers/change-password", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            currentPassword,
            newPassword
        })
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
        window.location.href = "employer-profile.html";
    }
});