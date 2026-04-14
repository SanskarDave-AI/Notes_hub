console.log("IIIT Raichur Notes Hub Loaded");


const getStartedBtn = document.querySelector(".hero .primary");
const browseBtn = document.querySelector(".hero .outline");


getStartedBtn.addEventListener("click", () => {
    alert("Redirecting to Register Page...");
    
});


browseBtn.addEventListener("click", () => {
    alert("Opening Notes Section...");
    document.querySelector(".why").scrollIntoView({
        behavior: "smooth"
    });
});



const navItems = document.querySelectorAll(".nav-links li");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const text = item.innerText.toLowerCase();

        if (text === "home") {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        if (text === "browse") {
            document.querySelector(".why").scrollIntoView({
                behavior: "smooth"
            });
        }

        if (text === "about") {
            alert("About section coming soon...");
        }
    });
});