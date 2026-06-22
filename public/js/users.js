function openProfileModal(userId, viewOnly = false) {
  const userProfileModal = document.getElementById("userProfileModal");
  if (!userProfileModal) return;

  fetch(`/user/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      const user = data.user;
      const departments = data.departments;
      const canEdit = data.canEdit && !viewOnly;

      // === SAFETY WRAPPERS ===
      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "";
      };
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || "";
      };
      const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(value);
      };
      const setClass = (id, className) => {
        const el = document.getElementById(id);
        if (el) el.className = className;
      };

      // === AVATAR ===
      let initials = "U";
      if (user.firstName && user.lastName) {
        initials = (
          user.firstName.charAt(0) + user.lastName.charAt(0)
        ).toUpperCase();
      } else if (user.name) {
        const words = user.name.trim().split(/\s+/).filter(Boolean);
        initials = words
          .slice(0, 2)
          .map((w) => w.charAt(0).toUpperCase())
          .join("");
      } else if (user.fullname) {
        const words = user.fullname.trim().split(/\s+/).filter(Boolean);
        initials = words
          .slice(0, 2)
          .map((w) => w.charAt(0).toUpperCase())
          .join("");
      }
      setText("profileAvatar", initials);

      // === DISPLAY FIELDS (use setText) ===
      const fullName =
        user.fullname ||
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unknown";
      setText("profileFullName", fullName);
      setText("profileUsername", user.username || "N/A");

      // === INPUT FIELDS (use setValue) ===
      setValue("profileFirstName", user.firstName || "");
      setValue("profileMiddleName", user.middleName || "");
      setValue("profileLastName", user.lastName || "");
      setValue("profileEmail", user.email || "");
      setValue("profileContactNumber", user.contactNumber || "");
      setValue("profileAddress", user.address || "");

      // === ACCOUNT SETTINGS ===
      if (canEdit) {
        setValue("profileRole", user.role || "CITIZEN");
        const deptSelect = document.getElementById("profileDepartment");
        if (deptSelect && departments) {
          deptSelect.innerHTML =
            '<option value="">None</option>' +
            departments
              .map((d) => `<option value="${d.id}">${d.name}</option>`)
              .join("");
          deptSelect.value = user.departmentId || "";
        }
        setChecked("profileStatusToggle", user.isActive || false);
      } else {
        setText("profileRoleDisplay", user.role || "N/A");
        setText("profileDepartmentDisplay", user.department?.name || "None");
        const statusDisplay = document.getElementById("profileStatusDisplay");
        if (statusDisplay) {
          statusDisplay.textContent = user.isActive ? "Active" : "Inactive";
          statusDisplay.className = user.isActive
            ? "user-status active"
            : "user-status inactive";
        }
      }

      // === SHOW MODAL ===
      userProfileModal.classList.add("show");
      userProfileModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      document
        .querySelector('[data-action="save"]')
        ?.addEventListener("click", () => {
          updateUser(userId);
        });
    })
    .catch((error) => console.error("Error loading user:", error));
}

async function updateUser(userId) {
  try {
    const payload = {
      firstName: document.getElementById("profileFirstName").value,
      middleName: document.getElementById("profileMiddleName").value,
      lastName: document.getElementById("profileLastName").value,

      email: document.getElementById("profileEmail").value,
      contactNumber: document.getElementById("profileContactNumber").value,
      address: document.getElementById("profileAddress").value,

      username: document.getElementById("profileUsername").textContent,

      role: document.getElementById("profileRole")?.value,

      departmentId: document.getElementById("profileDepartment")?.value || null,

      isActive: document.getElementById("profileStatusToggle")?.checked,
    };

    payload.fullname = [payload.firstName, payload.middleName, payload.lastName]
      .filter(Boolean)
      .join(" ");

    const response = await fetch(`/user/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update user");
    }

    // showToast({
    //   type: "success",
    //   title: "User Updated",
    //   message: "User information was updated successfully.",
    // });

    closeUserProfileModal();

    setTimeout(() => {
      window.location.reload();
    }, 800);
  } catch (error) {
    console.error(error);

    // showToast({
    //   type: "error",
    //   title: "Update Failed",
    //   message: error.message,
    // });
  }
}

// Close modal
function closeUserProfileModal() {
  userProfileModal.classList.remove("show");
  userProfileModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Event listeners
userProfileModal
  .querySelector(".user-profile-close")
  .addEventListener("click", closeUserProfileModal);
userProfileModal.addEventListener("click", (e) => {
  if (e.target === userProfileModal) closeUserProfileModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeUserProfileModal();
});

// Button actions
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]").dataset.action;
    if (action === "close") closeUserProfileModal();
    // if (action === "save") updateUser(userId);
  });
});

// Open modal from button click
document.querySelectorAll(".js-open-profile").forEach((btn) => {
  btn.addEventListener("click", () => {
    const userId = btn.dataset.userId;
    openProfileModal(userId);
  });
});
