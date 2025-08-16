const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL bağlantı xətası:', err.stack);
  } else {
    console.log('PostgreSQL database-ə uğurla bağlandı!');
    release();
  }
});

module.exports = { pool };