import dotenv from 'dotenv';

dotenv.config();

// everything the app cannot start without
const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error('Missing settings in the .env file: ' + missing.join(', '));
  process.exit(1);
}

export const env = {
  port: process.env.PORT || 3000,

  // PostgreSQL installed on this computer (NOT the one inside Docker)
  db: {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    name: process.env.DB_NAME as string,
  },

  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: '1h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
