
import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateUser);

// Fetch cart
router.get("/", getCart);

// Add product
router.post("/items", addToCart);

// Update product quantity
router.patch("/items/:id", updateCartItem);

// Remove product
router.delete("/items/:id", removeCartItem);

// Clear cart
router.delete("/", clearCart);

export default router;
