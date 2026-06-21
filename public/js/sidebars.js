// DOM Elements
const sidebarLeft = document.getElementById("sidebarLeft");
const sidebarRight = document.getElementById("sidebarRight");
const overlay = document.getElementById("overlay");
const openMenuSidebar = document.getElementById("openMenuSidebar");
const openNotifSidebar = document.getElementById("openNotifSidebar");
const closeLeftSidebar = document.getElementById("closeLeftSidebar");
const closeRightSidebar = document.getElementById("closeRightSidebar");
const header = document.getElementById("header");

// Toggle Left Sidebar (Burger Menu)
function toggleLeftSidebar() {
  sidebarLeft.classList.toggle("open");
  overlay.classList.toggle("active");
  openMenuSidebar.classList.toggle("active");
  preventBodyScroll();
}

// Toggle Right Sidebar (Notifications)
function toggleRightSidebar() {
  sidebarRight.classList.toggle("open");
  overlay.classList.toggle("active");
  preventBodyScroll();
}

// Close both sidebars when clicking overlay
overlay.addEventListener("click", () => {
  sidebarLeft.classList.remove("open");
  sidebarRight.classList.remove("open");
  overlay.classList.remove("active");
  openMenuSidebar.classList.remove("active");
  preventBodyScroll();
});

// Event Listeners
openMenuSidebar.addEventListener("click", toggleLeftSidebar);
openNotifSidebar.addEventListener("click", toggleRightSidebar);
closeLeftSidebar.addEventListener("click", toggleLeftSidebar);
closeRightSidebar.addEventListener("click", toggleRightSidebar);

// Close sidebars when clicking escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    sidebarLeft.classList.remove("open");
    sidebarRight.classList.remove("open");
    overlay.classList.remove("active");
    openMenuSidebar.classList.remove("active");
    preventBodyScroll();
  }
});

// Header scroll effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Prevent body scroll when sidebars are open
function preventBodyScroll() {
  if (
    sidebarLeft.classList.contains("open") ||
    sidebarRight.classList.contains("open")
  ) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}
