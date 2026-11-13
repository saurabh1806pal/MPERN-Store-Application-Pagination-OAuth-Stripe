
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);

export default router;
