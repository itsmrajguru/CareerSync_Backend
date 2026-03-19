const express=require('express')
const userProfileRouter=express.Router()

const userProfileController = require('../controllers/useruserProfileController');

//profile routes
userProfileRouter.get('/profile/', protect, userProfileController.getProfiles);
userProfileRouter.post('/profile/', protect, userProfileController.createProfile);
userProfileRouter.get('/profile/:id/', protect, userProfileController.getProfile);
userProfileRouter.put('/profile/:id/', protect, userProfileController.updateProfile);
userProfileRouter.delete('/profile/:id/', protect, userProfileController.deleteProfile);

module.exports={userProfileRouter}