export function applyTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= '5433';
  process.env.DB_USER ??= 'postgres';
  process.env.DB_PASSWORD ??= 'postgres';
  process.env.DB_NAME ??= 'shop_test';
  process.env.JWT_SECRET ??= 'test-secret-used-only-in-jest';
  process.env.CORS_ORIGIN ??= 'http://localhost:5173';
  process.env.KAFKA_BROKER ??= 'localhost:9092';
}
