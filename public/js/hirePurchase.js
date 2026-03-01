// ===============================
// Hire Purchase Module
// ===============================

// Store hire purchase categories
let hireCategories = [];

/*
 * Load categories used for Hire Purchase
 * (example: Loan, Installment, Hire Purchase)
 */
async function loadHireCategories() {

    try {

        // Get all categories from backend
        const categories = await API.get("/categories");

        // Filter hire purchase categories
        hireCategories = categories.filter(c =>
            c.type === "hire_purchase"
        );

        // Dropdown element
        const select =
            document.getElementById("hireCategory");

        if (!select) return;

        select.innerHTML =
            '<option value="">Select Hire Category</option>';

        hireCategories.forEach(cat => {

            const option = document.createElement("option");

            option.value = cat.id;
            option.textContent = cat.name;

            select.appendChild(option);
        });

        console.log("✅ Hire categories loaded");

    } catch (error) {
        console.error(
            "Error loading hire categories:",
            error
        );
    }
}