
const toggle = document.getElementById("togglePassword");
const password = document.getElementById("password");

const isIIITEmail = (email) => /^[^\s@]+@iiitr\.ac\.in$/i.test(email);

toggle.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        toggle.classList.remove("fa-eye");
        toggle.classList.add("fa-eye-slash");
    } else {
        password.type = "password";
        toggle.classList.remove("fa-eye-slash");
        toggle.classList.add("fa-eye");
    }
});

async function login() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    const error = document.getElementById("errorMsg");

    if (!error) {
        // Create error message element if it doesn't exist
        const errorDiv = document.createElement("p");
        errorDiv.id = "errorMsg";
        errorDiv.className = "error";
        document.querySelector(".card").appendChild(errorDiv);
    }

    const errorMsg = document.getElementById("errorMsg");
    errorMsg.innerText = "";

    if (email === "" || pass === "") {
        errorMsg.innerText = "Please fill all fields";
        return;
    }

    if (!isIIITEmail(email)) {
        errorMsg.innerText = "Only iiitr.ac.in emails are allowed";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password: pass }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login successful!");
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            // Also set for fallback
            localStorage.setItem('currentUser', JSON.stringify({ id: 'server', username: data.username }));
            window.location.href = "dashboard.html";
        } else {
            if (data.message === 'Database error') {
                // Fallback to localStorage
                console.log("Database error, using localStorage fallback");
                let users = JSON.parse(localStorage.getItem("users")) || [];
                const user = users.find(u => u.email === email && u.password === pass);
                if (user) {
                    localStorage.setItem("currentUser", JSON.stringify({ id: user.id, username: user.username }));
                    alert("Login successful! (Using local storage)");
                    window.location.href = "dashboard.html";
                } else {
                    errorMsg.innerText = "Invalid email or password";
                }
            } else {
                errorMsg.innerText = data.message || "Login failed";
            }
        }
    } catch (error) {
        // Fallback: Check localStorage if server is not running
        console.log("Server not available, using localStorage fallback");

        if (!isIIITEmail(email)) {
            errorMsg.innerText = "Only iiitr.ac.in emails are allowed";
            return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(u => u.email === email && u.password === pass);

        if (user) {
            localStorage.setItem("currentUser", JSON.stringify({ id: user.id, username: user.username }));
            alert("Login successful! (Using local storage)");
            window.location.href = "dashboard.html";
        } else {
            errorMsg.innerText = "Invalid email or password";
        }
    }
}