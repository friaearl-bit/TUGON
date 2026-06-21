// Modal Controller
const userProfileModal = document.getElementById("userProfileModal");
const classUserProfileModal = document.querySelector("user-profile-modal");

// Open modal
function openProfileModal(userId, viewOnly = false) {
  userProfileModal.classList.add("show");

  // Fetch user data and populate modal
  // fetch(`/user/${userId}`)
  //   .then((response) => response.json())
  //   .then((user) => {
  //     // Populate modal fields
  //     document.getElementById("profileAvatar").textContent =
  //       (user.firstName?.charAt(0) || "") +
  //       (user.lastName?.charAt(0) || user.name?.charAt(0) || "U");
  //     document.getElementById("profileFullName").textContent =
  //       user.fullname ||
  //       user.name ||
  //       `${user.firstName || ""} ${user.lastName || ""}` ||
  //       "Unknown";
  //     document.getElementById("profileEmail").textContent =
  //       user.email || "No email";
  //     document.getElementById("profileUsername").textContent =
  //       user.username || "N/A";

  //     if (viewOnly || user.role !== "SUPERADMIN") {
  //       // View only mode
  //       document.getElementById("profileFirstName").value =
  //         user.firstName || "";
  //       document.getElementById("profileMiddleName").value =
  //         user.middleName || "";
  //       document.getElementById("profileLastName").value = user.lastName || "";
  //       document.getElementById("profileContactNumber").value =
  //         user.contactNumber || "";
  //       document.getElementById("profileAddress").value = user.address || "";
  //       document.getElementById("profileRoleDisplay").textContent =
  //         user.role || "N/A";
  //       document.getElementById("profileDepartmentDisplay").textContent =
  //         user.department?.name || "None";
  //       const statusDisplay = document.getElementById("profileStatusDisplay");
  //       statusDisplay.className = user.isActive
  //         ? "user-status active"
  //         : "user-status inactive";
  //       statusDisplay.textContent = user.isActive ? "Active" : "Inactive";
  //     } else {
  //       // Edit mode
  //       document.getElementById("profileFirstName").value =
  //         user.firstName || "";
  //       document.getElementById("profileMiddleName").value =
  //         user.middleName || "";
  //       document.getElementById("profileLastName").value = user.lastName || "";
  //       document.getElementById("profileContactNumber").value =
  //         user.contactNumber || "";
  //       document.getElementById("profileAddress").value = user.address || "";
  //       document.getElementById("profileRole").value = user.role || "CITIZEN";
  //       document.getElementById("profileDepartment").value =
  //         user.departmentId || "";
  //       document.getElementById("profileStatusToggle").checked = user.isActive;
  //     }

  //     // Show modal
  //     userProfileModal.classList.add("show");
  //     userProfileModal.setAttribute("aria-hidden", "false");
  //     document.body.style.overflow = "hidden";
  //   });
}

// Close modal
function closeProfileModal() {
  userProfileModal.classList.remove("show");
  userProfileModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Event listeners
userProfileModal
  .querySelector(".user-profile-close")
  .addEventListener("click", closeProfileModal);
userProfileModal.addEventListener("click", (e) => {
  if (e.target === userProfileModal) closeProfileModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfileModal();
});

// Button actions
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]").dataset.action;
    if (action === "close") closeProfileModal();
    if (action === "save") saveUserChanges();
  });
});

function saveUserChanges() {
  // Save logic
  closeProfileModal();
}

// Open modal from button click
document.querySelectorAll(".js-open-profile").forEach((btn) => {
  btn.addEventListener("click", () => {
    const userId = btn.dataset.userId;
    const viewOnly = btn.dataset.viewOnly === "true";
    openProfileModal(userId, viewOnly);
  });
});

// // =============================================
// // MODAL STATE
// // =============================================
// let currentUserId = null;
// let isViewOnly = false;

// // =============================================
// // INITIALIZE
// // =============================================
// document.addEventListener("DOMContentLoaded", () => {
//   const modal = document.getElementById("userProfileModal");

//   // Close modal on X button
//   document.addEventListener("click", (e) => {
//     if (e.target.closest(".user-profile-close")) closeProfileModal();
//     if (e.target.closest(".btn-secondary")) closeProfileModal();
//   });

//   // Open modal on edit/view button
//   document.addEventListener("click", (e) => {
//     const openBtn = e.target.closest(".js-open-profile");
//     if (openBtn) {
//       currentUserId = Number(openBtn.dataset.userId);
//       isViewOnly = openBtn.dataset.viewOnly === "true";
//       openProfileModal(currentUserId, isViewOnly);
//     }
//   });

//   // Save changes on save button
//   document.addEventListener("click", (e) => {
//     if (e.target.closest(".btn-primary")?.closest(".profile-actions")) {
//       saveUserChanges();
//     }
//   });
// });

// // =============================================
// // OPEN MODAL
// // =============================================
// async function openProfileModal(userId, viewOnly) {
//   const modal = document.getElementById("userProfileModal");
//   modal.classList.add("loading");

//   try {
//     const response = await fetch(`/user/${userId}`);
//     const data = await response.json();

//     if (!data.success) throw new Error(data.error || "Failed to load user");

//     modal.dataset.userId = userId;
//     modal.dataset.viewOnly = viewOnly;
//     populateModalFields(data.user, data.departments, viewOnly);
//     modal.style.display = "block";
//   } catch (error) {
//     console.error("Modal error:", error);
//     alert(error.message);
//   } finally {
//     modal.classList.remove("loading");
//   }
// }

// // =============================================
// // POPULATE MODAL FIELDS - FIXED
// // =============================================
// function populateModalFields(user, departments, viewOnly) {
//   // Always set these
//   document.getElementById("profileFullName").textContent = user.fullname || "";
//   document.getElementById("profileEmail").textContent = user.email || "";
//   document.getElementById("profileUsername").textContent = user.username || "";
//   document.getElementById("profileAvatar").textContent = getInitials(user);

//   // Input fields (always exist)
//   const firstNameInput = document.getElementById("profileFirstName");
//   const lastNameInput = document.getElementById("profileLastName");
//   const middleNameInput = document.getElementById("profileMiddleName");
//   const contactInput = document.getElementById("profileContactNumber");
//   const addressInput = document.getElementById("profileAddress");

//   if (firstNameInput) firstNameInput.value = user.firstName || "";
//   if (lastNameInput) lastNameInput.value = user.lastName || "";
//   if (middleNameInput) middleNameInput.value = user.middleName || "";
//   if (contactInput) contactInput.value = user.contactNumber || "";
//   if (addressInput) addressInput.value = user.address || "";

//   // Role/Department/Status - conditional
//   if (viewOnly) {
//     // View mode: Show display elements
//     const roleDisplay = document.getElementById("profileRoleDisplay");
//     const deptDisplay = document.getElementById("profileDepartmentDisplay");
//     const statusDisplay = document.getElementById("profileStatusDisplay");

//     if (roleDisplay) roleDisplay.textContent = user.role || "";
//     if (deptDisplay) deptDisplay.textContent = user.department?.name || "None";
//     if (statusDisplay) {
//       statusDisplay.textContent = user.isActive ? "Active" : "Inactive";
//       statusDisplay.className = user.isActive ? "active" : "inactive";
//     }
//   } else {
//     // Edit mode: Show input elements
//     const roleSelect = document.getElementById("profileRole");
//     const deptSelect = document.getElementById("profileDepartment");
//     const statusToggle = document.getElementById("profileStatusToggle");

//     if (roleSelect) roleSelect.value = user.role || "";
//     if (deptSelect) {
//       deptSelect.innerHTML = `
//         <option value="">None</option>
//         ${departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join("")}
//       `;
//       deptSelect.value = user.departmentId || "";
//     }
//     if (statusToggle) statusToggle.checked = Boolean(user.isActive);
//   }
// }

// // =============================================
// // SAVE CHANGES - FIXED
// // =============================================
// async function saveUserChanges() {
//   const modal = document.getElementById("userProfileModal");
//   const userId = Number(modal.dataset.userId);

//   // Use safe accessors - check if elements exist
//   const formData = {
//     firstName: getValue("profileFirstName"),
//     lastName: getValue("profileLastName"),
//     middleName: getValue("profileMiddleName"),
//     fullname: getText("profileFullName"),
//     email: getText("profileEmail"),
//     contactNumber: getValue("profileContactNumber"),
//     address: getValue("profileAddress"),
//     username: getText("profileUsername"),
//     role: getValue("profileRole"),
//     departmentId: getValue("profileDepartment"),
//     isActive: getChecked("profileStatusToggle"),
//   };

//   try {
//     const response = await fetch(`/user/${userId}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(formData),
//     });

//     const result = await response.json();
//     if (result.success) {
//       closeProfileModal();
//       alert("User updated successfully!");
//       location.reload();
//     } else {
//       alert("Error: " + result.error);
//     }
//   } catch (error) {
//     console.error("Save error:", error);
//     alert("Failed to save changes");
//   }
// }

// // =============================================
// // HELPER FUNCTIONS - SAFE ACCESSORS
// // =============================================
// function getValue(id) {
//   const el = document.getElementById(id);
//   return el ? el.value : null;
// }

// function getText(id) {
//   const el = document.getElementById(id);
//   return el ? el.textContent : null;
// }

// function getChecked(id) {
//   const el = document.getElementById(id);
//   return el ? el.checked : null;
// }

// function getInitials(user) {
//   const first = user.firstName ? user.firstName.charAt(0) : "";
//   const last = user.lastName ? user.lastName.charAt(0) : "";
//   return (
//     (first + last).toUpperCase() || user.name?.charAt(0).toUpperCase() || "U"
//   );
// }

// // =============================================
// // CLOSE MODAL
// // =============================================
// function closeProfileModal() {
//   const modal = document.getElementById("userProfileModal");
//   if (modal) {
//     modal.style.display = "none";
//     modal.dataset.userId = "";
//     modal.dataset.viewOnly = "";
//   }
// }
