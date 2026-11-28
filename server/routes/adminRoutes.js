
import express from "express";

import {
  getAllUsers,
  getUserById,
  updateCustomerStatus,
  reconcilePayments
} from "../controllers/adminController.js";

import {
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getAdminOrderById
} from "../controllers/orderController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";


const router = express.Router();

// All admin APIs require authentication and ADMIN role
router.use(authenticateUser, authorizeRole("ADMIN"));

// USER MANAGEMENT
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById)
router.patch("/users/:id/status", updateCustomerStatus);

// ORDER MANAGEMENT
router.get("/orders", getAllOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateOrderStatus);
// router.patch("/orders/:id/payment", updatePaymentStatus);
// PAYMENT & REFUND RECONCILIATION
router.post("/payments/reconcile", reconcilePayments);

export default router;
