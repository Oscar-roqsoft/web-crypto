const multer = require("multer");
const path = require("path");

// Use memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif/;
    
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExt.test(file.mimetype.toLowerCase());

    if (extname && mimetype) {
    }
    
    return cb(null, true);
    // return cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
  }
});

module.exports = upload;