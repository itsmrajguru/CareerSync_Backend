const Application = require('../../../models/ApplicationModel');
const Job = require('../../../models/JobModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');
const { createNotification } = require('../../../utils/notificationHelper');

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

        // check if the deadline has passed
        if (job.deadline && new Date() > new Date(job.deadline)) {
            return res.status(400).json({
                success: false,
                message: 'The deadline for this job has passed'
            });
        }

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

        job.applicationsCount = (job.applicationsCount || 0) + 1;
        await job.save();

        // Trigger Notification to Company
        // job.company = CompanyProfile._id, so we look up CompanyProfile.user to get the User._id
        const companyProfile = await CompanyProfile.findById(job.company).select('user');
        if (companyProfile?.user) {
            createNotification({
                recipient: companyProfile.user, // User._id of the company owner
                sender: req.user.id,            // User._id of the student
                type: 'new_application',
                title: 'New Applicant Received',
                message: `A new student has applied for your "${job.title}" position.`,
                link: `/company/jobs/${jobId}/applicants`
            });
        }

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
