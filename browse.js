const container = document.getElementById("notesContainer");
let allNotes = [];

// Load all notes on page load
async function loadNotes() {
    const token = localStorage.getItem('token');
    if (!token) {
        container.innerHTML = "<p>Please login first</p>";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/files', {
            headers: {
                'Authorization': token,
            },
        });
        if (response.ok) {
            allNotes = await response.json();
            displayNotes(allNotes);
            return;
        }
    } catch (error) {
        console.log("Server not available, using localStorage fallback");
    }

    // Fallback to localStorage
    allNotes = JSON.parse(localStorage.getItem("notes")) || [];
    displayNotes(allNotes);
}

// Display notes
function displayNotes(notes) {
    container.innerHTML = "";

    if (notes.length === 0) {
        container.innerHTML = "<p>No notes found</p>";
        return;
    }

    notes.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note-card");

        div.innerHTML = `
            <h3>${note.title || note.originalname}</h3>
            <p><strong>Subject:</strong> ${note.subject || 'N/A'} • <strong>Semester:</strong> ${note.semester || 'N/A'}</p>
            <p><strong>Description:</strong> ${note.description || 'No description'}</p>
            <p><strong>Uploaded by:</strong> ${note.uploadedBy} • <strong>Downloads:</strong> ${note.downloads || 0}</p>
            <button onclick="downloadNote('${note._id}')">Download</button>
        `;

        container.appendChild(div);
    });
}

// Search notes
function searchNotes() {
    const value = document.getElementById("searchInput").value.trim().toLowerCase();

    if (value === "") {
        displayNotes(allNotes);
        return;
    }

    const filtered = allNotes.filter(note =>
        (note.title && note.title.toLowerCase().includes(value)) ||
        (note.subject && note.subject.toLowerCase().includes(value)) ||
        (note.description && note.description.toLowerCase().includes(value)) ||
        (note.originalname && note.originalname.toLowerCase().includes(value))
    );
    displayNotes(filtered);
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
            a.download = 'download'; // or get filename from response
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
function go(page) {
    window.location.href = page;
}

// Load notes on page load
loadNotes();