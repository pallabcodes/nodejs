// src/middlewares/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Memory storage (so we can optimize before saving)
const storage = multer.memoryStorage();

// File type filter
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)!'), false);
  }
};

// Multer instance
const multerUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

/**
 * Optimize and save uploaded images
 * Supports single or multiple fields dynamically
 * @param {Object[]} fieldsConfig - Example: [{ name: 'profilePic', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]
 */
export const uploadImages = (fieldsConfig) => [
  multerUpload.fields(fieldsConfig),
  async (req, res, next) => {
    try {
      req.filesProcessed = {};

      const allFields = Object.keys(req.files || {});

      for (const field of allFields) {
        const files = req.files[field];

        const optimized = await Promise.all(
          files.map(async (file) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
            const filename = `${Date.now()}-${baseName}.jpg`;
            const outputPath = path.join(uploadDir, filename);

            await sharp(file.buffer)
              .resize({ width: 1024 }) // Resize to max width 1024px
              .jpeg({ quality: 80 })   // Convert and compress to JPEG
              .toFile(outputPath);

            return filename;
          })
        );

        req.filesProcessed[field] = optimized;
      }

      next();
    } catch (err) {
      next(err);
    }
  }
];
