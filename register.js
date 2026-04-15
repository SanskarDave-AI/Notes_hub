
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

const isIIITEmail = (email) => /^[^\s@]+@iiitr\.ac\.in$/i.test(email);

togglePassword.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        password.type = "password";
        togglePassword.classList.replace("fa-eye-slash", "fa-eye");
    }
});


const toggleConfirm = document.getElementById("toggleConfirm");
const confirmPassword = document.getElementById("confirmPassword");

toggleConfirm.addEventListener("click", () => {
    if (confirmPassword.type === "password") {
        confirmPassword.type = "text";
        toggleConfirm.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        confirmPassword.type = "password";
        toggleConfirm.classList.replace("fa-eye-slash", "fa-eye");
    }
});

async function register() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    const error = document.getElementById("errorMsg");

    error.innerText = "";

    if (username === "" || email === "" || pass === "" || confirm === "") {
        error.innerText = "Please fill all fields";
        return;
    }

    if (!isIIITEmail(email)) {
        error.innerText = "Only iiitr.ac.in emails are allowed";
        return;
    }

    if (pass.length < 4) {
        error.innerText = "Password must be at least 4 characters";
        return;
    }

    if (pass !== confirm) {
        error.innerText = "Passwords do not match";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password: pass }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Account created successfully!");
            // Set for fallback
            localStorage.setItem('currentUser', JSON.stringify({ id: 'server', username: username }));
            window.location.href = "dashboard.html";
        } else {
            if (data.message === 'Database error') {
                // Fallback to localStorage
                console.log("Database error, using localStorage fallback");
                let users = JSON.parse(localStorage.getItem("users")) || [];
                const existingUser = users.find(user => user.username === username);
                if (existingUser) {
                    error.innerText = "Username already exists";
                    return;
                }
                users.push({
                    id: Date.now(),
                    username: username,
                    email: email,
                    password: pass,
                    created_at: new Date().toISOString()
                });
                localStorage.setItem("users", JSON.stringify(users));
                localStorage.setItem("currentUser", JSON.stringify({ id: users[users.length-1].id, username: username }));
                alert("Account created successfully! (Using local storage)");
                window.location.href = "dashboard.html";
            } else {
                error.innerText = data.message || "Registration failed";
            }
        }
    } catch (error) {
        // Fallback: Store user locally if server is not running
        console.log("Server not available, using localStorage fallback");

        if (!isIIITEmail(email)) {
            error.innerText = "Only iiitr.ac.in emails are allowed";
            return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];

        // Check if username already exists
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            error.innerText = "Username already exists";
            return;
        }

        // Add new user
        users.push({
            id: Date.now(),
            username: username,
            email: email,
            password: pass, // In real app, this should be hashed
            created_at: new Date().toISOString()
        });

        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("currentUser", JSON.stringify({ id: users[users.length-1].id, username: username }));

        alert("Account created successfully! (Using local storage)");
        window.location.href = "dashboard.html";
    }
}