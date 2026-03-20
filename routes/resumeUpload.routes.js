const express=require('express')
const resumeUploadRouter=express.Router()
const multer = require('multer');

//importing middleware
const { protect } = require('../middleware/authMiddleware');

//importing controller
const resumeController = require('../controllers/resumeController');

// Multer Setup (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

resumeUploadRouter.post('/resume/upload/', protect,
                    upload.single('resume'),
                 resumeController.uploadResume);

module.exports={resumeUploadRouter}