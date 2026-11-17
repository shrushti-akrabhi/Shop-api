import { KafkaJS } from '@confluentinc/kafka-javascript';
import { env } from '../config/env';

const kafka = new KafkaJS.Kafka({
  kafkaJS: { clientId: 'shop-api', brokers: [env.kafkaBroker] },
});
const producer = kafka.producer();
let connected = false;

export async function connectProducer() {
  await producer.connect();
  connected = true;
  console.log('Kafka producer connected');
}

export async function disconnectProducer() {
  if (connected) await producer.disconnect();
}

export async function publishEvent(topic: string, key: string, payload: object) {
  if (!connected) {
    console.warn('Kafka not connected, event skipped:', topic);
    return;
  }
  try {
    await producer.send({
      topic,
      messages: [
        { key, value: JSON.stringify({ ...payload, occurredAt: new Date().toISOString() }) },
      ],
    });
  } catch (err) {
    console.error('Kafka publish failed:', topic, err);
  }
}
