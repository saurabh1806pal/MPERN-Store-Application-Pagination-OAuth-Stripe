import Product from "../models/Product.js";

// POST /api/products

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        const product = new Product({
            name,
            description,
            price,
            category,
            quantity
        });

        await product.save();
        res.status(201).json({
            message: "Product created successfully",
            success: true,
            product
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// GET /api/products

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};