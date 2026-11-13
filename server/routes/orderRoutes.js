
import express from "express";
import { createOrder, getMyOrders, getOrderById, cancelOrder } from "../controllers/orderController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, createOrder);
router.get("/",authenticateUser, getMyOrders);
router.get("/:id", authenticateUser, getOrderById);
router.patch("/:id/cancel", authenticateUser, cancelOrder);

export default router;
