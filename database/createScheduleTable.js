const Database = require("better-sqlite3");

const db = new Database("./database/finance.db");

db.exec(`
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL,
    type TEXT,
    category_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    frequency TEXT,
    last_generated TEXT
);
`);

console.log("✅ Schedule table ready");

db.close();