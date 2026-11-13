
import cloudinary from "../config/cloudinary.js";

// Upload image buffer to Cloudinary
export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "mpern-store/products",
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
    });
};
