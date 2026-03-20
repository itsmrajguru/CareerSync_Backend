require('dotenv').config();
const jwt = require('jsonwebtoken');
const joi = require('joi');
const userModel = require('../models/User');
const crypto = require('crypto');
const profileModel = require('../models/Profile');
const bcrypt = require('bcryptjs');
const {sendEmail } = require('../services/emailService');


//creating Token Generators 
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });
};


// user Credentials are validated using these properties
const signupSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});


// Signup Controller 

const signup = async (req, res) => {

    // Firstly extract credentials from frontend
    const { username, email, password } = req.body;

    // then lets validate the user credentials
    const { error } = signupSchema.validate({ username, email, password });

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
            /* this error is an array which contains all error properties */
        });
    }
    else{
        try{
            // now we will check whether the email already exists or not ?

            const isUserAlreadyExists = await userModel.findOne({ email });
            /*for multiple properties --> { $or: [{name}, {password}] } */

            if (isUserAlreadyExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered'
                });
            }

            // Next is hashing the password (already done in userModel via pre('save'))

            /* STEPS FOR EMAIL VERIFICATION:
                Step 1 : when user registers with email-id, generate random token
                Step 2 : save random token in database as VerificationToken
                Step 3 : generate a Verify URL which will contain frontendURL + verificationToken
                Step 4 : pass this verifyURL to message
                Step 5 : pass the message to emailservice provider
                Step 6 : sen email to user
                Step 7 : accept the token through the frontend
                Step 8 : and verify the token through VerifyEmail REST API
            */

            // step 1: generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            /* step2 :create a new user with updated VerificationToken and save in
            the database*/
            const newlyCreatedUser = await userModel.create({
                username,
                email,
                password,
                verificationToken,
                isVerified: true // changed to true for local server run, otherwise remove this line and comma (,)
            });

            // this Creates a blank profile for the newlycreateduser
            await profileModel.create({ user: newlyCreatedUser._id });

            // Step 3: Build email verification URL
            const verifyUrl = `${process.env.CLIENT_URL || 'https://careersyncmsr.netlify.app'}/verify?token=${verificationToken}`;

            // Step 4: pass the VerifyUrl in the message
            const message = `Welcome to CareerSync Platform!\n\nPlease verify your email by clicking on the following link:\n\n${verifyUrl}`;

            // Step 5: Send verification email
            setTimeout(async() => {
                try {
                    const emailSent=await sendEmail({
                        to:newlyCreatedUser.email,
                        subject: 'CareerSync - Email Verification',
                        text :message
                    })
                    
                    if(!emailSent){
                        console.warn('[Auth] Verification email failed to send in background.');        
                    }
                    console.log("Email Sent Successfully")
                } catch (e) {
                    console.log('Email Send Error :',e);
                }
            },0);

            return res.status(201).json({
                success: true,
                message: 'Account created successfully. Please verify your email.'
            });
        }catch(e){
            console.log(e)
            res.status(500).json({
                success:false,
                message: 'Something went wrong ! Please try again'
            })
        }
    }
    
    const verifyEmail=async (req,res) => {
        try {
            //extract the token from frontend req.params
            /* NOTE :We could sent the token to back-end through req.body
            but its not a good practise, for small data like token,id 
            always use req.params */
            const {token}=req.params
            
            //validate the token
            const isTokenVerified=await userModel.findOne({verificationToken:token})
            
            if(!isTokenVerified){
                return res.status().json({
                    success:false,
                    message:'Invalid or expired verification token'
                })
            }
            userModel.isVerified=true;
            userModel.verificationToken = undefined; //deletes the Verification Token as no need 
            await userModel.save();
        
            return res.status(200).json({
                success: true,
                message: 'Email verified successfully. You can now log in.'
            });
        }catch (e) {
            console.log(e);
            return res.status(500).json({
              success: false,
              message: 'Something went wrong ! Please try again'
            });
        }
    



// // POST /api/login
// const login = async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const user = await userModel.findOne({ username });

//         if (user && (await user.matchPassword(password))) {
            

//             /* changed for local server run otherwise comment out */
//             // if (!user.isVerified) {
//             //     return res.status(403).json({ error: "Please verify your email before logging in" });
//             // }

//             const accessToken = generateAccessToken(user._id);
//             const refreshToken = generateRefreshToken(user._id);

//             res.json({
//                 message: "Login successful",
//                 refresh: refreshToken,
//                 access: accessToken,
//                 user: {
//                     id: user._id,
//                     username: user.username,
//                     email: user.email
//                 }
//             });
//         } else {
//             res.status(400).json({ error: "Invalid credentials" }); // Django view line 29
//         }
//     } catch (error) {
//         console.error('[Auth] Login failed:', error);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

// // POST /api/token/refresh/
// const refreshToken = async (req, res) => {
//     const { refresh } = req.body;

//     if (!refresh) {
//         return res.status(400).json({ refresh: ["This field is required."] });
//     }

//     try {
//         const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
//         const accessToken = generateAccessToken(decoded.id);

//         res.json({
//             access: accessToken,
//         });

//     } catch (error) {
//         return res.status(401).json({ detail: "Token is invalid or expired", code: "token_not_valid" });
//     }
// };


// // POST /api/forgot-password
// const forgotPassword = async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ error: "Please provide an email address" });
//     }

//     try {
//         const user = await userModel.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ error: "No user found with that email" });
//         }

//         const resetToken = crypto.randomBytes(32).toString('hex');
//         const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

//         user.resetPasswordToken = tokenHash;
//         user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
//         await user.save();

//         const clientUrl = process.env.CLIENT_URL || 'https://careersyncmsr.netlify.app';
//         const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

//         const message = `You are receiving this email because you (or someone else) have requested the reset of a password.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}`;

//         // Yield the event loop completely via setTimeout
//         setTimeout(() => {
//             emailSent({
//                 to: user.email,
//                 subject: 'CareerSync - Password Reset Request',
//                 text: message,
//             }).then(async emailSent => {
//                 if (!emailSent) {
//                     console.warn('[Auth] Password reset email failed to send in background.');
//                     user.resetPasswordToken = undefined;
//                     user.resetPasswordExpire = undefined;
//                     await user.save();
//                 }
//             }).catch(e => console.error('[Auth] Async email error:', e));
//         }, 0);

//         // Always return success immediately to prevent timing attacks and server hanging
//         return res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
//     } catch (error) {
//         console.error('[Auth] Forgot password error:', error);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

// // POST /api/reset-password
// const resetPassword = async (req, res) => {
//     const { token, password } = req.body;

//     if (!token || !password) {
//         return res.status(400).json({ error: "Token and new password required" });
//     }

//     try {
//         const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

//         const user = await userModel.findOne({
//             resetPasswordToken: tokenHash,
//             resetPasswordExpire: { $gt: Date.now() }
//         });

//         if (!user) {
//             return res.status(400).json({ error: "Invalid or expired reset token" });
//         }

//         user.password = password;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;

//         await user.save();

//         res.status(200).json({ message: "Password reset successfully. You can now log in." });
//     } catch (error) {
//         console.error('[Auth] Reset password error:', error);
//         res.status(500).json({ error: "Server Error" });
//     }
// };

module.exports = {
    signup,
    login,
    verifyEmail,
    // refreshToken,
    // forgotPassword,
    // resetPassword
};
