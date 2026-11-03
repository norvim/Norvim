document.getElementById("forgotForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;

    const response = await fetch("/api/applicants/forgot-password", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ email })

    });

    const data = await response.json();

    alert(data.message);

});