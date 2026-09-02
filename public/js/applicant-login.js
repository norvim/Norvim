const form = document.getElementById("loginForm");
form.addEventListener("submit", async (e) => {

    e.preventDefault();


    const loginData = {

        email: document.getElementById("email").value,

        password: document.getElementById("password").value

    };

    const button = document.getElementById("loginBtn");
    button.disabled = true;
    button.textContent = "Logging in...";

    try {

    const response = await fetch("/api/applicants/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(loginData)

    });

    const text = await response.text();

    console.log(text);

    const data = JSON.parse(text);

    if (response.ok) {

        localStorage.setItem("applicantToken", data.token);
        localStorage.setItem("userType", "applicant");

        localStorage.setItem(
            "applicant",
            JSON.stringify(data.applicant)
        );

        alert("Login successful");

        window.location.href = "applicant-dashboard.html";

    } else {

        button.disabled = false;
        button.textContent = "Login";

        alert(data.message);

    }

} catch (error) {

    button.disabled = false;
    button.textContent = "Login";

    alert("Login failed");

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