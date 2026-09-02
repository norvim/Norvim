console.log("employer-login.js connected");

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    const button = document.getElementById("loginBtn");

button.disabled = true;
button.textContent = "Logging in...";

    try {

        const response = await fetch("/api/employers/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {

            button.disabled = false;
            button.textContent = "Login";

            return alert(data.message);

        }

        localStorage.setItem("employerToken", data.token);
        localStorage.setItem("userType", "employer");

        localStorage.setItem("employer", JSON.stringify(data.employer));

        alert("Login successful");

        window.location.href = "employer-dashboard.html";

    } catch (error) {

        button.disabled = false;
        button.textContent = "Login";

        console.error(error);

        alert("Login failed");

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