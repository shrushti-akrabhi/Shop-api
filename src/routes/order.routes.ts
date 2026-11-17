import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { idParamSchema, paginationSchema } from '../schemas/common.schema';
import { createOrderSchema, updateStatusSchema } from '../schemas/order.schema';
import * as orderController from '../controllers/order.controller';

const router = Router();


router.use(authenticate);

router.post('/', validateBody(createOrderSchema), orderController.createOrder);
router.get('/', validateQuery(paginationSchema), orderController.getMyOrders);
router.get('/admin/all', adminOnly, validateQuery(paginationSchema), orderController.getAllOrders);
router.get('/:id', validateParams(idParamSchema), orderController.getOrderById);
router.patch(
  '/:id/status',
  adminOnly,
  validateParams(idParamSchema),
  validateBody(updateStatusSchema),
  orderController.updateOrderStatus
);

export default router;
