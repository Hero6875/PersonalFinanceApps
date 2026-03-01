
// Dashboard controller + rendering for monthly installment status

// state
let dashboardSelectedMonth = null;
let markInProgress = new Set(); // schedule ids being processed

// initialize dashboard (call from initApp or DOMContentLoaded)
function initDashboard() {
    const monthInput = document.getElementById("monthSelector");
    const todayMonth = new Date().toISOString().slice(0, 7);

    if (monthInput) {
      // set default if empty
      if (!monthInput.value) monthInput.value = todayMonth;
      dashboardSelectedMonth = monthInput.value;
      monthInput.addEventListener("change", onMonthChange);
    } else {
      dashboardSelectedMonth = todayMonth;
    }

    // initial load
    loadMonthlyDashboard(dashboardSelectedMonth);
    loadUpcomingPayments();
    loadMonthlyStatus(
      document.getElementById(
          "monthSelector"
      ).value
  );

}

/// Chart instance (keep reference to destroy before re-rendering)
// safe chart instance holder (global so we can destroy previous chart)
window.expenseChartInstance = window.expenseChartInstance || null;

/**
 * Render a Chart.js chart for expense data.
 * Expects `chartData` in Chart.js "data" shape:
 *   { labels: [...], datasets: [{ label: "...", data: [...] , ... }] }
 */
function renderExpenseChart(chartData, canvasId = "expenseChart") {

  if (!chartData || !chartData.labels || !Array.isArray(chartData.labels)) {
    console.warn("renderExpenseChart: invalid chartData", chartData);
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`renderExpenseChart: canvas #${canvasId} not found`);
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("renderExpenseChart: cannot get canvas context");
    return;
  }

  // destroy previous instance to avoid duplicates / memory leak
  if (window.expenseChartInstance) {
    try { window.expenseChartInstance.destroy(); } catch (e) { /* ignore */ }
    window.expenseChartInstance = null;
  }

  // Create chart (pie by default, change type if you want)
  window.expenseChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets // use datasets from backend (should be array)
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" }
      }
    }
  });
}


/**
 * Safe loader that fetches the analytics endpoint and normalizes response,
 * then calls renderExpenseChart().
 *
 * Change the endpoint string below if your API uses a different path.
 */
async function loadExpenseChart(endpoint = "/analytics") {
  try {
    const res = await fetch(endpoint);

    if (!res.ok) {
      const txt = await res.text();
      console.error("loadExpenseChart: server error", res.status, txt);
      return;
    }

    // read text then parse JSON defensively (helps detect HTML error pages)
    const text = await res.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (err) {
      console.error("loadExpenseChart: response not JSON:", text.slice(0,400));
      return;
    }

    // normalize payload to Chart.js shape
    // backend may return either:
    // 1) Chart.js shaped object: { labels: [...], datasets: [...] }
    // 2) array of rows: [ { category, total }, ... ]
    let chartData = null;

    if (Array.isArray(payload)) {
      // convert array of {category, total} -> Chart.js shape
      const labels = payload.map(r => r.category ?? r.label ?? "Unknown");
      const data = payload.map(r => Number(r.total ?? r.value ?? 0));
      chartData = {
        labels,
        datasets: [{ label: "Expenses", data }]
      };
    } else if (payload && payload.labels && payload.datasets) {
      chartData = payload;
    } else if (payload && payload.data && Array.isArray(payload.data)) {
      // sometimes backend wraps: { data: [...] }
      const rows = payload.data;
      const labels = rows.map(r => r.category ?? "Unknown");
      const data = rows.map(r => Number(r.total ?? 0));
      chartData = { labels, datasets: [{ label: "Expenses", data }] };
    } else {
      console.warn("loadExpenseChart: unexpected payload shape:", payload);
      return;
    }

    // finally render
    renderExpenseChart(chartData);

  } catch (err) {
    console.error("Chart Load Error:", err);
  }
}

let expenseChart;

function renderExpenseChart(chartData) {

    const ctx =
        document.getElementById("expenseChart")
        .getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// ===============================
// UPCOMING PAYMENTS
// ===============================
async function loadUpcomingPayments() {

    const list =
        document.getElementById("upcomingList");

    if (!list) {
        console.warn("upcomingList not found");
        return;
    }

    list.innerHTML = "Loading...";

    try {

        const res =
            await fetch("/upcoming");

        if (!res.ok)
            throw new Error("API error");

        const data = await res.json();

        list.innerHTML = "";

        if (!data.length) {
            list.innerHTML =
                "<p>No upcoming payments</p>";
            return;
        }

        data.forEach(item => {

            const overdue =
                new Date(item.next_due_date) < new Date();

            const div =
                document.createElement("div");

            div.className =
                overdue
                ? "payment-card overdue"
                : "payment-card";

            div.innerHTML = `
                <b>${item.title}</b><br>
                Due: ${item.next_due_date}
                <br>
                Amount: ${item.amount}
            `;

            list.appendChild(div);
        });

    } catch(err){

        console.error(err);
        list.innerHTML =
            "<p>Failed loading upcoming payments</p>";
    }
}

async function loadMonthlyDashboard(month) {
  const list = document.getElementById("monthlyStatusList");
  const spinner = document.getElementById("loadingSpinner");
  if (!list) {
    console.warn("monthlyStatusList element not found");
    return;
  }

  if (spinner) spinner.style.display = "block";
  try {
    dashboardSelectedMonth = month || dashboardSelectedMonth || new Date().toISOString().slice(0, 7);
    const data = await fetchMonthlyStatus(dashboardSelectedMonth);
    renderMonthlyStatusList(data);
  } catch (err) {
    console.error("loadMonthlyDashboard error:", err);
    list.innerHTML = "<p>Failed to load data</p>";
  } finally {
    if (spinner) spinner.style.display = "none";
  }
}

function renderMonthlyStatusList(items) {
  const list = document.getElementById("monthlyStatusList");
  if (!list) return;
  list.innerHTML = "";

  if (!items || items.length === 0) {
    list.innerHTML = "<p>No scheduled payments for this month.</p>";
    return;
  }

  items.forEach(item => {
    // defensive defaults
    const scheduleId = item.id ?? item.schedule_id ?? null;
    const title = item.title ?? "Untitled";
    const dueDate = item.due_date ?? item.next_due_date ?? "";
    const paid = (+item.paid) === 1 || (item.paid === true);
    const paidCount = Number(item.paid_installments ?? item.paidCount ?? 0);
    const total = Number(item.total_installments ?? item.total ?? 0);
    const category = item.category ?? item.cat ?? "";
    const amount = item.amount ?? "";

    const percent = total > 0 ? Math.round((paidCount / total) * 100) : (paid ? 100 : 0);
    const overdue = dueDate ? (new Date(dueDate) < new Date() && !paid) : false;

    // container
    const card = document.createElement("div");
    card.className = "payment-card";
    if (overdue) card.classList.add("overdue");
    if (paid) card.classList.add("paid");

    // inner HTML (use IDs for buttons)
    const btnId = `payBtn-${scheduleId}`;
    const disabledAttr = (paid || markInProgress.has(scheduleId)) ? "disabled" : "";

    card.innerHTML = `
      <div class="pc-left">
        <div class="pc-title">${escapeHtml(title)}</div>
        <div class="pc-meta">${escapeHtml(category)} ${amount ? `· ${escapeHtml(amount)}` : ""}</div>
        <div class="progress-wrapper">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
          <small class="progress-text">${paidCount} / ${total} paid</small>
        </div>
      </div>

      <div class="pc-right">
        <div class="pc-due">${dueDate}</div>
        <div class="pc-action">
          ${paid ? `<span class="paid-badge">Paid ✓</span>` : `<button id="${btnId}" class="pay-btn" ${disabledAttr}>Mark as Paid</button>`}
        </div>
      </div>
    `;

    list.appendChild(card);

    // attach handler if button exists and not paid
    if (!paid && scheduleId !== null) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", () => handleMarkPaid(scheduleId, btn));
      }
    }
  });
}

// helper to disallow double-clicks, show spinner & update UI after success
async function handleMarkPaid(scheduleId, buttonEl) {
  if (!scheduleId) return;
  if (markInProgress.has(scheduleId)) return; // already in progress

  markInProgress.add(scheduleId);

  // UI changes
  if (buttonEl) {
    buttonEl.classList.add("loading-btn");
    buttonEl.innerHTML = `<span class="spinner"></span>`;
    buttonEl.disabled = true;
  }

  try {
    const month = dashboardSelectedMonth || (document.getElementById("monthSelector")?.value ?? new Date().toISOString().slice(0,7));
    const ok = await markInstallmentPaid(scheduleId, month);
    if (ok) {
      // small success animation: add class to card
      const card = buttonEl?.closest(".payment-card");
      if (card) {
        card.classList.add("paid-success");
        setTimeout(() => {
          card.classList.remove("paid-success");
        }, 700);
      }
      // reload list (keeps UX consistent)
      await loadMonthlyDashboard(month);
    } else {
      alert("Payment failed (check console).");
      // restore button UI
      if (buttonEl) {
        buttonEl.classList.remove("loading-btn");
        buttonEl.innerText = "Mark as Paid";
        buttonEl.disabled = false;
      }
    }
  } catch (err) {
    console.error("handleMarkPaid error:", err);
    if (buttonEl) {
      buttonEl.classList.remove("loading-btn");
      buttonEl.innerText = "Mark as Paid";
      buttonEl.disabled = false;
    }
    alert("Unexpected error. See console.");
  } finally {
    markInProgress.delete(scheduleId);
  }
}

function onMonthChange(ev) {
  const m = ev?.target?.value;
  if (m) {
    dashboardSelectedMonth = m;
    loadMonthlyDashboard(m);
  }
}

// small helper to escape HTML inside titles/categories (avoid XSS)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

