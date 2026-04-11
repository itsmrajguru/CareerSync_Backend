const express=require('express')
const authRouter=express.Router()

//importing controller and middleware
const authController = require('../../controllers/Auth/authController');

const { protect } = require('../../middleware/authMiddleware/authMiddleware');

// User Authentication Routes
authRouter.post('/signup', authController.signup);
authRouter.post('/verify-otp', authController.verifySignupOtp); //verifies OTP sent during signup to complete registration
authRouter.post('/login', authController.login);
authRouter.post('/token/refresh', authController.refreshToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/change-password', protect, authController.changePassword);
authRouter.delete('/delete-me', protect, authController.deleteMe);
authRouter.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));

module.exports={authRouter}