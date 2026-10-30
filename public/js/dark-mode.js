console.log("dark-mode.js connected");

const savedTheme = localStorage.getItem("norvimTheme");

const themeToggle = document.getElementById("themeToggle");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    if (themeToggle) {
        themeToggle.textContent = "☀️ Light Mode";
    }

}

function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {

        localStorage.setItem("norvimTheme", "dark");

        if (themeToggle) {
            themeToggle.textContent = "☀️ Light Mode";
        }

    } else {

        localStorage.setItem("norvimTheme", "light");

        if (themeToggle) {
            themeToggle.textContent = "🌙 Dark Mode";
        }

    }

}