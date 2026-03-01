const Database = require("better-sqlite3");

const db = new Database("./database/finance.db");

module.exports = db;
