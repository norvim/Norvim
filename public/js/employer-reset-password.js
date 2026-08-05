const params = new URLSearchParams(window.location.search);

const token = params.get("token");


document.getElementById("resetForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();


    const password =
    document.getElementById("password").value;


    const response = await fetch(
        "/api/employers/reset-password",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                token,
                password
            })

        }
    );


    const data = await response.json();


    alert(data.message);


    if (response.ok) {

        window.location.href =
        "employer-login.html";

    }

});