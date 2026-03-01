const Database = require('better-sqlite3');

const db = new Database('./database/finance.db');



// db.exec(`
// ALTER TABLE transactions
// ADD COLUMN category_id INTEGER
// `);


// console.log("✅ Update successful");


db.close();
