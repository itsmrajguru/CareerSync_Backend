const express=require('express')
const authRouter=express.Router()

//importing controller
const authController = require('../../controllers/AuthControllers/authController');

// User Authentication Routes
authRouter.post('/signup', authController.signup);
authRouter.post('/verify-otp', authController.verifySignupOtp); //verifies OTP sent during signup to complete registration
authRouter.post('/login', authController.login);
authRouter.post('/token/refresh', authController.refreshToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/logout', authController.logout || ((req, res) => res.json({ success: true })));

module.exports={authRouter}