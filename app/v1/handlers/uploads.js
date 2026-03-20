// api/v1/handlers/upload.js (or api/v1/controllers/uploadController.js)
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'; // Fallback to .jpg
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // console.log('File details:', { originalname: file.originalname, mimetype: file.mimetype });
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname || mimetype) { // Accept if EITHER matches
      return cb(null, true);
    }

    const error = new Error('Only images are allowed (jpeg, jpg, png, gif)');
    error.status = 400;
    cb(error);
  }
});

const uploadImage = async (req, res, next) => {
  try {
    // console.log('Upload request received:', req.file);
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.status = 400;
      return next(error);
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    error.status = error.status || 500;
    next(error);
  }
};

module.exports = {
  upload,
  uploadImage
};