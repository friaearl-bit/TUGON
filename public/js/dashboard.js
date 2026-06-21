import {
  initModal,
  confirm,
  success,
  error,
  // form,
} from "./modal.js";
import { loadNotifications, loadUnreadCount } from "./notifications.js";

// function complaintConfirmModal(target, confirmText, successText) {
async function complaintConfirmModal(
  e,
  target,
  action,
  irreversible = false,
  confirmMessage = null,
  successMessage = null,
) {
  const link = e.target.closest(target);
  if (!link) return;

  e.preventDefault();

  const url = link.getAttribute("href");

  const name =
    link.dataset.name ||
    link.closest("tr")?.querySelector("td")?.innerText ||
    "this item";

  const ok = await confirm(
    (confirmMessage = `Are you sure you want to <strong><i>${action}</i></strong> complaint <strong>#${name}</strong>?${irreversible ? " This action cannot be undone." : ""}`),
  );
  if (!ok) return;

  await success(successMessage || `Item ${action}d successfully`);
  window.location.href = link.href;
}

document.addEventListener("DOMContentLoaded", () => {
  initModal();

  document.addEventListener("click", async (e) =>
    complaintConfirmModal(e, ".action-btn.delete", "soft-delete"),
  );
  document.addEventListener("click", async (e) =>
    complaintConfirmModal(e, ".action-btn.restore", "restore"),
  );
  document.addEventListener("click", async (e) =>
    complaintConfirmModal(e, ".action-btn.hard-delete", "forever delete", true),
  );

  // SHOW DELETED COMPLAINTS
  const toggle = document.querySelector('[data-toggle="deleted-filter"]');
  if (!toggle) return;

  toggle.addEventListener("change", (e) => {
    const url = new URL(window.location);
    if (e.target.checked) {
      url.searchParams.set("isDeleted", "true");
    } else {
      url.searchParams.delete("isDeleted");
    }
    window.location.href = url.toString();
  });
});
