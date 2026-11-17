import fs from 'fs';
import path from 'path';
import { pool } from '../src/db/pool';

// inserts the sample users, categories and products
async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'seeds', 'seed.sql'), 'utf8');
  await pool.query(sql);
  console.log('seed data added');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
