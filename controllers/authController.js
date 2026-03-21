require('dotenv').config();
const jwt = require('jsonwebtoken');
const joi = require('joi');
const userModel = require('../models/User');
const crypto = require('crypto');
const profileModel = require('../models/Profile');
const bcrypt = require('bcryptjs');
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
    password: joi.string().min(4).required()
});

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(4).required()
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
                    : "Username  is already taken"

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
                isVerified: true // changed to true for local server run, otherwise remove this line and comma (,)
            });

            // this Creates a blank profile for the getUser
            await profileModel.create({ user: getUser._id });

            // Step 3: Build email verification URL
            const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify?token=${verificationToken}`;

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
                        console.log(`Vericaltion Email send failed...`);
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


// Login Controller 
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

            // step 2: brcypt the password
            const isPasswordCorrect = await getUser.matchPassword(password)

            if (!isPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect Password'
                });
            }

            //step 3:Check is the user Vetified 
            /*when the user will verify the email
            we are changing isVEerified===true and here
            if the user is not verified,the this function will run*/

            if (!getUser.isVerified) {
                return res.status(200).json({
                    success: false,
                    message: 'Please verify your email before logging in'
                });
            }
            //step 4:Generate Access & Refresh Tokens
            const accessToken = generateAccessToken(getUser?._id)
            const refreshToken = generateRefreshToken(getUser?._id)

            //step 5: putting the tokens in the Cookie-Parser
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, //js can not access it
                secure: false,   // set true in production as (HTTPS)
                sameSite: 'Lax',    // CSRF protection 
                maxAge: 24 * 60 * 60 * 1000
            })

            return res.status(200).json({
                success: true,
                message: 'Login Successful',
                accessToken,
                /*only access token is sent in response because
                it is storedd in the localStorage and sent to authMiddleware 
                for verification of user by every 15 min  */
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

// VerifyEmail Controller 
const verifyEmail = async (req, res) => {
    try {
        //extract the token from frontend req.params
        /* NOTE :We could sent the token to back-end through req.body
        but its not a good practise, for small data like token,id 
        always use req.params */
        const { token } = req.params

        //validate the token
        const isTokenVerified = await userModel.findOne({ verificationToken: token })

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

        return res.status(201).json({
            success: true,
            message: 'NewAcessToken generated Successfully',
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
            const resetURL = `${process.env.CLIENT_URL || 'https://careersyncmsr.netlify.app'}/reset-password?token=${resetToken}`

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
        newPassword: joi.string().min(4).required()
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
            //validate token
            const getUser = await userModel.findOne({
                resetPasswordToken: token,
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
    verifyEmail,
    refreshToken,
    resetPassword,
    forgotPassword
}