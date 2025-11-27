const { Pool } = require('pg');
require('dotenv').config();

console.log('🛠 Connecting to Postgres:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch((err) => console.error('❌ Failed to connect to PostgreSQL:', err));

module.exports = {
  query: (text, params) => pool.query(text, params)
};