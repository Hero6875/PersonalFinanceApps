const Database = require('better-sqlite3');

const db = new Database('./database/finance.db');

// -----------------------------
// CONFIG
// -----------------------------
const title = "iPhone Hire Purchase";
const totalPrice = 36000;
const months = 12;
const monthlyPayment = totalPrice / months;
const categoryId = 3; // CHANGE to your hire category id
const startDate = new Date("2026-01-01");

// -----------------------------
// INSERT INSTALLMENTS
// -----------------------------
const insert = db.prepare(`
    INSERT INTO transactions
    (title, amount, type, category_id, date)
    VALUES (?, ?, ?, ?, ?)
`);

for (let i = 0; i < months; i++) {

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i);

    const dateString =
        paymentDate.toISOString().split("T")[0];

    insert.run(
        `${title} - Installment ${i + 1}/${months}`,
        monthlyPayment,
        "expense",
        categoryId,
        dateString
    );

    console.log(
        `Inserted installment ${i + 1}`
    );
}

console.log("✅ Hire Purchase Seed Complete");