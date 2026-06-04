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
    logo: {
        type: String, 
        default: ''
    },
    tagline: {
        type: String,
        default: ''
    },
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
    employeesCount: {
        type: Number,
        default: 0
    },
    foundedYear: {
        type: Number,
        default: 2020
    },
    mission: {
        type: String,
        default: ''
    },
    vision: {
        type: String,
        default: ''
    },
    values: {
        type: [String],
        default: []
    },
    workCulture: {
        type: String,
        default: ''
    },
    benefits: {
        type: [String],
        default: []
    },
    learningOpportunities: {
        type: String,
        default: ''
    },
    remotePolicy: {
        type: String,
        default: 'Onsite'
    },
    growthOpportunities: {
        type: String,
        default: ''
    },
    mainProducts: {
        type: [String],
        default: []
    },
    services: {
        type: [String],
        default: []
    },
    technologiesUsed: {
        type: [String],
        default: []
    },
    marketsServed: {
        type: [String],
        default: []
    },
    linkedIn: {
        type: String,
        default: ''
    },
    twitter: {
        type: String,
        default: ''
    },
    views: {
        type: Number,
        default: 0
    },
    followersCount: {
        type: Number,
        default: 0
    },
    /* admin has to approve this company before they can start posting their jobs */
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
