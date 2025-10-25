const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determine upload directory based on environment
// Vercel serverless functions can only write to /tmp directory
const uploadsDir = process.env.VERCEL === '1'
  ? '/tmp/uploads/avatars'
  : path.join(__dirname, '../../uploads/avatars');

// Try to create uploads directory, but don't crash if it fails
// On Vercel, the filesystem is read-only except for /tmp
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Upload directory creation failed, uploads may not work:', error.message);
  // Continue execution - directory creation will be attempted again in destination callback
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving file
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error.message);
      // Still use uploadsDir path - multer will handle the error
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
