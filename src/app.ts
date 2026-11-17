import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(helmet()); 
app.use(cors({ origin: env.corsOrigin })); 
app.use(apiLimiter);
app.use(express.json({ limit: '100kb' })); 

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler); 

export default app;
