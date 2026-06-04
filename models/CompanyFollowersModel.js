const mongoose = require('mongoose');

// followers schema
const followersSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    followedAt: {
        type: Date,
        default: Date.now
    }
});

// index to make searches fast
followersSchema.index({ studentId: 1, companyId: 1 }, { unique: true });

const CompanyFollowers = mongoose.model('CompanyFollower', followersSchema);
module.exports = CompanyFollowers;
