const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - allow only image files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`),
      false
    );
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5
  }
});

// Middleware to build image URLs
const buildImageUrls = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.uploadedImages = req.files.map(file => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return `${baseUrl}/uploads/products/${file.filename}`;
    });
  }
  next();
};

module.exports = {
  upload,
  buildImageUrls
};
