require('dotenv').config();
const jwt = require('jsonwebtoken');
const joi = require('joi');
const userModel = require('../../models/AuthModels/UserModel');
const crypto = require('crypto');
const profileModel = require('../../models/StudentProfileModel');
const companyModel = require('../../models/CompanyProfileModel');
const bcrypt = require('bcryptjs');
const otpModel = require('../../models/AuthModels/OtpModel');
const { sendEmail } = require('../../services/emailService');

//creating Token Generators
// Both id AND role are embedded in the token payload so that authMiddleware
// can set req.user = { id, role } and roleMiddleware can check req.user.role.
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });
};


// user Credentials are validated using these properties
const signupSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    role: joi.string().valid('student', 'company').default('student')
    // Change 1: admin accounts cannot be self-registered
});

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
});

// Signup Controller 

const signup = async (req, res) => {

    // Firstly extract credentials from frontend
    //Change 1: extract role from request body
    const { username, email, password, role = 'student' } = req.body;

    // then lets validate the user credentials
    const { error } = signupSchema.validate({ username, email, password, role });

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

            const existingUser = await userModel.findOne({
                $or: [
                    { email }, { username }
                ]
            })

            /* if user already exists and is verified, reject */
            if (existingUser && existingUser.isVerified) {
                const msg = existingUser.email === email
                    ? "Email is already registered"
                    : "Username is already taken"

                console.error("Signup error:", msg);
                return res.status(400).json({
                    success: false,
                    message: msg
                });
            }

            /* if user exists but is not verified, delete the stale record
            and allow them to re-register */
            if (existingUser && !existingUser.isVerified) {
                await userModel.deleteOne({ _id: existingUser._id });
            }

            // Next is hashing the password (already done in userModel via pre('save'))

            /* STEPS FOR OTP EMAIL VERIFICATION:
                Step 1 : Create a new user with isVerified: false
                Step 2 : Generate a random 6-digit OTP
                Step 3 : Delete any old OTPs for this email and save the new one
                Step 4 : Build OTP email HTML
                Step 5 : Send OTP email to user via Resend
                Step 6 : Return requiresOtp: true so frontend shows the OTP input
                Step 7 : User enters OTP on frontend → calls /verify-signup-otp
                Step 8 : On OTP match, mark isVerified: true and create blank profile
            */

            // Step 1 : Create the user with isVerified false (pending verification)
            // Change 1: include role when creating the user 
            await userModel.create({
                username,
                email,
                password,
                role,
                isVerified: false
            });

            // Step 2 : generate a 6-digit OTP and clear any previous OTPs for this email
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await otpModel.deleteMany({ email });
            await otpModel.create({ email, otp: otpCode });

            // Step 3 : Build OTP email HTML
            const html = `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0fbfe;border-radius:16px;">
                    <h2 style="color:#0179a0;margin-bottom:8px;">Verify Your CareerSync Account</h2>
                    <p style="color:#444;font-size:15px;">Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
                    <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#111;background:#fff;border:2px solid #b3eefb;border-radius:12px;padding:20px 28px;display:inline-block;margin:20px 0;">${otpCode}</div>
                    <p style="color:#888;font-size:12px;">If you did not create a CareerSync account, you can safely ignore this email.</p>
                </div>
            `;

            // Step 4 : Send OTP email via Resend
            setTimeout(async () => {
                try {
                    const emailSent = await sendEmail({
                        to: email,
                        subject: 'CareerSync — Verify Your Account',
                        text: `Your CareerSync verification OTP is: ${otpCode}. It expires in 10 minutes.`,
                        html
                    })

                    if (!emailSent) {
                        console.log(`Verification OTP Email send failed...`);
                    }
                    console.log("Email Sent Successfully")
                } catch (e) {
                    console.log('Email Send Error :', e);
                }
            }, 0);

            return res.status(201).json({
                success: true,
                message: 'OTP sent to your email. Please verify to complete registration.',
                requiresOtp: true,
                email,
                role  // Change 1: return role so frontend can store it for the OTP page
            });
        } catch (e) {
            console.log(e)
            res.status(500).json({
                success: false,
                message: 'Something went wrong ! Please try again'
            })
        }
    }
};


// Verify Signup OTP Controller — validates OTP and marks user as verified
const verifySignupOtp = async (req, res) => {
    //extract email and otp from req.body
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        //step 1 : look up the OTP record for this email
        const record = await otpModel.findOne({ email });

        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found. Please sign up again.' });
        }

        //step 2 : compare the entered OTP with the saved one
        if (record.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }

        // OTP is valid — delete it so it cannot be reused
        await otpModel.deleteMany({ email });

        //step 3 : mark the user as verified in the database
        const user = await userModel.findOneAndUpdate({ email }, { isVerified: true }, { new: true });

        // Change 1: create blank profiles for the verified users on the basis of role
        // if role ->student , then create blank profile in the studentProfile
        // otherwise create blank profile in the CompanyProfile d

        if (user.role === 'student') {
            await profileModel.create({ user: user._id });
        } else if (user.role === 'company') {
            await companyModel.create({ user: user._id });
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.',
            role: user.role  // Change 1:frontend uses this to redirect to correct login page
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
}


// Login Controller — validates credentials and issues JWT tokens directly
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
            const getUser = await userModel.findOne({ email: email.trim().toLowerCase() })
            if (!getUser) return res.status(400).json({ success: false, message: 'Incorrect Email' });

            // step 2: bcrypt the password
            const isPasswordCorrect = await getUser.matchPassword(password)

            if (!isPasswordCorrect) return res.status(400).json({ success: false, message: 'Incorrect Password' });

            // step 3: check if the user has verified their email via OTP during signup
            if (!getUser.isVerified) {
                return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
            }

            // step 4: generate access and refresh tokens and set cookie
            // Pass role so req.user.role is available throughout all protected routes
            const accessToken = generateAccessToken(getUser?._id, getUser?.role)
            const refreshToken = generateRefreshToken(getUser?._id)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 24 * 60 * 60 * 1000
            })

            //return role in login response 
            // Frontend uses role to redirect:
            //   student → /student/dashboard
            //   company → /company/dashboard
            //   admin   → /admin/dashboard
            return res.status(200).json({
                success: true,
                message: 'Login Successful',
                accessToken,
                user: {
                    _id: getUser._id,
                    username: getUser.username,
                    email: getUser.email,
                    role: getUser.role
                }
            });
        } catch (e) {
            console.log(e)
            res.status(500).json({ success: false, message: 'Something went wrong ! Please try again' })
        }
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

        //step2 :Generate new access token
        // Note: refresh tokens don't carry role, so fetch user to get current role
        const refreshUser = await userModel.findById(decoded?.id).select('role');
        const newAccessToken = generateAccessToken(decoded?.id, refreshUser?.role)

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
            const normalizedEmail = email.trim().toLowerCase();
            const getUser = await userModel.findOne({ email: normalizedEmail })

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
            getUser.resetPasswordToken = hashedResetToken;
            getUser.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
            await getUser.save()

            //step 3:Inject the reset Token in the resetURL
            const resetURL = `${process.env.CLIENT_URL || 'CLIENT_URL=http://localhost:5173'}/reset-password?token=${resetToken}`

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
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required.' });
            }

            // Fixed: Hash the incoming token before searching the DB
            // Added .trim() to handle potential whitespace from copy-paste
            const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

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


/*Function for changePassword feature in the settings:*/

/* LOGIC : First get the saved password of the user from the database
        and compare with the cureent password, if dont match return error
        otherwise replace the currentPassword with the new Password*/
const changePassword = async (req, res) => {
    /*step 0 :extract the currentPassword and new Password from req.body*/
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Provide current password and a new password (min 6 chars).'
        })
    }
    try {
        /*step 1 :First get the passwordof the user from the database */
        const user = await userModel.findById(req.user.id).select('+password')
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found.'
            })
        }
        /*step 2 :otherwise compare the saved Password and currentPassword */
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        /*step 3: update the saved password with the new password */
        // Note: pre('save') hook in UserModel will handle hashing.
        user.password = newPassword;
        await user.save();

        /* step 4 :return success signal */
        return res.json({
            success: true,
            message: 'Password changed successfully.'
        });
    } catch (e) {
        console.error('changePassword error:', e);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.'
        });
    }
};


/*Function for deleteuser feature in the settings:*/

const deleteMe = async (req, res) => {
    try {
        /* step 1 :extract the user from the authemeticated user.id
        taken from req.user.id*/
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Delete user prfile based on the role
        if (user.role === 'student') {
            await profileModel.findOneAndDelete({ user: userId });
        } else if (user.role === 'company') {
            await companyModel.findOneAndDelete({ user: userId });
        }
        // Delete User
        await userModel.findByIdAndDelete(userId);
        // Clear refresh token cookie if exists
        res.clearCookie('refreshToken');
        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (e) {
        console.error('deleteMe error:', e);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

module.exports = {
    signup,
    verifySignupOtp,
    login,
    refreshToken,
    resetPassword,
    forgotPassword,
    changePassword,
    deleteMe,
}
