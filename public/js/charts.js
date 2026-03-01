async function loadExpenseChart() {

    const data = await API.get("/analytics");

    const ctx =
        document.getElementById("expenseChart");

    new Chart(ctx, {
        type: "pie",
        data: data
    });
}

async function loadMonthlyChart() {

    const data =
        await API.get("/analytics/monthly");

    const ctx =
        document.getElementById("monthlyChart");

    if (!ctx) return;

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "Income",
                    data: data.income,
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: "Expense",
                    data: data.expense,
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top"
                }
            }
        }
    });
}

async function loadHireBalanceChart() {

    const data =
        await API.get("/analytics/hire-balance");

    const ctx =
        document.getElementById("hireBalanceChart");

    if (!ctx) return;

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: "Remaining Debt",
                data: data.map(d => d.remaining),
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true
        }
    });
}