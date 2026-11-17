import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';

const router = Router();

router.use('/auth', authLimiter, authRoutes); 
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

export default router;
