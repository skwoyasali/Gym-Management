import multer from "multer";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Upload a JPG, PNG, or WEBP image");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

export const uploadImage = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const status = error instanceof multer.MulterError
      ? error.code === "LIMIT_FILE_SIZE"
        ? 413
        : 400
      : error.status || 400;
    res.status(status).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be no larger than 5 MB"
          : error.message || "Invalid image upload",
    });
  });
};
