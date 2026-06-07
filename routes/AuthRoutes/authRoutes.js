const express=require('express')
const authRouter=express.Router()

//importing controller and middleware
const authController = require('../../controllers/Auth/authController');

const { protect } = require('../../middleware/authMiddleware');
const { authRateLimiter } = require('../../middleware/authRateLimiter');

// User Authentication Routes
authRouter.post('/signup', authRateLimiter, authController.signup);
authRouter.post('/verify-otp', authRateLimiter, authController.verifySignupOtp); //verifies OTP sent during signup to complete registration
authRouter.post('/resend-otp', authRateLimiter, authController.resendOtp); //resends a fresh OTP when the previous one expires
authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/token/refresh', authController.refreshToken);
authRouter.post('/forgot-password', authRateLimiter, authController.forgotPassword);
authRouter.post('/reset-password', authRateLimiter, authController.resetPassword);
authRouter.post('/change-password', protect, authController.changePassword);
authRouter.delete('/delete-me', protect, authController.deleteMe);
authRouter.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));

module.exports={authRouter}
