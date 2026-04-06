const mongoose = require('mongoose');

/* Job Schema
   Jobs are posted by verified companies.
   Students browse and apply to these internal platform jobs.
   Status 'open' = accepting applications.
   Status 'closed' = company stopped accepting.
*/

/* Note :This is not a fixed jobModel 
we might change it depending upon the requirements */
const jobSchema = new mongoose.Schema({

    // Which company posted this job
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    // Core job info
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
        default: 'full-time'
    },
    location: {
        type: String,
        default: ''
    },
    salary: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        isVisible: { type: Boolean, default: true }
    },

    deadline: {
        type: Date
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },

    applicationsCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const jobModel = mongoose.model('Job', jobSchema);
module.exports = jobModel;
