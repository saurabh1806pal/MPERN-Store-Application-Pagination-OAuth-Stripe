
import express from "express";

import {
    getProducts,
    createProduct,
    getProductById,
    uploadProductImagesController,
    deleteProductImageController,
    replaceProductImageController,
    reorderProductImagesController,
    updateProductContentController
} from "../controllers/productController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

import {
    uploadProductImages,
    validateProductImages,
    uploadSingleProductImage
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// ADMIN Protected Routes
router.post(
    "/",
    authenticateUser,
    authorizeRole("ADMIN"),
    createProduct
);

// Product Image Upload
router.post(
    "/:id/images",
    authenticateUser,
    authorizeRole("ADMIN"),
    uploadProductImages,
    validateProductImages,
    uploadProductImagesController
);

// Delete a Product Image
router.delete(
    "/:id/images/:imageId",
    authenticateUser,
    authorizeRole("ADMIN"),
    deleteProductImageController
);

// Replace a Product Image
router.put(
    "/:id/images/:imageId",
    authenticateUser,
    authorizeRole("ADMIN"),
    uploadSingleProductImage,
    replaceProductImageController
);

// Reorder Product Images
router.patch(
    "/:id/images/reorder",
    authenticateUser,
    authorizeRole("ADMIN"),
    reorderProductImagesController
);


// Update Product Content
router.patch(
    "/:id",
    authenticateUser,
    authorizeRole("ADMIN"),
    updateProductContentController
);
export default router;
