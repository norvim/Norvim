
console.log("applicant-view.js connected");

const applicantId = localStorage.getItem("selectedApplicant");
console.log("Stored Applicant ID:", applicantId);

const container = document.getElementById("profileContainer");


async function loadApplicant() {

    try {

        const response = await fetch(
            `/api/applicants/${applicantId}`,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("employerToken")
                }
            }
        );

        if (!response.ok) {
    throw new Error("Failed to fetch applicant");
}

        const data = await response.json();

console.log("API Response:", data);

const applicant = data;

        


        container.innerHTML = `

        ${applicant.profilePhoto ? `
        <img src="/uploads/${applicant.profilePhoto}"
        width="120"
        height="120"
        style="border-radius:50%; object-fit:cover;">
        ` : ""} 


        <h3>${applicant.name}</h3>

        <p>Email: ${applicant.email}</p>

        <p>Phone: ${applicant.phone}</p>

        <p>About:
        ${applicant.about || "Not provided"}
        </p>

        <p>Skills:
        ${applicant.skills || "Not provided"}
        </p>

        <p>Education:
        ${applicant.education || "Not provided"}
        </p>

        <p>Experience:
        ${applicant.experience || "Not provided"}
        </p>

        <p>
        LinkedIn:
        ${applicant.linkedin || "Not provided"}
        </p>

        <p>
        Portfolio:
        ${applicant.portfolio || "Not provided"}
        </p>

        `;


    } catch(error) {

        console.error(error);

        container.innerHTML =
        "<p>Failed to load applicant profile</p>";

    }

}


loadApplicant();