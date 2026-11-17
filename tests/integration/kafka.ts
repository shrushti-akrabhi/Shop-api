import { KafkaJS } from '@confluentinc/kafka-javascript';
import { connectProducer, disconnectProducer } from '../../src/kafka/producer';

const received: { topic: string; value: any }[] = [];
let consumer: any;

export async function startKafka() {
  await connectProducer(); 

  const kafka = new KafkaJS.Kafka({
    kafkaJS: { clientId: 'shop-test-listener', brokers: [process.env.KAFKA_BROKER as string] },
  });
  consumer = kafka.consumer({ kafkaJS: { groupId: 'shop-test-' + Date.now(), fromBeginning: true } });
  await consumer.connect();
  await consumer.subscribe({ topics: ['order.created', 'order.status_updated', 'user.registered'] });
  await consumer.run({
    eachMessage: async ({ topic, message }: any) => {
      received.push({ topic, value: JSON.parse(message.value.toString()) });
    },
  });
}

export async function stopKafka() {
  await consumer?.disconnect();
  await disconnectProducer();
}

export async function waitForEvent(topic: string, field: string, value: string) {
  for (let i = 0; i < 100; i++) {
    const found = received.find((m) => m.topic === topic && m.value[field] === value);
    if (found) return found.value;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No "${topic}" event with ${field}=${value} arrived in Kafka`);
}
