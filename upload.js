async function uploadNote() {
    const title = document.getElementById("title").value;
    const subject = document.getElementById("subject").value;
    const semester = document.getElementById("sem").value;
    const description = document.getElementById("desc").value;
    const file = document.getElementById("file").files[0];

    // Create message element if it doesn't exist
    let msg = document.getElementById("msg");
    if (!msg) {
        msg = document.createElement("p");
        msg.id = "msg";
        document.querySelector(".upload-card").appendChild(msg);
    }

    if (!title || !subject || !semester || !file) {
        msg.style.color = "red";
        msg.innerText = "Please fill all fields";
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        msg.style.color = "red";
        msg.innerText = "Please login first";
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        msg.style.color = "red";
        msg.innerText = "Please login first";
        return;
    }

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('semester', semester);
        formData.append('description', description);
        formData.append('file', file);

        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            msg.style.color = "green";
            msg.innerText = "Upload successful!";
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

            // Clear fields
            document.getElementById("title").value = "";
            document.getElementById("subject").value = "";
            document.getElementById("sem").value = "";
            document.getElementById("desc").value = "";
            document.getElementById("file").value = "";
        } else {
            if (data.message === 'Database error') {
                // Fallback to localStorage
                console.log("Database error, using localStorage fallback");
                let notes = JSON.parse(localStorage.getItem("notes")) || [];
                notes.push({
                    id: Date.now(),
                    title: title,
                    subject: subject,
                    semester: semester,
                    description: description,
                    fileName: file.name,
                    userId: currentUser.id,
                    username: currentUser.username,
                    downloads: 0,
                    date: new Date().toISOString()
                });
                localStorage.setItem("notes", JSON.stringify(notes));
                msg.style.color = "green";
                msg.innerText = "Upload successful! (Using local storage)";
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1000);
                // Clear fields
                document.getElementById("title").value = "";
                document.getElementById("subject").value = "";
                document.getElementById("sem").value = "";
                document.getElementById("desc").value = "";
                document.getElementById("file").value = "";
            } else {
                msg.style.color = "red";
                msg.innerText = data.message || "Upload failed";
            }
        }
    } catch (error) {
        // Fallback: Store locally if server is not running
        console.log("Server not available, using localStorage fallback");

        let notes = JSON.parse(localStorage.getItem("notes")) || [];

        notes.push({
            id: Date.now(),
            title: title,
            subject: subject,
            semester: semester,
            description: description,
            fileName: file.name,
            userId: currentUser.id,
            username: currentUser.username,
            downloads: 0,
            date: new Date().toISOString()
        });

        localStorage.setItem("notes", JSON.stringify(notes));

        msg.style.color = "green";
        msg.innerText = "Upload successful! (Using local storage)";
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

        // Clear fields
        document.getElementById("title").value = "";
        document.getElementById("subject").value = "";
        document.getElementById("sem").value = "";
        document.getElementById("desc").value = "";
        document.getElementById("file").value = "";
    }
}

// navigation
function go(page) {
    window.location.href = page;
}