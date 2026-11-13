
import "dotenv/config";
import cloudinary from "./config/cloudinary.js";

try {
    console.log("Testing Cloudinary connection...");

    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API Key loaded:", Boolean(process.env.CLOUDINARY_API_KEY));
    console.log("API Secret loaded:", Boolean(process.env.CLOUDINARY_API_SECRET));

    const result = await cloudinary.api.ping();

    console.log("Cloudinary connected successfully!");
    console.log(result);

} catch (error) {
    console.error("Cloudinary connection failed!");
    console.error("Full error:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error details:", error?.error);
}
