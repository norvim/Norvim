const token = localStorage.getItem("employerToken");

const form = document.getElementById("companyProfileForm");

// Load existing profile
async function loadProfile() {

    try {

        const response = await fetch("/api/employers/profile", {

            headers: {
                Authorization: "Bearer " + token
            }

        });

        const employer = await response.json();

        document.getElementById("companyDescription").value =
            employer.companyDescription || "";

        document.getElementById("industry").value =
            employer.industry || "";

        document.getElementById("website").value =
            employer.website || "";

            document.getElementById("location").value =
    employer.location || "";

        document.getElementById("companySize").value =
            employer.companySize || "";

        document.getElementById("foundedYear").value =
            employer.foundedYear || "";

    } catch (error) {

        console.log(error);

        alert("Failed to load company profile.");

    }

}

loadProfile();


// Save profile
form.addEventListener("submit", async function (e) {

    e.preventDefault();

    try {

        const response = await fetch("/api/employers/company-profile", {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },

            body: JSON.stringify({

                companyDescription: document.getElementById("companyDescription").value,

                industry: document.getElementById("industry").value,

                website: document.getElementById("website").value,
                location: document.getElementById("location").value,

                companySize: document.getElementById("companySize").value,

                foundedYear: document.getElementById("foundedYear").value

            })

        });

        const data = await response.json();

        alert(data.message);

    } catch (error) {

        console.log(error);

        alert("Failed to save company profile.");

    }

});