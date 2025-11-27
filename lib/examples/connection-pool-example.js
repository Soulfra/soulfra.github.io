/**
 * Connection Pool Example with Intentional Learning Gaps
 *
 * This file demonstrates the @LEARNING-GAP marker system.
 * It contains intentional bugs that teach connection pooling concepts.
 */

const mysql = require('mysql2/promise');

// @LEARNING-GAP: Direct connection creation (teaches connection pools - Pools 101)
// @CONCEPT: pools-101
// @DIFFICULTY: beginner
// @SPEEDRUN-HINT: "Use connection pool to reuse connections instead of creating new ones"
// @SPEEDRUN-FIX: "const pool = mysql.createPool({ host: 'localhost', user: 'root', database: 'mydb', connectionLimit: 10 }); const connection = await pool.getConnection();"
// @SPEEDRUN-SKIP: true
async function getUserBad(userId) {
  // ❌ Intentional bug: Opens new connection every time (50-200ms overhead)
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'mydb'
  });

  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  await connection.end(); // ← Closes connection (expensive!)

  return rows[0];
}

// ✅ Good example: Using connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'mydb',
  connectionLimit: 10 // ← Keep 10 connections open
});

async function getUserGood(userId) {
  // Borrows connection from pool (0-5ms overhead)
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  // Connection automatically returned to pool
  return rows[0];
}

// @LEARNING-GAP: Pool exhaustion (teaches pool size tuning)
// @CONCEPT: pools-101
// @DIFFICULTY: intermediate
// @SPEEDRUN-HINT: "Increase pool size or add connection timeout handling"
// @SPEEDRUN-FIX: "const pool = mysql.createPool({ ..., connectionLimit: 50, queueLimit: 100, waitForConnections: true, acquireTimeout: 5000 });"
// @SPEEDRUN-SKIP: false
async function processLotsOfRequests() {
  const pool = mysql.createPool({
    connectionLimit: 10 // ← Only 10 connections
  });

  // ❌ Intentional bug: 100 concurrent requests with only 10 connections
  // Last 90 requests will wait or timeout!
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(pool.execute('SELECT * FROM users'));
  }

  await Promise.all(requests); // ← Will fail when pool exhausted
}

// @LEARNING-GAP: Missing connection release (teaches resource cleanup)
// @CONCEPT: pools-101
// @DIFFICULTY: beginner
// @SPEEDRUN-HINT: "Always release connections back to pool using connection.release()"
// @SPEEDRUN-FIX: "try { /* work */ } finally { connection.release(); }"
// @SPEEDRUN-SKIP: true
async function getUserLeaky(userId) {
  const connection = await pool.getConnection();

  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  // ❌ Intentional bug: Forgot to release connection!
  // Pool will eventually run out of connections

  return rows[0];
}

// @LEARNING-GAP: No error handling (teaches resilience patterns)
// @CONCEPT: pools-101
// @DIFFICULTY: intermediate
// @SPEEDRUN-HINT: "Wrap pool operations in try/catch and always release in finally block"
// @SPEEDRUN-FIX: "try { const connection = await pool.getConnection(); try { /* work */ } finally { connection.release(); } } catch (err) { /* handle */ }"
// @SPEEDRUN-SKIP: false
async function getUserFragile(userId) {
  const connection = await pool.getConnection();

  // ❌ Intentional bug: No error handling
  // If query fails, connection never gets released!
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  connection.release();
  return rows[0];
}

module.exports = {
  getUserBad,
  getUserGood,
  processLotsOfRequests,
  getUserLeaky,
  getUserFragile
};
