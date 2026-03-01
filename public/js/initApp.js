async function initApp() {
    console.log("🚀 Personal Finance App Starting...");
    console.log("INIT APP STARTED");
    try {

        // 1. Load master data
        await loadCategories();

        // 2. Hire purchase depends on categories
        await loadHireCategories();

        // 3. Load transactions
        await loadTransactions();

        // 4. Upcoming payments depends on transactions and schedules
        await loadUpcomingPayments("month");

        // 5. Charts last
        loadExpenseChart();

        // 6. Monthly chart depends on transactions and categories
        loadMonthlyChart();

        // 7. Hire balance chart depends on hire categories and transactions
        loadHireBalanceChart();

        // 8. UI events last
        initUIEvents();

        console.log("✅ App Ready");

    } catch (error) {
        console.error("Initialization Error:", error);
    }
}

document.addEventListener("DOMContentLoaded", initApp);
