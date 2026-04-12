const Application = require('../../../models/ApplicationModels/ApplicationModel');
const Job = require('../../../models/JobModels/JobModel');

// This fuction is written for the student to apply for the job posted by company
const applyToJob = async (req, res) => {
    try {
        /* extract the jobId from the req.params 
        whereas req.params receives the id from frontend and 
        frontend recieves it from jobDetails strored in the js memory
        */
        const { jobId } = req.params;

        // get the job by searching with jobId in the jobmodel
        const job = await Job.findById(jobId);

        // if no job model found, return "Job not found"
        if (!job) return res.status(404).json({
            success: false,
            message: 'Job not found'
        });

        /*check if student already applied,
        a)if applied, check in the ApplicationModel*/
        const existing = await Application.findOne({ job: jobId, student: req.user.id });

        if (existing)
            return res.status(400).json({
                success: false,
                message: 'Already applied to this job'
            });
        /*b) otherwise create a NewEntry in the ApplicationModel */
        const { resumeUrl, coverNote } = req.body;
        
        const application = await Application.create({
            job: jobId,
            student: req.user.id,
            company: job.company,
            resumeUrl: resumeUrl || '',
            coverNote: coverNote || ''
        });

        // Increment the applicationsCount field on the job document
        job.applicationsCount = (job.applicationsCount || 0) + 1;
        await job.save();

        res.status(201).json({
            success: true,
            application
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job.'
            });
        }
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = applyToJob;
