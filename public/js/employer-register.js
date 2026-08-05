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
        button.disabled = false;
        button.textContent = "Register";


        alert(data.message);


        if (response.ok) {

            window.location.href = "employer-login.html";

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