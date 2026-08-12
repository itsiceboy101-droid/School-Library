const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function run() {
  try {
    await pool.query('ALTER TABLE issued_books ADD COLUMN teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE;');
    await pool.query('ALTER TABLE issued_books ALTER COLUMN student_id DROP NOT NULL;');
    console.log("Altered successfully");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
