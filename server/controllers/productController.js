import Product from "../models/Product.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";

// POST /api/products

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    if (Array.isArray(data)) {
      const products = await Product.insertMany(data);

      return res.status(201).json({
        success: true,
        count: products.length,
        products,
      });
    }

    const product = await Product.create(data);

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/products

export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc",
            search = "",
            category,
        } = req.query;

        // Validate Pagination
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

        // Allow only Sorted Fields
        const allowedSortFields = ["name", "price", "createdAt", "quantity"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;

        // Build Search Filters
        const filters = {};
        if(search.trim()){
            filters.name = {
                $regex: search.trim(),
                $options: "i"
            };
        }
        if(category){
            filters.category = category;
        }

        // Pagination
        const skip = (currentPage - 1) * pageSize;

        // Execute Query
        const [products, totalProducts] = await Promise.all([
            Product.find(filters)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(pageSize),
            Product.countDocuments(filters)
        ]);

        res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products,
            totalProducts,
            currentPage,
            totalPages: Math.ceil(totalProducts / pageSize)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// POST /api/products/:id/images

export const uploadProductImagesController = async (req, res) => {
    const uploadedImages = [];

    try {
        const { id } = req.params;

        // Find the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        // Enforce maximum 5 images per product
        if (product.images.length + req.files.length > 5) {
            return res.status(400).json({
                success: false,
                message: "A product can have a maximum of 5 images.",
            });
        }

        // Upload all images to Cloudinary
        const uploadResults = await Promise.allSettled(
            req.files.map((file) =>
                uploadToCloudinary(file.buffer)
            )
        );

        // Collect successfully uploaded images
        for (const result of uploadResults) {
            if (result.status === "fulfilled") {
                uploadedImages.push(result.value);
            }
        }

        // If any upload failed, clean up successful uploads
        const hasUploadFailure = uploadResults.some(
            (result) => result.status === "rejected"
        );

        if (hasUploadFailure) {
            await Promise.allSettled(
                uploadedImages.map((image) =>
                    deleteFromCloudinary(image.public_id)
                )
            );

            return res.status(502).json({
                success: false,
                message: "One or more images failed to upload.",
            });
        }

        // Convert Cloudinary responses into Product image objects
        const newImages = uploadedImages.map((image, index) => ({
            url: image.secure_url,
            publicId: image.public_id,
            alt: `${product.name} - Image ${product.images.length + index + 1}`,
            isPrimary: product.images.length === 0 && index === 0,
        }));

        // Save image references in MongoDB
        product.images.push(...newImages);

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product images uploaded successfully.",
            product,
        });

    } catch (error) {
        // If database update fails, remove uploaded Cloudinary images
        await Promise.allSettled(
            uploadedImages.map((image) =>
                deleteFromCloudinary(image.public_id)
            )
        );

        console.error("Product image upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload product images.",
        });
    }
};


// DELETE /api/products/:id/images/:imageId
export const deleteProductImageController = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        // 1. Find the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        // 2. Find the image subdocument using its MongoDB _id
        const image = product.images.id(imageId);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: "Product image not found.",
            });
        }

        // 3. Store Cloudinary ID before removing the image
        const publicId = image.publicId;

        // 4. Remove image from MongoDB
        image.deleteOne();

        // 5. Ensure a remaining image is marked as primary
        if (
            product.images.length > 0 &&
            !product.images.some((img) => img.isPrimary)
        ) {
            product.images[0].isPrimary = true;
        }

        // 6. Save the updated product
        await product.save();

        // 7. Delete the actual image from Cloudinary
        try {
            const cloudinaryResult = await deleteFromCloudinary(publicId);

            if (
                cloudinaryResult.result !== "ok" &&
                cloudinaryResult.result !== "not found"
            ) {
                return res.status(202).json({
                    success: true,
                    cleanupPending: true,
                    message:
                        "Image removed from product, but Cloudinary cleanup is pending.",
                    product,
                });
            }
        } catch (cloudinaryError) {
            console.error(
                "Cloudinary image deletion failed:",
                cloudinaryError
            );

            return res.status(202).json({
                success: true,
                cleanupPending: true,
                message:
                    "Image removed from product, but Cloudinary cleanup is pending.",
                product,
            });
        }

        // 8. Successful response
        return res.status(200).json({
            success: true,
            cleanupPending: false,
            message: "Product image deleted successfully.",
            product,
        });
    } catch (error) {
        console.error("Product image deletion error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product or image ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete product image.",
        });
    }
};


// PUT /api/products/:id/images/:imageId
export const replaceProductImageController = async (req, res) => {
    let uploadedImage;

    try {
        const { id, imageId } = req.params;

        // 1. Find the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        // 2. Find the existing image
        const existingImage = product.images.id(imageId);

        if (!existingImage) {
            return res.status(404).json({
                success: false,
                message: "Product image not found.",
            });
        }

        // 3. Preserve the old Cloudinary ID
        const oldPublicId = existingImage.publicId;

        // 4. Upload the replacement image
        uploadedImage = await uploadToCloudinary(req.file.buffer);

        // 5. Update the existing MongoDB image record
        existingImage.url = uploadedImage.secure_url;
        existingImage.publicId = uploadedImage.public_id;

        await product.save();

        // 6. Delete the old Cloudinary image
        try {
            const deletionResult = await deleteFromCloudinary(oldPublicId);

            if (
                deletionResult.result !== "ok" &&
                deletionResult.result !== "not found"
            ) {
                return res.status(202).json({
                    success: true,
                    cleanupPending: true,
                    message:
                        "Image replaced successfully, but old image cleanup is pending.",
                    product,
                });
            }
        } catch (cleanupError) {
            console.error(
                "Old Cloudinary image cleanup failed:",
                cleanupError
            );

            return res.status(202).json({
                success: true,
                cleanupPending: true,
                message:
                    "Image replaced successfully, but old image cleanup is pending.",
                product,
            });
        }

        return res.status(200).json({
            success: true,
            cleanupPending: false,
            message: "Product image replaced successfully.",
            product,
        });

    } catch (error) {
        // If database update fails, clean up the newly uploaded image
        if (uploadedImage?.public_id) {
            await deleteFromCloudinary(uploadedImage.public_id).catch(
                (cleanupError) => {
                    console.error(
                        "New image cleanup failed:",
                        cleanupError
                    );
                }
            );
        }

        console.error("Product image replacement error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product or image ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to replace product image.",
        });
    }
};


// PATCH /api/products/:id/images/reorder
export const reorderProductImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageOrder } = req.body;

        // 1. Validate request body
        if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid imageOrder array.",
            });
        }

        // 2. Find product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        // 3. Ensure all images are included exactly once
        const existingImageIds = product.images.map((image) =>
            image._id.toString()
        );

        const requestedImageIds = imageOrder.map((imageId) =>
            String(imageId)
        );

        const hasDuplicates =
            new Set(requestedImageIds).size !== requestedImageIds.length;

        const hasInvalidIds = requestedImageIds.some(
            (imageId) => !existingImageIds.includes(imageId)
        );

        if (
            hasDuplicates ||
            hasInvalidIds ||
            requestedImageIds.length !== existingImageIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "imageOrder must contain every existing image ID exactly once.",
            });
        }

        // 4. Create a lookup map of existing image documents
        const imageMap = new Map(
            product.images.map((image) => [
                image._id.toString(),
                image,
            ])
        );

        // 5. Reorder images without recreating their subdocuments
        const reorderedImages = requestedImageIds.map((imageId) =>
            imageMap.get(imageId)
        );

        // 6. Mark only the first image as primary
        reorderedImages.forEach((image, index) => {
            image.isPrimary = index === 0;
        });

        // 7. Replace the array with the reordered documents
        product.images = reorderedImages;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product images reordered successfully.",
            product,
        });

    } catch (error) {
        console.error("Product image reordering error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to reorder product images.",
        });
    }
};



export const updateProductContentController = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        // 2. Define fields that ADMIN is allowed to update
        const allowedFields = [
            "name",
            "description",
            "price",
            "category",
            "quantity",
            "shortDescription",
            "detailedDescription",
            "brand",
            "highlights",
            "specifications",
        ];

        const updates = {};

        // 3. Pick only allowed fields from request body
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        // 4. Reject empty or unsupported updates
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid product fields provided.",
            });
        }

        // 5. Validate basic product fields
        if (
            updates.name !== undefined &&
            (typeof updates.name !== "string" || !updates.name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name must be a non-empty string.",
            });
        }

        if (
            updates.description !== undefined &&
            (typeof updates.description !== "string" ||
                !updates.description.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Product description must be a non-empty string.",
            });
        }

        if (
            updates.price !== undefined &&
            (!Number.isFinite(updates.price) || updates.price < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number.",
            });
        }

        if (
            updates.quantity !== undefined &&
            (!Number.isInteger(updates.quantity) || updates.quantity < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a non-negative integer.",
            });
        }

        if (
            updates.category !== undefined &&
            (typeof updates.category !== "string" ||
                !updates.category.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Category must be a non-empty string.",
            });
        }

        // 6. Validate highlights
        if (
            updates.highlights !== undefined &&
            (!Array.isArray(updates.highlights) ||
                !updates.highlights.every(
                    (item) => typeof item === "string"
                ))
        ) {
            return res.status(400).json({
                success: false,
                message: "Highlights must be an array of strings.",
            });
        }



// 7. Validate brand
if (updates.brand !== undefined) {
    const { brand } = updates;

    if (
        brand === null ||
        typeof brand !== "object" ||
        Array.isArray(brand)
    ) {
        return res.status(400).json({
            success: false,
            message: "Brand must be a valid object.",
        });
    }

    if (
        brand.name !== undefined &&
        (typeof brand.name !== "string" || !brand.name.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "Brand name must be a non-empty string.",
        });
    }

    if (
        brand.description !== undefined &&
        typeof brand.description !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Brand description must be a string.",
        });
    }

    if (
        brand.logo !== undefined &&
        (
            brand.logo === null ||
            typeof brand.logo !== "object" ||
            Array.isArray(brand.logo)
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Brand logo must be a valid object.",
        });
    }
}

// 8. Validate specifications
if (updates.specifications !== undefined) {
    const { specifications } = updates;

    if (
        specifications === null ||
        typeof specifications !== "object" ||
        Array.isArray(specifications)
    ) {
        return res.status(400).json({
            success: false,
            message: "Specifications must be an object.",
        });
    }

    const hasInvalidSpecification = Object.entries(
        specifications
    ).some(([key, value]) => {
        return (
            !key.trim() ||
            typeof value !== "string" ||
            !value.trim()
        );
    });

    if (hasInvalidSpecification) {
        return res.status(400).json({
            success: false,
            message: "Specification keys and values must be non-empty strings.",
        });
    }
}


        // line break
        Object.assign(product, updates);
        

        // 9. Save updated product
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            product,
        });

    } catch (error) {
        console.error("Product content update error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID or field value.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update product.",
        });
    }
};



// Get GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* Understand the important concepts
Pagination: skip() determines how many matching documents to skip, and limit() determines how many to return.

For page 3 with 10 products per page:

text{skip}=(3-1)\times10=20


Sorting: .sort({ price: 1 }) sorts prices in ascending order; .sort({ price: -1 }) sorts them in descending order.

Searching: $regex with $options: "i" performs a case-insensitive partial match on product names. For example, key can match Mechanical Keyboard.

Total count: countDocuments(filter) counts the matching products, using the same search and category filters as the results query.

Security: the sort field is allowlisted, and the page size is capped. 
For a production API, we should also escape regex metacharacters in user-supplied search strings and consider a MongoDB text index or dedicated search solution for larger catalogs. */