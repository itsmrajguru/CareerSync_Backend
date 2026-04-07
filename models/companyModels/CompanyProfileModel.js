const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: '',
        trim: true
    },

    // we will add it later
    // logo: {
    //     type: String, 
    //     default: ''
    // },
    about: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },

    // Admin approves company before it can post jobs
    isVerified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const companyModel = mongoose.model('Company', companySchema);
module.exports = companyModel;
