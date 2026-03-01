const Database = require('better-sqlite3');

const db = new Database('./database/finance.db');

const categories = [
  ['Salary','income'],
  ['Bonus','income'],
  ['Food','expense'],
  ['Transport','expense'],
  ['Shopping','expense'],
  ['Internet','expense']
];

const stmt = db.prepare(`
INSERT OR IGNORE INTO categories (name,type)
VALUES (?,?)
`);

categories.forEach(c => stmt.run(c));

console.log("✅ Categories seeded");

db.close();