const express=require('express')
const resumeUploadRouter=express.Router()
const multer = require('multer');

// Multer Setup (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

const resumeController = require('../controllers/resumeController');

resumeUploadRouter.post('/resume/upload/', protect,
                    upload.single('resume'),
                 resumeController.uploadResume);

module.exports={resumeUploadRouter}