import "./lucide.min.js";
// script((src = "/js/lucide.min.js"));

const sidebar = document.querySelector("#sidebarRight");
const list = document.querySelector("#notifList");

export async function loadNotifications() {
  const res = await fetch("/notifications");
  const data = await res.json();

  list.innerHTML = data.map(renderItem).join("");
  lucide.createIcons();
}

function renderItem(n) {
  return `
    <div class="notif-item ${n.read ? "" : "unread"}"
         data-id="${n.id}"
         data-link="${n.link || ""}">

      <div class="notif-icon">
        <i data-lucide="${getIcon(n.type)}"></i>
      </div>

      <div class="notif-content">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <span class="notif-time">
          ${timeAgo(new Date(n.createdAt))}
        </span>
      </div>
    </div>
  `;
}

function getIcon(type) {
  switch (type) {
    case "TASK":
      return "circle-check";
    case "COMPLAINT":
      return "circle-alert";
    default:
      return "bell";
  }
}

function timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hrs ago`;
  return `${Math.floor(mins / 1440)} days ago`;
}

const badge = document.querySelector("#notifBadge");

export async function loadUnreadCount() {
  const res = await fetch("/notifications/unread-count");

  if (!res.ok) return;

  const data = await res.json();

  const count = data.count;

  if (count > 0) {
    badge.textContent = count;
    // badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

// // Mark as read
// list.addEventListener("click", async (e) => {
//   const item = e.target.closest(".notif-item");
//   if (!item) return;

//   const id = item.dataset.id;

//   await fetch(`/notifications/read/${id}`, {
//     method: "POST",
//   });

//   item.classList.remove("unread");

//   const link = item.dataset.link;
//   if (link) window.location.href = link;
// });

// Refresh badge count
list.addEventListener("click", async (e) => {
  const item = e.target.closest(".notif-item");
  if (!item) return;

  const link = item.dataset.link;

  await fetch(`/notifications/read/${item.dataset.id}`, {
    method: "POST",
  });

  console.log("notif list:", list);

  console.log("ITEM:", item);
  console.log("LINK:", link);

  if (link) {
    item.classList.remove("unread");
    loadUnreadCount();
    window.location.href = link;
  }
});
