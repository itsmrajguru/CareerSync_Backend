const mongoose = require('mongoose');


/* We are creating this To maintain A bridge between the student And the 
company So this model is Actually responsible for the actual status of the job Which
 will be displayed To the student by the company */

// Full tracking of the job will be done through this application Model

/* Application Schema
   Created when a student presses "Apply" on a job.

   Status flow:
     applied → shortlisted → hired
     applied → rejected

   Only the company can change status.
   Student sees their current status on the My Applications page.
   Email is triggered (via Resend) whenever status changes.

   A unique compound index on (student, job) prevents
   a student from applying to the same job twice.
*/

const applicationSchema = new mongoose.Schema({

    // Who applied
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Which job they applied to
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },

    // Which company owns this job
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    // Stored resume URL — either from profile or freshly uploaded
    resumeUrl: {
        type: String,
        default: ''
    },

    // Optional cover note the student writes at apply time
    coverNote: {
        type: String,
        default: ''
    },

    // Current status — company updates this
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'rejected', 'hired'],
        default: 'applied'
    },

    appliedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevents duplicate applications from the same student for the same job
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

// Auto-update updatedAt on every save
applicationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const applicationModel = mongoose.model('Application', applicationSchema);
module.exports = applicationModel;
