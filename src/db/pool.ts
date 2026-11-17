import { Pool } from 'pg';
import { env } from '../config/env';

// Connects straight to the PostgreSQL server installed on this computer.
// Host, port, user, password and database name all come from the .env file.
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  max: 10,                        // at most 10 connections open at once
  idleTimeoutMillis: 30_000,      // close a connection that sat unused for 30s
  connectionTimeoutMillis: 5_000, // give up if the server does not answer in 5s
});

// without this, an error on an idle connection would crash the whole app
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

// called once at startup so a wrong password or a stopped server shows up right away
export async function checkDbConnection() {
  const result = await pool.query('SELECT current_database() AS db');
  console.log(`Connected to local PostgreSQL: ${env.db.host}:${env.db.port}/${result.rows[0].db}`);
}
