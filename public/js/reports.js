/**
 * Analytics Dashboard - Chart.js
 */

document.addEventListener("DOMContentLoaded", async () => {
  const ctx = {
    status: document.getElementById("statusChart"),
    priority: document.getElementById("priorityChart"),
    department: document.getElementById("departmentChart"),
    category: document.getElementById("categoryChart"),
    monthly: document.getElementById("monthlyChart"),
    staff: document.getElementById("staffChart"),
  };

  // Chart.js default configuration
  Chart.defaults.font.family =
    "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  Chart.defaults.color = "#666";
  Chart.defaults.plugins.legend.display = true;

  // Fetch reports data
  const response = await fetch("/admin/reports/data");
  const data = await response.json();

  if (!data.success) {
    showError("Failed to load reports data");
    return;
  }

  // Initialize all charts
  initStatusChart(ctx.status, data.statusDistribution);
  initPriorityChart(ctx.priority, data.priorityDistribution);
  initDepartmentChart(ctx.department, data.departmentDistribution);
  initCategoryChart(ctx.category, data.categoryDistribution);
  initMonthlyChart(ctx.monthly, data.monthlyTrend);
  initStaffChart(ctx.staff, data.staffPerformance);
  updateSummaryCards(data.summary);
  updateResolutionMetrics(data.resolutionMetrics);
});

/**
 * Status Distribution - Doughnut Chart
 */
function initStatusChart(canvas, data) {
  if (!canvas) return;

  const colors = [
    "#FF6384", // Pending (red)
    "#36A2EB", // Assigned (blue)
    "#FFCE56", // In Progress (yellow)
    "#4BC0C0", // Resolved (teal)
    "#FF9F40", // Rejected (orange)
    "#9966FF", // Closed (purple)
  ];

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((context.parsed / total) * 100);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Priority Distribution - Pie Chart
 */
function initPriorityChart(canvas, data) {
  if (!canvas) return;

  const priorityColors = {
    LOW: "#90EE90",
    NORMAL: "#32CD32",
    HIGH: "#FFD700",
    CRITICAL: "#FF4500",
  };

  new Chart(canvas, {
    type: "pie",
    data: {
      labels: data.labels.map((l) => l.replace("_", " ")),
      datasets: [
        {
          data: data.data,
          backgroundColor: data.labels.map(
            (l) => priorityColors[l.toUpperCase()] || "#999",
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((context.parsed / total) * 100);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Department Distribution - Horizontal Bar Chart
 */
function initDepartmentChart(canvas, data) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Complaints",
          data: data.data,
          backgroundColor: "#36A2EB",
          borderColor: "#1E88E5",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `Complaints: ${context.parsed.x}`,
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } },
        y: { grid: { display: false } },
      },
    },
  });
}

/**
 * Category Distribution - Bar Chart
 */
function initCategoryChart(canvas, data) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Complaints",
          data: data.data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

/**
 * Monthly Trend - Line Chart
 */
function initMonthlyChart(canvas, data) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Complaints",
          data: data.data,
          borderColor: "#36A2EB",
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

/**
 * Staff Performance - Horizontal Bar Chart
 */
function initStaffChart(canvas, data) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Complaints Assigned",
          data: data.data,
          backgroundColor: "#4BC0C0",
          borderColor: "#26A69A",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } },
        y: { grid: { display: false } },
      },
    },
  });
}

/**
 * Update Summary Cards
 */
function updateSummaryCards(summary) {
  const cards = [
    {
      id: "totalComplaints",
      value: summary.totalComplaints,
      label: "Total Complaints",
    },
    {
      id: "pendingComplaints",
      value: summary.pendingComplaints,
      label: "Pending",
    },
    {
      id: "resolvedComplaints",
      value: summary.resolvedComplaints,
      label: "Resolved",
    },
    {
      id: "resolutionRate",
      value: `${summary.resolutionRate}%`,
      label: "Resolution Rate",
    },
    {
      id: "avgResolutionTime",
      value: `${summary.resolutionMetrics?.averageHours || 0}h`,
      label: "Avg Resolution Time",
    },
    {
      id: "activeDepartments",
      value: summary.activeDepartments,
      label: "Active Departments",
    },
  ];

  cards.forEach((card) => {
    const el = document.getElementById(card.id);
    if (el) {
      el.querySelector(".card-value").textContent = card.value;
      el.querySelector(".card-label").textContent = card.label;
    }
  });
}

/**
 * Update Resolution Metrics
 */
function updateResolutionMetrics(metrics) {
  const container = document.getElementById("resolutionMetrics");
  if (!container) return;

  container.innerHTML = `
    <div class="metric">
      <span class="metric-value">${metrics.averageHours}h</span>
      <span class="metric-label">Average</span>
    </div>
    <div class="metric">
      <span class="metric-value">${metrics.fastest}h</span>
      <span class="metric-label">Fastest</span>
    </div>
    <div class="metric">
      <span class="metric-value">${metrics.slowest}h</span>
      <span class="metric-label">Slowest</span>
    </div>
    <div class="metric">
      <span class="metric-value">${metrics.totalResolved}</span>
      <span class="metric-label">Total Resolved</span>
    </div>
  `;
}

function showError(message) {
  const errorEl = document.getElementById("reportsError");
  if (errorEl) errorEl.textContent = message;
}
