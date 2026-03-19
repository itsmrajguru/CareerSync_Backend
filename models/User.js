const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: true //changed for local server run otherwise false
    },
    verificationToken: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    date_joined: {
        type: Date,
        default: Date.now
    }
});

// Match Django's password hashing (bcrypt is close enough for new users, 
// for existing Django users we'd need a custom hasher but this is a re-implementation, assuming fresh DB or migration)
// User didn't ask for data migration, just re-implementation.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
