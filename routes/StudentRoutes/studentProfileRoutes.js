const express=require('express')
const studentProfileRouter=express.Router()

const { protect } = require('../../middleware/authMiddleware');
const { uploadImage, uploadPDF } = require('../../middleware/uploadMiddleware');
const { createProfile, getProfiles, getMyProfile, getProfileById, updateMyProfile, deleteMyProfile } = require('../../controllers/Student/studentProfileControllers/studentProfileController');
const resumeController = require('../../controllers/Student/studentProfileControllers/resumeController');
const { uploadAvatar } = require('../../controllers/Student/studentProfileControllers/uploadAvatar');
const { uploadResumeToCloud } = require('../../controllers/Student/studentProfileControllers/uploadResumeToCloud');

// Profile routes.(/api/v1/students/)
studentProfileRouter.post('/', protect, createProfile);

// "/me" routes — for the logged-in student fetching their own data
studentProfileRouter.get('/me', protect, getMyProfile);
studentProfileRouter.put('/me', protect, updateMyProfile);
studentProfileRouter.delete('/me', protect, deleteMyProfile);

// "/:id" routes — for admin or company viewing a specific student's profile
studentProfileRouter.get('/', protect, getProfiles);
studentProfileRouter.get('/:id', protect, getProfileById);

// Resume Routes — ATS analysis only (no cloud storage)
studentProfileRouter.post('/me/resume', protect, uploadPDF.single('resume'), resumeController.uploadResume);

// Cloud Upload Routes
studentProfileRouter.put('/me/avatar', protect, uploadImage.single('avatar'), uploadAvatar);
studentProfileRouter.put('/me/resume-upload', protect, uploadPDF.single('resume'), uploadResumeToCloud);

module.exports={studentProfileRouter}
