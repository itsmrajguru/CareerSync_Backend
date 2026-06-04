const mongoose = require('mongoose');

/* Interview Schema
   Created when a company schedules an interview for a shortlisted application.

   Status flow:
     scheduled → completed
     scheduled → cancelled

   Only the company can schedule or cancel.
   Student sees their interviews on their dashboard.
   Email is triggered (via Resend) whenever interview is scheduled or cancelled.
*/

const interviewSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyProfile',
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    mode: {
        type: String,
        enum: ['online', 'phone', 'in-person'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    }
}, { timestamps: true });

// creating a model
const interviewModel = mongoose.model('Interview', interviewSchema);
module.exports = interviewModel;;
