const token = localStorage.getItem("employerToken");

if (!token) {
    window.location.href = "employer-login.html";
}

async function loadProfile() {
    const res = await fetch("/api/employers/profile", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const employer = await res.json();

    document.getElementById("companyName").value = employer.companyName || "";
    document.getElementById("email").value = employer.email || "";
    document.getElementById("phone").value = employer.phone || "";
}

loadProfile();

document.getElementById("profileForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData = new FormData();

    formData.append(
        "companyName",
        document.getElementById("companyName").value
    );

    formData.append(
        "email",
        document.getElementById("email").value
    );

    formData.append(
        "phone",
        document.getElementById("phone").value
    );

    const logo = document.getElementById("logo").files[0];

    if (logo) {
        formData.append("logo", logo);
    }

    const button = document.getElementById("updateProfileBtn");
    button.disabled = true;
    button.textContent = "Updating Profile...";

    const res = await fetch("/api/employers/profile", {

        method: "PUT",

        headers: {
            Authorization: `Bearer ${token}`
        },

        body: formData

    });

    const data = await res.json();
    button.disabled = false;
    button.textContent = "Update Profile";

    alert(data.message);

    if (res.ok) {

        localStorage.setItem("employer", JSON.stringify(data.employer));

        location.reload();

    }

});