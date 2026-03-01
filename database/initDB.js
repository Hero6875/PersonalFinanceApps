const db = require("./database");

// Create Transactions Table if it doesn't exist
db.exec(`
CREATE TABLE IF NOT EXISTS Transactions(
TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
Type TEXT,
Category TEXT,
Amount REAL,
Note TEXT,
TransactionDate TEXT,
Status TEXT
);
`);

console.log("Transactions table ready");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL
)
`);

console.log("Category table ready");




 console.log("Database Ready");
