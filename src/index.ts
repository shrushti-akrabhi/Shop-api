import { env } from './config/env';
import app from './app';
import { pool, checkDbConnection } from './db/pool';
import { connectProducer, disconnectProducer } from './kafka/producer';

const server = app.listen(env.port, () => {
  console.log('Server running on http://localhost:' + env.port);
  checkDbConnection().catch((err) =>
    console.error('Could not connect to the local PostgreSQL database:', err.message)
  );
  connectProducer().catch((err) => console.error('Kafka connect failed:', err));
});

async function shutdown() {
  server.close();
  await disconnectProducer();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
