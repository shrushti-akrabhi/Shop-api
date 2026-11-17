import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schema';
import { createProductSchema, productListQuerySchema } from '../schemas/product.schema';
import * as productController from '../controllers/product.controller';

const router = Router();


router.get('/', validateQuery(productListQuerySchema), productController.getProducts);
router.get('/:id', validateParams(idParamSchema), productController.getProductById);
router.post('/', authenticate, adminOnly, validateBody(createProductSchema), productController.createProduct);

export default router;
