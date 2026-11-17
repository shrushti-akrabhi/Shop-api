import fs from 'fs';
import path from 'path';
import { pool } from '../src/db/pool';

// runs all the .sql files in db/migrations in order (001, 002, ...)
// NOTE: run this only once on a fresh database
async function migrate() {
  const folder = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(folder, file), 'utf8');
    await pool.query(sql);
    console.log('ran', file);
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
