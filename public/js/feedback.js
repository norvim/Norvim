console.log("feedback.js connected");

const form = document.getElementById("feedbackForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const button = document.getElementById("feedbackBtn");

    button.disabled = true;
    button.textContent = "Sending Feedback...";


    const feedback = {

        name: document.getElementById("name").value,

        email: document.getElementById("email").value,

        role: document.getElementById("role").value,

        message: document.getElementById("message").value

    };


    try {

        const response = await fetch("/api/feedback", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(feedback)

        });


        const data = await response.json();


        alert(data.message);


        button.disabled = false;
        button.textContent = "Send Feedback";


        if (response.ok) {

            form.reset();

        }


    } catch (error) {

        console.error(error);

        alert("Failed to send feedback");

        button.disabled = false;
        button.textContent = "Send Feedback";

    }

});

function goBack() {

    const userType = localStorage.getItem("userType");

    if (userType === "applicant") {

        window.location.href = "applicant-dashboard.html";

    } else if (userType === "employer") {

        window.location.href = "employer-dashboard.html";

    } else {

        window.location.href = "index.html";

    }

}