const express=require('express')
const authRouter=express.Router()

//importing controller
const authController = require('../controllers/authController');

// User Authentication Routes
authRouter.post('/login/', authController.login);
authRouter.post('/verify-otp/', authController.verifyOtp);
authRouter.post('/signup/', authController.signup);
authRouter.post('/token/refresh/', authController.refreshToken);
authRouter.post('/verify/:token/', authController.verifyEmail);
authRouter.post('/forgot-password/', authController.forgotPassword);
authRouter.post('/reset-password/', authController.resetPassword);

module.exports={authRouter}