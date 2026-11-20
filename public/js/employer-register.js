console.log("employer-register.js connected");

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {

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
        "password",
        document.getElementById("password").value
    );

    const logo = document.getElementById("logo").files[0];

    if (logo) {
        formData.append("logo", logo);
    }

    const button = document.getElementById("registerBtn");

    button.disabled = true;
    button.textContent = "Creating Account...";

    try {

        const response = await fetch("/api/employers/register", {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        if (response.ok) {

            // Save employer email for the verification page
            localStorage.setItem(
                "employerVerificationEmail",
                document.getElementById("email").value
            );

            alert(data.message);

            // Go to employer verification page
            window.location.href = "employer-verify.html";

        } else {

            alert(data.message);

            button.disabled = false;
            button.textContent = "Register";
        }

    } catch (error) {

        button.disabled = false;
        button.textContent = "Register";

        console.error(error);

        alert("Registration failed");

    }

});

function togglePassword() {

    const password = document.getElementById("password");

    password.type =
        password.type === "password"
        ? "text"
        : "password";

}