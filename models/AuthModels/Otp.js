const mongoose = require('mongoose');

//OTP Schema — stores a temporary 6-digit code tied to a user email
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    }
});

//automatically delete expired OTPs from the DB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpModel = mongoose.model('Otp', otpSchema);

module.exports = otpModel;
