document.addEventListener("DOMContentLoaded", () => {
  const deptSelect = document.getElementById("departmentSelect");
  const staffSelect = document.getElementById("staffSelect");

  // console.log("department on load:", deptSelect.value);

  if (!deptSelect || !staffSelect) return;

  async function loadStaff(deptId, selectedStaffId = null) {
    // console.log("loading staff for", deptId);
    staffSelect.innerHTML = '<option value="">Loading...</option>';

    if (!deptId) {
      staffSelect.innerHTML = '<option value="">Select Staff</option>';
      return;
    }

    try {
      const res = await fetch(`/complaints/staff/by-department/${deptId}`);

      const staff = await res.json();

      staffSelect.innerHTML = '<option value="">Select Staff</option>';

      staff.forEach((s) => {
        const opt = document.createElement("option");

        opt.value = s.id;
        opt.textContent = s.fullname || s.name;

        if (selectedStaffId && String(selectedStaffId) === String(s.id)) {
          opt.selected = true;
        }

        staffSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);

      staffSelect.innerHTML = '<option value="">Error loading staff</option>';
    }
  }

  deptSelect.addEventListener("change", () => {
    loadStaff(deptSelect.value);
  });

  // IMPORTANT: load current department on page load
  if (deptSelect.value) {
    loadStaff(deptSelect.value, staffSelect.dataset.selected);
  }
});

// document.addEventListener("DOMContentLoaded", async () => {
//   const deptSelect = document.getElementById("departmentSelect");
//   const staffSelect = document.getElementById("staffSelect");

//   const selectedStaffId = staffSelect.dataset.selected;

//   console.log(JSON.stringify(departments, null, 2));

//   async function loadStaff(deptId, selectedStaffId = null) {
//     console.log(JSON.stringify(departments, null, 2));

//     staffSelect.innerHTML = '<option value="">Loading...</option>';

//     if (!deptId) {
//       staffSelect.innerHTML = '<option value="">Select Staff</option>';
//       return;
//     }

//     const res = await fetch(`/complaints/staff/by-department/${deptId}`);
//     const staff = await res.json();

//     staffSelect.innerHTML = '<option value="">Select Staff</option>';

//     staff.forEach((s) => {
//       const opt = document.createElement("option");

//       opt.value = s.id;
//       opt.textContent = s.fullname || s.name;

//       if (String(s.id) === String(selectedStaffId)) {
//         opt.selected = true;
//       }

//       staffSelect.appendChild(opt);
//     });
//   }

//   deptSelect.addEventListener("change", () => {
//     loadStaff(deptSelect.value);
//   });

//   if (deptSelect.value) {
//     await loadStaff(deptSelect.value);
//   }
// });

// document.addEventListener("DOMContentLoaded", async () => {
//   const deptSelect = document.getElementById("departmentSelect");
//   const staffSelect = document.getElementById("staffSelect");

//   const selectedStaffId = staffSelect.dataset.selected;

//   console.log(JSON.stringify(departments, null, 2));

//   async function loadStaff(deptId) {
//     if (!deptId) return;

//     const res = await fetch(`/complaints/staff/by-department/${deptId}`);
//     const staff = await res.json();

//     staffSelect.innerHTML = '<option value="">Select Staff</option>';

//     staff.forEach((s) => {
//       const opt = document.createElement("option");
//       opt.value = s.id;
//       opt.textContent = s.fullname || s.name;

//       if (String(s.id) === String(selectedStaffId)) {
//         opt.selected = true;
//       }

//       staffSelect.appendChild(opt);
//     });
//   }

//   deptSelect.addEventListener("change", () => {
//     loadStaff(deptSelect.value);
//   });

//   if (deptSelect.value) {
//     await loadStaff(deptSelect.value);
//   }
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const deptSelect = document.getElementById("departmentSelect");
//   const staffSelect = document.getElementById("staffSelect");

//   const selectedStaffId = staffSelect.dataset.selected;

//   if (!deptSelect || !staffSelect) return;

//   deptSelect.addEventListener("change", async () => {
//     const deptId = deptSelect.value;

//     staffSelect.innerHTML = '<option value="">Loading...</option>';

//     if (!deptId) {
//       staffSelect.innerHTML = '<option value="">Select Staff</option>';
//       return;
//     }

//     try {
//       const res = await fetch(`/complaints/staff/by-department/${deptId}`);
//       const staff = await res.json();

//       staffSelect.innerHTML = '<option value="">Select Staff</option>';

//       staff.forEach((s) => {
//         const opt = document.createElement("option");
//         opt.value = s.id;
//         opt.textContent = s.fullname || s.name;

//         if (String(s.id) === String(selectedStaffId)) {
//           opt.selected = true;
//         }

//         staffSelect.appendChild(opt);
//       });
//     } catch (err) {
//       console.error("Failed to load staff", err);
//       staffSelect.innerHTML = '<option value="">Error loading staff</option>';
//     }
//   });
// });
