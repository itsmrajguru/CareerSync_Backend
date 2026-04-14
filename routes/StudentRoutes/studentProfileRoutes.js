const express=require('express')
const studentProfileRouter=express.Router()
const multer = require('multer');


const { protect } = require('../../middleware/authMiddleware');
const { createProfile, getProfiles, getMyProfile, getProfileById, updateMyProfile, deleteMyProfile } = require('../../controllers/Student/studentProfileControllers/studentProfileController');

const resumeController = require('../../controllers/Student/studentProfileControllers/resumeController');

const upload = multer({ storage: multer.memoryStorage() });


// Profile routes.(/api/v1/students/)
studentProfileRouter.post('/', protect, createProfile);

// "/me" routes — for the logged-in student fetching their own data
studentProfileRouter.get('/me', protect, getMyProfile);
studentProfileRouter.put('/me', protect, updateMyProfile);
studentProfileRouter.delete('/me', protect, deleteMyProfile);

// "/:id" routes — for admin or company viewing a specific student's profile
studentProfileRouter.get('/', protect, getProfiles);
studentProfileRouter.get('/:id', protect, getProfileById);

// Resume Routes
studentProfileRouter.post('/me/resume', protect, upload.single('resume'), resumeController.uploadResume);

module.exports={studentProfileRouter}
