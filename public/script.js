document.addEventListener("DOMContentLoaded", async () => {

    await initApp();

    document
        .getElementById("type")
        .addEventListener("change", e => {
            updateCategoryDropdown(e.target.value);
        });

    document
        .getElementById("transactionForm")
        .addEventListener("submit", submitTransaction);
});

async function initApp() {
    await loadCategories();
    await loadHireCategories();
    await loadTransactions();
    await loadExpenseChart();
}


/* ===============================
   GLOBAL CATEGORY STORAGE
================================ */
let allCategories = [];


/* ===============================
   LOAD CATEGORIES
================================ */
async function loadCategories() {

    const res = await fetch('/categories');
    allCategories = await res.json();
}


/* ===============================
   UPDATE CATEGORY DROPDOWN
================================ */
function updateCategoryDropdown(type) {

    const select =
        document.getElementById("category");

    select.innerHTML =
        '<option value="">Select Category</option>';

    allCategories
        .filter(c => c.type === type)
        .forEach(cat => {

            const option =
                document.createElement("option");

            option.value = cat.id;
            option.textContent = cat.name;

            select.appendChild(option);
        });
}


/* ===============================
   SUBMIT TRANSACTION
================================ */
async function submitTransaction(e) {

    e.preventDefault();

    const transaction = {

        title:
            document.getElementById("title").value,

        amount:
            parseFloat(
                document.getElementById("amount").value
            ),

        type:
            document.getElementById("type").value,

        category_id:
            document.getElementById("category").value,

        date:
            document.getElementById("date").value
    };

    await fetch('/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
    });

    document.getElementById("transactionForm").reset();

    loadTransactions();
    loadExpenseChart();
}


/* ===============================
   LOAD TRANSACTIONS
================================ */
async function loadTransactions() {

    const res = await fetch('/transactions');
    const data = await res.json();

    const list =
        document.getElementById("transactionList");

    list.innerHTML = "";

    data.forEach(t => {

        const li = document.createElement("li");

        li.textContent =
            `${t.date} | ${t.title} | ${t.category || '-'} | ${t.amount}`;

        list.appendChild(li);
    });
}


/* ===============================
   EXPENSE ANALYTICS CHART
================================ */
let expenseChart = null;

async function loadExpenseChart() {

    const res =
        await fetch('/analytics/expense-by-category');

    const data = await res.json();

    const labels = data.map(d => d.name);
    const values = data.map(d => d.total);

    const ctx =
        document.getElementById("expenseChart");

    if (!ctx) return;

    if (expenseChart)
        expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values
            }]
        }
    });
}

function loadHireCategories() {

    const select =
        document.getElementById("hp_category");

    select.innerHTML = "";

    allCategories
        .filter(c => c.type === 'expense')
        .forEach(c => {

            const opt =
                document.createElement("option");

            opt.value = c.id;
            opt.textContent = c.name;

            select.appendChild(opt);
        });
}
