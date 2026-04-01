require('dotenv').config();
const jwt = require('jsonwebtoken');
const joi = require('joi');
const userModel = require('../models/User');
const crypto = require('crypto');
const profileModel = require('../models/Profile');
const bcrypt = require('bcryptjs');
const otpModel = require('../models/Otp');
const { sendEmail } = require('../services/emailService');

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

const loginSchema = joi.object({
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
        console.error("Signup validation error:", error.details[0].message);
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    else {
        try {
            /* now we will check whether the emailId or email
             already exists or not ?*/

            const isUserAlreadyExists = await userModel.findOne({
                $or: [
                    { email }, { username }
                ]
            })

            if (isUserAlreadyExists) {
                const msg = isUserAlreadyExists.email === email
                    ? "Email is already registered"
                    : "Username is already taken"

                console.error("Signup error:", msg);
                return res.status(400).json({
                    success: false,
                    message: msg
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

            //EXTRA :Hash Token
            const hashedVerificationToken = crypto
                .createHash('sha256')
                .update(verificationToken)
                .digest('hex')

            /* step2 :create a new user with updated VerificationToken and save in
            the database*/
            const getUser = await userModel.create({
                username,
                email,
                password,
                verificationToken: hashedVerificationToken,
                isVerified: true // LOCAL DEV ONLY — comment this out before deploying to production
            });

            // this Creates a blank profile for the getUser
            await profileModel.create({ user: getUser._id });

            // Step 3: Build email verification URL
            const verifyUrl = `${process.env.CLIENT_URL || 'https://careersyncplatform.netlify.app'}/verify?token=${verificationToken}`;

            // Step 4: pass the VerifyUrl in the message
            const message = `Welcome to CareerSync Platform!\n\nPlease verify your email by clicking on the following link:\n\n${verifyUrl}`;

            // Step 5: Send verification email
            setTimeout(async () => {
                try {
                    const emailSent = await sendEmail({
                        to: getUser.email,
                        subject: 'CareerSync - Email Verification',
                        text: message
                    })

                    if (!emailSent) {
                        console.log(`Verification Email send failed...`);
                    }
                    console.log("Email Sent Successfully")
                } catch (e) {
                    console.log('Email Send Error :', e);
                }
            }, 0);

            return res.status(201).json({
                success: true,
                message: 'Account created successfully. Please verify your email.'
            });
        } catch (e) {
            console.log(e)
            res.status(500).json({
                success: false,
                message: 'Something went wrong ! Please try again'
            })
        }
    }
}; // Fixed: Added missing closing brace for signup function



// ─── OLD LOGIN SYSTEM (Email Verification) — kept for reference ───────────────
// const login_OLD_EMAIL_VERIFICATION = async (req, res) => {
//     const { email, password } = req.body;
//     const { error } = loginSchema.validate({ email, password })
//     if (error) {
//         return res.status(400).json({ success: false, message: error.details[0].message });
//     } else {
//         try {
//             const getUser = await userModel.findOne({ email })
//             if (!getUser) return res.status(400).json({ success: false, message: 'Incorrect Email' });
//             const isPasswordCorrect = await getUser.matchPassword(password)
//             if (!isPasswordCorrect) return res.status(400).json({ success: false, message: 'Incorrect Password' });
//             if (!getUser.isVerified) {
//                 return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
//             }
//             const accessToken = generateAccessToken(getUser?._id)
//             const refreshToken = generateRefreshToken(getUser?._id)
//             res.cookie('refreshToken', refreshToken, {
//                 httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 24 * 60 * 60 * 1000
//             })
//             return res.status(200).json({
//                 success: true, message: 'Login Successful', accessToken,
//                 user: { _id: getUser._id, username: getUser.username, email: getUser.email }
//             });
//         } catch (e) {
//             console.log(e)
//             res.status(500).json({ success: false, message: 'Something went wrong ! Please try again' })
//         }
//     }
// }
// ─────────────────────────────────────────────────────────────────────────────

// Login Controller — validates credentials and sends OTP via email
const login = async (req, res) => {
    //extract user credentials from req.body
    const { email, password } = req.body;

    //validate the credenetials with joi.object
    const { error } = loginSchema.validate({ email, password })

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    else {
        try {
            // step 1: verify whether the emailId is registered or not
            const getUser = await userModel.findOne({ email })
            if (!getUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect Email'
                });
            }

            // step 2: bcrypt the password
            const isPasswordCorrect = await getUser.matchPassword(password)

            if (!isPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect Password'
                });
            }

            // step 3: generate a 6-digit OTP and delete any previous OTPs for this email
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await otpModel.deleteMany({ email });
            await otpModel.create({ email, otp: otpCode });

            // step 4: send OTP email via Resend
            const html = `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0fbfe;border-radius:16px;">
                    <h2 style="color:#0179a0;margin-bottom:8px;">Your CareerSync Login Code</h2>
                    <p style="color:#444;font-size:15px;">Use the OTP below to complete your login. It expires in <strong>10 minutes</strong>.</p>
                    <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#111;background:#fff;border:2px solid #b3eefb;border-radius:12px;padding:20px 28px;display:inline-block;margin:20px 0;">${otpCode}</div>
                    <p style="color:#888;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
                </div>
            `;

            setTimeout(async () => {
                try {
                    await sendEmail({
                        to: email,
                        subject: 'CareerSync — Your Login OTP',
                        text: `Your CareerSync OTP is: ${otpCode}. It expires in 10 minutes.`,
                        html
                    });
                } catch (e) {
                    console.log('OTP Email Send Error:', e);
                }
            }, 0);

            return res.status(200).json({
                success: true,
                message: 'OTP sent to your email address',
                requiresOtp: true,
                email
            });
        } catch (e) {
            console.log(e)
            res.status(500).json({
                success: false,
                message: 'Something went wrong ! Please try again'
            })
        }
    }
}

// Verify OTP Controller — validates OTP code and issues JWT tokens
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const record = await otpModel.findOne({ email });

        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found. Please login again.' });
        }

        if (record.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }

        // OTP is valid — delete it so it cannot be reused
        await otpModel.deleteMany({ email });

        const getUser = await userModel.findOne({ email });

        // Generate Access & Refresh Tokens
        const accessToken = generateAccessToken(getUser._id);
        const refreshToken = generateRefreshToken(getUser._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Login Successful',
            accessToken,
            user: {
                _id: getUser._id,
                username: getUser.username,
                email: getUser.email
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
}

// VerifyEmail Controller 
const verifyEmail = async (req, res) => {
    try {
        //extract the token from frontend req.params
        /* NOTE :We could sent the token to back-end through req.body
        but its not a good practise, for small data like token,id 
        always use req.params */
        const { token } = req.params

        // Fixed: Hash the incoming token before searching the DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        //validate the token
        const isTokenVerified = await userModel.findOne({ verificationToken: hashedToken })

        if (!isTokenVerified) {
            return res.status(400).json({ // Fixed: Added 400 status code
                success: false,
                message: 'Invalid or expired verification token'
            })
        }

        // Fixed: Use document instance instead of Model class
        isTokenVerified.isVerified = true;
        isTokenVerified.verificationToken = undefined; //deletes the Verification Token as no need 
        await isTokenVerified.save();

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong ! Please try again'
        });
    }
}


// POST /api/auth/token/refresh
const refreshToken = async (req, res) => {
    //extract the refresh Token from cookies
    /* refreshToken is automatically send by axios due to
    withCredentials : true*/
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No refresh token found. Please login again.'
        });
    }
    try {
        /* Step 1: Verify the token, Decode it and it will return
            the original _id giveb by MongoDB,as we created token with
            the help of that id */
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

        //step2 :Generate new acess token
        const newAccessToken = generateAccessToken(decoded?.id)

        return res.status(200).json({
            success: true,
            message: 'New Access Token generated Successfully',
            newAccessToken /*this will be stored in the originalRequest.headers.[authorization]
          as a bearer token */
        });

    } catch (e) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token invalid or expired. Please login again.'
        });
    }
}


// Forgot Password Controller
const forgotPassword = async (req, res) => {
    //extract the email from req.body
    const { email } = req.body

    //define emailSchema using joi
    const emailSchema = joi.object({
        email: joi.string().email().required()
    })

    //validate the emailSchema
    const { error } = emailSchema.validate({ email })

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    else {
        try {
            //step 1 :Validate the email,whether registered or not ?
            const getUser = await userModel.findOne({ email, })

            // Even If , user is not registerd ,stilll show 200
            if (!getUser) {
                return res.status(200).json({
                    success: true,
                    message: 'If this email is registered, a reset link has been sent.'
                });
            }

            //Step 1:generate a reset Token
            const resetToken = crypto.randomBytes(32).toString('hex')

            //EXTRA :hash reset Token
            const hashedResetToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex')
            //update DB with resetToken
            getUser.resetPasswordToken =hashedResetToken;
            getUser.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
            await getUser.save()

            //step 3:Inject the reset Token in the resetURL
            const resetURL = `${process.env.CLIENT_URL || 'https://careersyncplatform.netlify.app'}/reset-password?token=${resetToken}`

            //Step 4 :generate a message
            const msg = `You requested a password reset.\n\nReset your password here (valid 15 mins):\n\n${resetURL}\n\nIgnore this email if you didn't request it.`

            //step 5 :Send Email
            setTimeout(async () => {
                try {
                    const emailSent = await sendEmail({
                        to: getUser.email,
                        subject: 'CareerSync - Password Reset Request',
                        text: msg
                    })
                    if (!emailSent) {
                        console.log('Email Reset Link send failed')
                    }
                } catch (e) {
                    console.log('Reset Email Send Error:', e);
                }
            }, 0);
            return res.status(200).json({
                success: true,
                message: 'If this email is registered, a reset link has been sent.'
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                success: false,
                message: 'Something went wrong! Please try again'
            });
        }
    }
}

// Reset Password Controller

const resetPassword = async (req, res) => {
    /*extract newPassword as well as the token extracted by
    frontend from email*/
    const { token, newPassword } = req.body

    //generate a newPassword Validation Schema
    const newPasswordSchema = joi.object({
        newPassword: joi.string().min(6).required()
    })

    //validate the newPassword
    const { error } = newPasswordSchema.validate({ newPassword })

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    else {
        try {
            // Fixed: Hash the incoming token before searching the DB
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            //validate token
            const getUser = await userModel.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: Date.now() }
            })

            if (!getUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token. Please try again !'
                });
            }

            //otherwise update DB with new Password
            getUser.password = newPassword
            getUser.resetPasswordToken = undefined
            getUser.resetPasswordExpire = undefined

            await getUser.save()
            return res.status(200).json({
                success: true,
                message: 'Password reset successfully. Please login.'
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                success: false,
                message: 'Something went wrong! Please try again'
            });
        }
    }
}
module.exports = {
    signup,
    login,
    verifyOtp,
    verifyEmail,
    refreshToken,
    resetPassword,
    forgotPassword
}