import express from 'express';

import { getProducts, createProduct } from '../controllers/productController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.get('/', getProducts);
// ADMIN Protected Routes
router.post('/', authenticateUser, authorizeRole("ADMIN"), createProduct);

export default router;