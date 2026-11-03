const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const applicant = {

        name: document.getElementById("name").value,

        email: document.getElementById("email").value,

        phone: document.getElementById("phone").value,

        password: document.getElementById("password").value

    };

    const button = document.getElementById("registerBtn");

    button.disabled = true;
    button.textContent = "Creating Account...";

    try {

        const response = await fetch("/api/applicants/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(applicant)

        });

        const data = await response.json();

        if (response.ok) {

            // Save email so verify.html can use it
            localStorage.setItem("verificationEmail", applicant.email);

            alert(data.message);

            // Go to verification page
            window.location.href = "verify.html";

        } else {

            alert(data.message);

            button.disabled = false;
            button.textContent = "Register";
        }

    } catch (error) {

        button.disabled = false;
        button.textContent = "Register";

        alert("Registration failed");

        console.error(error);

    }

});

function togglePassword() {

    const password = document.getElementById("password");

    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }

}