const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the storage path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Naming files
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 1024 * 1024 * 5 } // Limit file size
});

module.exports = upload;