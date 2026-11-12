import express from 'express';

import { getAllUsers } from '../controllers/adminController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import {updateOrderStatus, updatePaymentStatus} from '../controllers/orderController.js'

const router = express.Router();

// Only ADMIN can view all the users

router.get("/users", authenticateUser, authorizeRole("ADMIN"), getAllUsers);
router.patch("/orders/:id/status",authenticateUser, authorizeRole("ADMIN"), updateOrderStatus);
router.patch(
  "/orders/:id/payment",
  authenticateUser,
  authorizeRole("ADMIN"),
  updatePaymentStatus
);

export default router;