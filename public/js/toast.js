// Initialize Lucide icons if available
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}

// Create and show a toast
function toast(type, title, message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const icons = {
    success: "check-circle",
    info: "info",
    warn: "alert-triangle",
    error: "x-circle",
  };

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;

  el.innerHTML = `
    <div class="toast-icon-wrapper">
      <i data-lucide="${icons[type] || "info"}" style="width:20px;height:20px;"></i>
    </div>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-desc">${message}</span>
    </div>
    <button class="toast-close" aria-label="Close">
      <i data-lucide="x" style="width:16px;height:16px;"></i>
    </button>
    <div class="progress-bar"><div class="progress-fill"></div></div>
  `;

  container.appendChild(el);

  // Render icons inside this toast only
  if (typeof lucide !== "undefined") {
    lucide.createIcons({
      attrs: { "stroke-width": 2.5 },
      nameAttr: "data-lucide",
      root: el,
    });
  }

  // Progress and removal
  const duration = 6000;
  const fill = el.querySelector(".progress-fill");
  if (fill) {
    fill.style.width = "100%"; // start full
    fill.style.transition = `width ${duration}ms linear`;
    // shrink to 0% so the bar animates left-to-right
    setTimeout(() => (fill.style.width = "0%"), 10);
  }

  const closeBtn = el.querySelector(".toast-close");
  if (closeBtn) closeBtn.onclick = () => removeToast(el);

  setTimeout(() => removeToast(el), duration);
}

function removeToast(el) {
  if (!el || el.classList.contains("hide")) return;
  el.classList.add("hide");
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  const toastData = document.getElementById("toast-data");

  if (!toastData) return;

  let toasts = [];

  try {
    toasts = JSON.parse(toastData.textContent);
  } catch (err) {
    console.error("Invalid toast data", err);
    return;
  }

  toasts.forEach((t) => {
    toast(t.type || "info", t.title || "Notification", t.message || "");
  });
});
