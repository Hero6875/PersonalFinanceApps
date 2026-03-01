// ===============================
// Transactions Module
// ===============================

// Load transactions list
async function loadTransactions() {

    try {

        const transactions =
            await API.get("/transactions");

        const list =
            document.getElementById("transactionList");

        if (!list) return;

        list.innerHTML = "";

        transactions.forEach(t => {

            const li = document.createElement("li");

            li.textContent =
                `${t.date} | ${t.title} | ${t.amount}`;

            list.appendChild(li);
        });

    } catch (err) {
        console.error("Load error:", err);
    }
}


// ===============================
// SAVE TRANSACTION
// ===============================

async function saveTransaction(event) {

    event.preventDefault();

    const data = {
        title: document.getElementById("title").value,
        amount: document.getElementById("amount").value,
        type: document.getElementById("type").value,
        category_id:
            document.getElementById("category").value,
        date: document.getElementById("date").value
    };

    try {

        await API.post("/saveTransaction", data);

        alert("✅ Transaction Saved");

        document
            .getElementById("transactionForm")
            .reset();

        await loadTransactions();
        loadExpenseChart();

    } catch (error) {

        console.error(
            "Save Transaction Error:",
            error
        );
    }
}

async function saveSchedule(e) {

    e.preventDefault();

    try {

        const data = {
            title:
                document.getElementById("s_title").value,
            amount:
                document.getElementById("s_amount").value,
            type:
                document.getElementById("s_type").value,
            category_id:
                document.getElementById("s_category").value,
            start_date:
                document.getElementById("s_start").value,
            end_date:
                document.getElementById("s_end").value,
            frequency:
                document.getElementById("s_frequency").value
        };

        console.log("Sending Schedule:", data);

        const result =
            await API.post("/schedule", data);

        alert("✅ Schedule Created");

        document
            .getElementById("scheduleForm")
            .reset();

    } catch (error) {

        console.error(error);

        alert(
            "❌ Failed to create schedule.\nCheck console."
        );
    }
}