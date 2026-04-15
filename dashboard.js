// Load dashboard data
async function loadDashboard() {
    localStorage.removeItem("notes");

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/dashboard', {
            headers: {
                'Authorization': token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById("notesCount").innerText = data.totalUploads || data.files.length;
            document.getElementById("downloadCount").innerText = data.totalDownloads || 0;
            displayRecentNotes(data.files.slice(0, 5));
            return;
        }
    } catch (error) {
        console.log("Server not available, using localStorage fallback");
        // Fallback to localStorage
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        let notes = JSON.parse(localStorage.getItem("notes")) || [];
        const totalUploads = notes.length;
        const totalDownloads = notes.reduce((sum, note) => sum + (note.downloads || 0), 0);

        document.getElementById("notesCount").innerText = totalUploads;
        document.getElementById("downloadCount").innerText = totalDownloads;
        displayRecentNotes(notes.slice(0, 5));
    }
}

// Display recent notes
function displayRecentNotes(notes) {
    const recentContainer = document.querySelector(".recent");
    recentContainer.innerHTML = "<h2>Recent Notes</h2>";

    if (notes.length === 0) {
        recentContainer.innerHTML += "<p>No notes uploaded yet.</p>";
        return;
    }

    notes.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note");

        div.innerHTML = `
            <span>${note.title || note.originalname} (${note.downloads || 0} downloads)</span>
            <button onclick="downloadNote('${note._id}')">Download</button>
        `;

        recentContainer.appendChild(div);
    });
}

// Download note
async function downloadNote(noteId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/download/${noteId}`, {
            headers: {
                'Authorization': token,
            },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            alert('Download failed');
        }
    } catch (error) {
        console.log('Download error:', error);
        alert('Download failed');
    }
}

// Navigation
function goUpload() {
    window.location.href = "upload.html";
}

function goBrowse() {
    window.location.href = "browse.html";
}

async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = "index.html";
}

// Load dashboard on page load
loadDashboard();