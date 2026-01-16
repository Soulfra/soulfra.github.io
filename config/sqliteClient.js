const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../deathtodata.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Handle RETURNING clause for SQLite (not supported)
      if (sql.includes('RETURNING')) {
        // Extract the INSERT query without RETURNING
        const baseSql = sql.replace(/RETURNING.*$/i, '').trim();

        db.run(baseSql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            // Return the last inserted ID
            resolve({ rows: [{ id: this.lastID }] });
          }
        });
      } else {
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      }
    });
  }
};
