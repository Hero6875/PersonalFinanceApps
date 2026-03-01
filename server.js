const cron = require('node-cron');
const express = require("express");
const bodyParser = require("body-parser");

const db = require("./database/database");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

cron.schedule('0 0 * * *', () => {
    generateScheduledTransactions();
});

/* ADD TRANSACTION */
app.post("/saveTransaction", (req, res) => {

    try {

        const {
            title,
            amount,
            type,
            category_id,
            date
        } = req.body;

        db.prepare(`
            INSERT INTO transactions
            (title, amount, type, category_id, date)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            title,
            amount,
            type,
            category_id,
            date
        );

        res.json({
            success: true,
            message: "Transaction saved"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});

/* GET ALL TRANSACTIONS */
app.get("/transactions",(req,res)=>{

const rows =
db.prepare(`
SELECT *
FROM Transactions
ORDER BY id DESC
`).all();

res.json(rows);
});

// Get all categories
app.get('/categories', (req, res) => {

    try {
        const rows =
            db.prepare("SELECT * FROM categories")
              .all();

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }

});

// ===============================
// ANALYTICS ROUTE
// ===============================
app.get("/analytics", (req, res) => {

    try {

        const query = `
            SELECT c.name AS category,
                   SUM(t.amount) AS total
            FROM transactions t
            JOIN categories c
                ON t.category_id = c.id
            WHERE t.type = 'expense'
            GROUP BY c.name
        `;

        const rows =
            db.prepare(query).all();

        res.json({
            labels: rows.map(r => r.category),
            datasets: [{
                label: "Expenses",
                data: rows.map(r => r.total)
            }]
        });

    } catch (error) {

        console.error(error);
        res.status(500).json({
            error: "Analytics query failed"
        });
    }
});

// Add new schedule
app.post('/schedules', (req, res) => {

    const {
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency
    } = req.body;

    db.prepare(`
        INSERT INTO schedules
        (title,amount,type,category_id,
         start_date,end_date,frequency)
        VALUES (?,?,?,?,?,?,?)
    `).run(
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency
    );

    res.sendStatus(200);
});

function generateScheduledTransactions() {

    const today =
        new Date().toISOString().split('T')[0];

    const schedules =
        db.prepare(`
            SELECT * FROM schedules
        `).all();

    schedules.forEach(s => {

        if (s.last_generated === today)
            return;

        db.prepare(`
            INSERT INTO transactions
            (title,amount,type,category_id,date)
            VALUES (?,?,?,?,?)
        `).run(
            s.title,
            s.amount,
            s.type,
            s.category_id,
            today
        );

        db.prepare(`
            UPDATE schedules
            SET last_generated=?
            WHERE id=?
        `).run(today, s.id);

    });

    console.log("✅ schedule checked");
}

// Add hire purchase schedule
app.post('/hirepurchase', (req, res) => {

    const {
        title,
        total_amount,
        months,
        category_id,
        start_date
    } = req.body;

    const monthly =
        total_amount / months;

    let date = new Date(start_date);

    const insert =
        db.prepare(`
        INSERT INTO schedules
        (title,amount,type,category_id,
         start_date,frequency)
        VALUES (?,?,?,?,?,?)
    `);

    for (let i = 0; i < months; i++) {

        const payDate =
            date.toISOString().split('T')[0];

        insert.run(
            `${title} (${i+1}/${months})`,
            monthly,
            'expense',
            category_id,
            payDate,
            'once'
        );

        date.setMonth(date.getMonth() + 1);
    }

    res.sendStatus(200);
});

// ===============================
// MONTHLY ANALYTICS
// ===============================
app.get("/analytics/monthly", (req, res) => {

    try {

        const query = `
            SELECT 
                strftime('%Y-%m', date) AS month,
                SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
            FROM transactions
            GROUP BY month
            ORDER BY month
        `;

        const rows = db.prepare(query).all();

        res.json({
            labels: rows.map(r => r.month),
            income: rows.map(r => r.income),
            expense: rows.map(r => r.expense)
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Monthly analytics failed"
        });
    }
});

// ===============================
// HIRE PURCHASE REMAINING BALANCE
// ===============================
app.get("/analytics/hire-balance", (req, res) => {

    try {

        const query = `
            SELECT
                date,
                SUM(amount) OVER (
                    ORDER BY date
                ) AS paid
            FROM transactions
            WHERE title LIKE '%Installment%'
            ORDER BY date
        `;

        const rows = db.prepare(query).all();

        const totalDebt = 36000; // example

        const result = rows.map(r => ({
            date: r.date,
            remaining: totalDebt - r.paid
        }));

        res.json(result);

    } catch (err) {

        console.error(err);
        res.status(500).json({
            error: "Hire balance failed"
        });
    }
});

// Add new schedule transaction (for testing)
app.post("/schedule", (req, res) => {

    const {
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency
    } = req.body;

    db.prepare(`
        INSERT INTO scheduled_transactions
        (
            title,
            amount,
            type,
            category_id,
            start_date,
            end_date,
            frequency,
            next_due_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency,
        start_date
    );

    res.json({ success: true });
});

// Scheduler function to generate transactions from schedules
function runScheduler() {

    console.log("Smart Scheduler Running...");

    const today = new Date();

    const schedules =
        db.prepare(`
            SELECT * FROM scheduled_transactions
        `).all();

    const insert =
        db.prepare(`
            INSERT INTO transactions
            (title, amount, type, category_id, date)
            VALUES (?, ?, ?, ?, ?)
        `);

    const updateNext =
        db.prepare(`
            UPDATE scheduled_transactions
            SET next_due_date=?
            WHERE id=?
        `);

    schedules.forEach(s => {

        if (!s.next_due_date) return;

        let dueDate = new Date(s.next_due_date);
        const endDate =
            s.end_date ? new Date(s.end_date) : null;

        while (dueDate <= today) {

            if (endDate && dueDate > endDate)
                break;

            const dateString =
                dueDate.toISOString().split("T")[0];

            // Prevent duplicate
            const exists =
                db.prepare(`
                    SELECT id FROM transactions
                    WHERE title=? AND date=?
                `).get(s.title, dateString);

            if (!exists) {

                insert.run(
                    s.title,
                    s.amount,
                    s.type,
                    s.category_id,
                    dateString
                );

                console.log(
                    "Generated:",
                    s.title,
                    dateString
                );
            }

            // move next month
            dueDate.setMonth(
                dueDate.getMonth() + 1
            );
        }

        updateNext.run(
            dueDate.toISOString().split("T")[0],
            s.id
        );
    });
}

// Add new schedule transaction (for testing)
app.post("/schedule", (req, res) => {

    const {
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency
    } = req.body;

    db.prepare(`
        INSERT INTO scheduled_transactions
        (
            title,
            amount,
            type,
            category_id,
            start_date,
            end_date,
            frequency,
            next_due_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        title,
        amount,
        type,
        category_id,
        start_date,
        end_date,
        frequency,
        start_date
    );

    res.json({ success: true });
});

// ===============================
// Upcoming Payments API
// ===============================
app.get("/upcoming", (req, res) => {

    const view = req.query.view || "month";
    const selectedMonth = req.query.month;

    const today = new Date();

    let startDate;
    let endDate;

    if (view === "today") {
        startDate = new Date(today);
        endDate = new Date(today);
    }
    else if (view === "week") {
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
    }
    else if (view === "month") {
        startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        endDate = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );
    }
    else if (view === "custom" && selectedMonth) {

        const [year, month] =
            selectedMonth.split("-");

        startDate =
            new Date(year, month - 1, 1);

        endDate =
            new Date(year, month, 0);
    }

    const rows = db.prepare(`
        SELECT
            s.id,
            s.title,
            s.amount,
            s.next_due_date,
            c.name AS category
        FROM scheduled_transactions s
        LEFT JOIN categories c
        ON s.category_id = c.id
        WHERE date(s.next_due_date)
        BETWEEN date(?) AND date(?)
        ORDER BY s.next_due_date
    `).all(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
    );

    //--------------------------------
    // STATUS CALCULATION
    //--------------------------------
    const result = rows.map(r => {

        const dueDate = new Date(r.next_due_date);

        const diffDays =
            Math.ceil(
                (dueDate - today) /
                (1000 * 60 * 60 * 24)
            );

        let status = "later";

        if (diffDays < 0)
            status = "overdue";
        else if (diffDays <= 3)
            status = "due-soon";
        else if (diffDays <= 7)
            status = "this-week";

        return {
            ...r,
            status
        };
    });

    res.json(result);
});


// ===============================
// MONTHLY PAYMENT STATUS
// ===============================
app.get("/monthly-status", (req, res) => {

    try {

        const month = req.query.month;

        if (!month) {
            return res.status(400)
                .json({ error: "Month required" });
        }

        const rows = db.prepare(`
            SELECT
                id,
                title,
                amount,
                IFNULL(paid_amount,0) as paid_amount,
                IFNULL(remain_amount,amount)
                    as remain_amount,
                next_due_date
            FROM scheduled_transactions
            WHERE substr(next_due_date,1,7)=?
            ORDER BY next_due_date
        `).all(month);

        res.json(rows);

    } catch (err) {

        console.error(
            "Monthly Status ERROR:",
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});

// =====================================
// MARK SCHEDULE AS PAID
// =====================================
app.post("/mark-paid", (req, res) => {

    const { schedule_id, month } = req.body;

    if (!schedule_id || !month)
        return res.status(400)
            .json({ error: "Missing data" });

    //--------------------------------
    // Get schedule
    //--------------------------------
    const schedule = db.prepare(`
        SELECT *
        FROM scheduled_transactions
        WHERE id = ?
    `).get(schedule_id);

    if (!schedule)
        return res.status(404)
            .json({ error: "Schedule not found" });

    //--------------------------------
    // Payment date
    //--------------------------------
    const paymentDate =
        `${month}-${schedule.next_due_date.split("-")[2]}`;

    //--------------------------------
    // Prevent duplicate payment
    //--------------------------------
    const exists = db.prepare(`
        SELECT id FROM transactions
        WHERE title = ?
        AND date = ?
    `).get(
        schedule.title,
        paymentDate
    );

    if (exists)
        return res.json({
            message: "Already paid"
        });

    //--------------------------------
    // Insert transaction
    //--------------------------------
    db.prepare(`
        INSERT INTO transactions
        (title, amount, type,
         category_id, date)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        schedule.title,
        schedule.amount,
        "expense",
        schedule.category_id,
        paymentDate
    );

    //--------------------------------
    // Move next_due_date
    //--------------------------------
    let nextDate =
        new Date(schedule.next_due_date);

    nextDate.setMonth(
        nextDate.getMonth() + 1
    );

    db.prepare(`
        UPDATE scheduled_transactions
        SET next_due_date = ?
        WHERE id = ?
    `).run(
        nextDate.toISOString()
            .split("T")[0],
        schedule_id
    );

    res.json({
        success: true
    });
});

app.post("/scheduled/pay/:id", (req, res) => {

    const id = req.params.id;
    const { payAmount } = req.body;

    try {

        const record =
            db.prepare(`
                SELECT amount,
                       paid_amount
                FROM scheduled_transactions
                WHERE id = ?
            `).get(id);

        if (!record)
            return res.status(404).json({
                error: "Not found"
            });

        const newPaid =
            record.paid_amount + payAmount;

        const remain =
            Math.max(
                record.amount - newPaid,
                0
            );

        db.prepare(`
            UPDATE scheduled_transactions
            SET paid_amount = ?,
                remain_amount = ?
            WHERE id = ?
        `).run(newPaid, remain, id);

        res.json({
            success: true
        });

    } catch(err){

        console.error(err);
        res.status(500).json({
            error:"Payment failed"
        });
    }
});



// Run scheduler every minute (for testing)
//setInterval(runScheduler, 60000);
// In production, use daily schedule
setInterval(runScheduler, 86400000); // Run daily


app.listen(3000,()=>{
console.log("Server running at http://localhost:3000");
});