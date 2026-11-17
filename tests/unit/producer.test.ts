// the fake kafka producer that replaces the real one
const fakeProducer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
};

jest.mock('@confluentinc/kafka-javascript', () => ({
  KafkaJS: { Kafka: jest.fn(() => ({ producer: () => fakeProducer })) },
}));

// the file remembers if it is connected, so we load a fresh copy for every test
function loadProducer() {
  let producer: typeof import('../../src/kafka/producer');
  jest.isolateModules(() => {
    producer = require('../../src/kafka/producer');
  });
  return producer!;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('kafka producer', () => {
  it('skips the event when it is not connected', async () => {
    const { publishEvent, disconnectProducer } = loadProducer();

    await publishEvent('order.created', 'k1', { a: 1 });
    await disconnectProducer();

    expect(fakeProducer.send).not.toHaveBeenCalled();
    expect(fakeProducer.disconnect).not.toHaveBeenCalled();
  });

  it('sends the event after connecting, and disconnects', async () => {
    const { connectProducer, publishEvent, disconnectProducer } = loadProducer();

    await connectProducer();
    await publishEvent('order.created', 'k1', { a: 1 });
    await disconnectProducer();

    expect(fakeProducer.send).toHaveBeenCalledTimes(1);
    expect(fakeProducer.disconnect).toHaveBeenCalled();
  });

  it('does not crash when sending fails', async () => {
    const { connectProducer, publishEvent } = loadProducer();
    fakeProducer.send.mockRejectedValueOnce(new Error('kafka is down'));

    await connectProducer();

    await expect(publishEvent('order.created', 'k1', {})).resolves.toBeUndefined();
  });
});
