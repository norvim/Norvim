console.log("admin-login.js connected");

const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {
e.preventDefault();

const email = document.getElementById("email").value;  
const password = document.getElementById("password").value; 

try {  
    const button = document.getElementById("loginBtn");
    button.disabled = true;
    button.textContent = "Logging in...";
    const response = await fetch("/api/admin/login", { 
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

console.log("Status:", response.status);
console.log("Response:", data);

   if (data.token) {

    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminLoggedIn", "true");

    alert("Login successful!");

    window.location.href = "admin.html";

} else {
    button.disabled = false;
    button.textContent = "Login";

    alert(data.message);

}

} catch (error) {  
    button.disabled = false;
    button.textContent = "Login";
    console.log(error);  
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