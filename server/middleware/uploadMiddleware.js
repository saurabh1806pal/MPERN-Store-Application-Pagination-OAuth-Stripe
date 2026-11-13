import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG and WebP images are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter,
});

// Handle Multer errors
export const uploadProductImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

// Upload single image

export const uploadSingleProductImage = (req, res, next) => {
  upload.single("image")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    try {
      const detectedType = await fileTypeFromBuffer(req.file.buffer);
      console.log("Image validation details:", {
        originalName: req.file.originalname,
        declaredMimeType: req.file.mimetype,
        detectedMimeType: detectedType?.mime,
        fileSize: req.file.size,
      });

      if (
        !detectedType ||
        !allowedMimeTypes.includes(detectedType.mime) ||
        detectedType.mime !== req.file.mimetype
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid image file.",
        });
      }

      next();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: "Unable to validate uploaded image.",
      });
    }
  });
};

// Validate actual file contents
export const validateProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image.",
      });
    }

    for (const file of req.files) {
      const detectedType = await fileTypeFromBuffer(file.buffer);

      if (
        !detectedType ||
        !allowedMimeTypes.includes(detectedType.mime) ||
        detectedType.mime !== file.mimetype
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid image file: ${file.originalname}`,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Unable to validate uploaded images.",
    });
  }
};
