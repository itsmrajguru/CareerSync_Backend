const multer = require('multer');

/* using memory storage so the file buffer stays in memory
and can be directly streamed to cloudinary without saving to disk */
const storage = multer.memoryStorage();

/* uploadImage middleware
accepts jpg, jpeg, png and webp image files up to 5 mb */
const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, or WEBP images are allowed.'), false);
        }
    }
});

/* uploadPDF middleware
accepts pdf files only up to 10 mb */
const uploadPDF = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'), false);
        }
    }
});

module.exports = { uploadImage, uploadPDF };
