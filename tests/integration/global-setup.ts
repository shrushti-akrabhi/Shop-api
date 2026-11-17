import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { applyTestEnv } from './test-env';

export default async function globalSetup() {
  applyTestEnv();

  const db = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await db.connect();
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

  const folder = path.join(__dirname, '..', '..', 'db', 'migrations');
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await db.query(fs.readFileSync(path.join(folder, file), 'utf8'));
  }
  await db.end();
  
  const kafka = new KafkaJS.Kafka({
    kafkaJS: { clientId: 'shop-test-setup', brokers: [process.env.KAFKA_BROKER as string] },
  });
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: ['order.created', 'order.status_updated', 'user.registered'].map((topic) => ({ topic })),
  });
  await admin.disconnect();
}
