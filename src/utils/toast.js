export function addToast(req, res, toast) {
  if (!req.toasts) {
    try {
      req.toasts = JSON.parse(req.cookies.toast || "[]");
    } catch {
      req.toasts = [];
    }
  }

  req.toasts.push({
    ...toast,
    scope: toast.scope || "toast", // NEW
  });

  res.cookie("toast", JSON.stringify(req.toasts), {
    httpOnly: true,
    maxAge: 10000,
  });
}

export function addFlash(req, res, messages) {
  const list = Array.isArray(messages) ? messages : [messages];

  for (const msg of list) {
    addToast(req, res, {
      scope: "flash",
      type: msg.type || "error",
      message: msg.message,
    });
  }
}

// USAGE: Set toast in cookie
// addToast(req, res, {
//   type: "success",
//   title: "Success",
//   message: "Complaint submitted successfully.",
// });
