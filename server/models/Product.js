
import mongoose from "mongoose";

// 1. Schema for individual product images
const productImageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            required: true,
        },

        alt: {
            type: String,
            default: "",
        },

        isPrimary: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: true,
    }
);

// 2. Schema for brand information
const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        logo: {
            url: String,
            publicId: String,
        },
    },
    {
        _id: false,
    }
);

// 3. Main Product Schema
const productSchema = new mongoose.Schema(
    {
        // Existing fields
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        category: {
            type: String,
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
        },

        // New product content fields
        shortDescription: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },

        detailedDescription: {
            type: String,
            default: "",
        },

        // Product images
        images: {
            type: [productImageSchema],
            default: [],
        },

        // Brand information
        brand: {
            type: brandSchema,
            default: undefined,
        },

        // Product highlights
        highlights: {
            type: [String],
            default: [],
        },

        // Technical specifications
        specifications: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
