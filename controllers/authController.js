const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendEmail } = require('../services/emailService');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });
};

// POST /api/login
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            

            /* changed for local server run otherwise comment out */
            // if (!user.isVerified) {
            //     return res.status(403).json({ error: "Please verify your email before logging in" });
            // }

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            res.json({
                message: "Login successful",
                refresh: refreshToken,
                access: accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } else {
            res.status(400).json({ error: "Invalid credentials" }); // Django view line 29
        }
    } catch (error) {
        console.error('[Auth] Login failed:', error);
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/signup
const signup = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Please provide all required fields" });
    }

    try {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            username,
            email,
            password,
            verificationToken,
            isVerified: true // changed to true for local server run , otherwise remove this line and comma (,)
        });
        await Profile.create({ user: user._id });

        const verifyUrl = `${process.env.CLIENT_URL || 'https://careersyncmsr.netlify.app'}/verify?token=${verificationToken}`;

        const message = `Welcome to CareerSync!\n\nPlease verify your email by clicking on the following link:\n\n${verifyUrl}`;

        // Yield the event loop completely to guarantee the HTTP response sends INSTANTLY
        setTimeout(() => {
            sendEmail({
                to: user.email,
                subject: 'CareerSync - Email Verification',
                text: message
            }).then(emailSent => {
                if (!emailSent) {
                    console.warn('[Auth] Verification email failed to send in background.');
                }
            }).catch(e => console.error('[Auth] Async email error:', e));
        }, 0);

        return res.status(200).json({
            message: "Account created successfully. Please check your email to verify your account."
        });
    } catch (error) {
        console.error('[Auth] Signup error:', error);
        res.status(400).json({ error: "Server Error" });
    }
};

// POST /api/token/refresh/
const refreshToken = async (req, res) => {
    const { refresh } = req.body;

    if (!refresh) {
        return res.status(400).json({ refresh: ["This field is required."] });
    }

    try {
        const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken(decoded.id);

        res.json({
            access: accessToken,
        });

    } catch (error) {
        return res.status(401).json({ detail: "Token is invalid or expired", code: "token_not_valid" });
    }
};

// GET /api/verify/:token
const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error('[Auth] Verify email error:', error);
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Please provide an email address" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "No user found with that email" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = tokenHash;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'https://careersyncmsr.netlify.app';
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

        const message = `You are receiving this email because you (or someone else) have requested the reset of a password.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}`;

        // Yield the event loop completely via setTimeout
        setTimeout(() => {
            sendEmail({
                to: user.email,
                subject: 'CareerSync - Password Reset Request',
                text: message,
            }).then(async emailSent => {
                if (!emailSent) {
                    console.warn('[Auth] Password reset email failed to send in background.');
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpire = undefined;
                    await user.save();
                }
            }).catch(e => console.error('[Auth] Async email error:', e));
        }, 0);

        // Always return success immediately to prevent timing attacks and server hanging
        return res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
    } catch (error) {
        console.error('[Auth] Forgot password error:', error);
        res.status(500).json({ error: "Server Error" });
    }
};

// POST /api/reset-password
const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: "Token and new password required" });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error('[Auth] Reset password error:', error);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = {
    login,
    signup,
    refreshToken,
    verifyEmail,
    forgotPassword,
    resetPassword
};
