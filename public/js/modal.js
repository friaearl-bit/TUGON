let modal;
let titleEl;
let contentEl;

let resolver = null;
let lastFocused = null;

function show() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hide() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
}

function resolve(value) {
  hide();

  resolver?.(value);
  resolver = null;
}

export function initModal() {
  modal = document.getElementById("modal");
  titleEl = document.getElementById("modalTitle");
  contentEl = document.getElementById("modalContent");

  modal.addEventListener("click", (e) => {
    const action = e.target?.dataset?.action;

    if (action === "cancel") resolve(false);
    if (action === "confirm") resolve(true);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") resolve(false);
  });
}

function setAutoFocus() {
  // 1. first input if exists
  const input = modal.querySelector("input, textarea, select");
  if (input) {
    input.focus();
    return;
  }

  // 2. else confirm button
  const confirmBtn = modal.querySelector("[data-action='confirm']");
  if (confirmBtn) {
    confirmBtn.focus();
  }
}

export function open({
  title = "",
  html = "",
  showCancel = true,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmClass = "btn-primary",
}) {
  lastFocused = document.activeElement;

  titleEl.textContent = title;

  contentEl.innerHTML = html;
  // contentEl.innerHTML = html;
  // <div id="modalContent"></div>;

  contentEl.innerHTML += `
    <div class="footer-actions">
      <div class="button-container">
        ${showCancel ? `<button class="btn-secondary flex-1" data-action="cancel">${cancelText}</button>` : ""}
        <button class="${confirmClass ? confirmClass : "btn-primary"} flex-1" data-action="confirm">${confirmText}</button>
      </div>
    </div>
  `;

  show();

  setTimeout(setAutoFocus, 0);

  return new Promise((res) => {
    resolver = res;
  });
}

export function confirm(message) {
  return open({
    title: "Confirm",
    html: `<p>${message}</p>`,
    // confirmText: "Confirm", // "Yes",
    confirmText: "Yes", // "Confirm",,
    // cancelText: "Cancel", //"No",
    cancelText: "No", // "Cancel",
    confirmClass: "btn-danger",
  });
}

export function success(message) {
  return open({
    title: "Success",
    html: `<div class="flash-card success"><p>${message}</p></div>`,
    showCancel: false,
    confirmText: "OK",
  });
}

export function error(message) {
  return open({
    title: "Error",
    html: `<div class="flash-card error"><p>${message}</p></div>`,
    showCancel: false,
    confirmText: "Close",
  });
}

export function form({
  title,
  fields = [],
  submitText = "Submit",
  cancelText = "Cancel",
}) {
  return new Promise((resolve) => {
    lastFocused = document.activeElement;

    titleEl.textContent = title;

    contentEl.innerHTML = `
      <form id="modalForm">
        ${fields
          .map(
            (field) => `
          <div class="field">
            <label>${field.label}</label>
            <input
              name="${field.name}"
              type="${field.type || "text"}"
              value="${field.value ?? ""}"
            />
          </div>
        `,
          )
          .join("")}

        <div class="footer-actions">
          <div class="button-container">
            <button
              type="button"
              class="btn-secondary"
              id="modalCancel"
            >
              ${cancelText}
            </button>

            <button
              type="submit"
              class="btn-primary"
            >
              ${submitText}
            </button>
          </div>
        </div>
      </form>
    `;

    const formEl = contentEl.querySelector("#modalForm");

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = {};

      for (const element of formEl.elements) {
        if (element.name) {
          data[element.name] = element.value;
        }
      }

      hide();
      resolve(data);
    });

    contentEl.querySelector("#modalCancel").addEventListener("click", () => {
      hide();
      resolve(null);
    });

    show();
    setTimeout(setAutoFocus, 0);
  });
}

export function profileEdit(currentUser = {}) {
  return form({
    title: "Edit Profile",
    submitText: "Save Changes",

    fields: [
      {
        name: "username",
        label: "Username",
        value: currentUser.username,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        value: currentUser.email,
      },
      {
        name: "firstName",
        label: "First Name",
        value: currentUser.firstName,
      },
      {
        name: "lastName",
        label: "Last Name",
        value: currentUser.lastName,
      },
      {
        name: "contactNumber",
        label: "Phone",
        value: currentUser.contactNumber,
      },
    ],
  });
}

// export { initModal, confirm, success, error };

// let modal;
// let modalTitle;
// let modalContent;

// let modalClose;
// let modalCancelBtn;
// let modalConfirmBtn;

// let resolver = null;

// function show() {
//   modal.classList.add("show");
//   modal.setAttribute("aria-hidden", "false");
// }

// function hide() {
//   modal.classList.remove("show");
//   modal.setAttribute("aria-hidden", "true");
// }

// function resolveAndClose(value) {
//   hide();

//   if (resolver) {
//     resolver(value);
//     resolver = null;
//   }
// }

// export function initModal() {
//   modal = document.getElementById("modal");
//   modalTitle = document.getElementById("modalTitle");
//   modalContent = document.getElementById("modalContent");

//   modalClose = document.getElementById("modalClose");
//   modalCancelBtn = document.getElementById("modalCancelBtn");
//   modalConfirmBtn = document.getElementById("modalConfirmBtn");

//   modalClose?.addEventListener("click", () => resolveAndClose(false));
//   modalCancelBtn?.addEventListener("click", () => resolveAndClose(false));
//   modalConfirmBtn?.addEventListener("click", () => resolveAndClose(true));

//   document.addEventListener("keydown", (e) => {
//     if (e.key === "Escape" && modal.classList.contains("show")) {
//       resolveAndClose(false);
//     }
//   });
// }

// export function confirm(message, title = "Confirm") {
//   modalTitle.textContent = title;
//   modalContent.innerHTML = `<p>${message}</p>`;

//   show();

//   return new Promise((res) => {
//     resolver = res;
//   });
// }

// export function success(message, title = "Success") {
//   modalTitle.textContent = title;

//   modalContent.innerHTML = `
//     <div class="flash-card success">
//       <p>${message}</p>
//     </div>
//   `;

//   confirmBtn.style.display = "none";
//   cancelBtn.textContent = "OK";

//   show();

//   return new Promise((res) => {
//     resolver = () => {
//       resetButtons();
//       res(true);
//     };
//   });
// }

// export function error(message, title = "Error") {
//   modalTitle.textContent = title;

//   modalContent.innerHTML = `
//     <div class="flash-card error">
//       <p>${message}</p>
//     </div>
//   `;

//   confirmBtn.style.display = "none";
//   cancelBtn.textContent = "Close";

//   show();

//   return new Promise((res) => {
//     resolver = () => {
//       resetButtons();
//       res(true);
//     };
//   });
// }

// export function warning(message, title = "Warning") {
//   modalTitle.textContent = title;

//   modalContent.innerHTML = `
//     <div class="flash-card warning">
//       <p>${message}</p>
//     </div>
//   `;

//   confirmBtn.style.display = "inline-block";
//   confirmBtn.textContent = "Proceed";

//   cancelBtn.textContent = "Cancel";

//   show();

//   return new Promise((res) => {
//     resolver = res;
//   });
// }

// function resetButtons() {
//   confirmBtn.style.display = "inline-block";
//   confirmBtn.textContent = "Confirm";

//   cancelBtn.textContent = "Cancel";
// }

// // alert();
// // error();
// // success();
// // form();
