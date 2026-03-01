const Database = require("better-sqlite3");

const db = new Database("./database/finance.db");

db.exec(`
CREATE TABLE scheduled_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    frequency TEXT,
    last_generated TEXT,
    next_due_date TEXT
);
`);

console.log("✅ Schedule table ready");

db.close();