const Application = require('../../models/ApplicationModels/ApplicationModel');
const Job = require('../../models/JobModels/JobModel');
const CompanyProfile = require('../../models/companyModels/CompanyProfileModel');
const { sendEmail } = require('../../services/emailService');


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
    /*b) otherwise creeate a NewEntry in the ApppicationModel */
    const application = await Application.create({
        job: jobId,
        student: req.user.id,
        company: job.company
    });
    
    res.status(201).json({
        success: true,
        application
    });
} catch (e) {
    res.status(500).json({
        success: false,
        message: e.message
    });
}
}

// This function is made for the student to fetch his all applictaions
const getMyApplications = async (req, res) => {
    try {
        //this fetches all applications submitted by the logged-in student
        const applications = await Application.find({ student: req.user.id })
            .populate('job', 'title location jobType status')
            .populate('company', 'name logo')
            .sort({ appliedAt: -1 });

        res.status(200).json({ success: true, applications });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

const getJobApplicants = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company profile not found' });
        
        const { jobId } = req.params;
        const job = await Job.findOne({ _id: jobId, company: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found or not yours' });
        
        const applications = await Application.find({ job: jobId })
        .populate('student', 'username email')
        .sort({ appliedAt: -1 });
        
        res.status(200).json({ success: true, applications });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

const updateApplicantStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        
        const company = await CompanyProfile.findOne({ user: req.user.id });
        
        const application = await Application.findOneAndUpdate(
            { _id: applicationId, company: company._id },
            { status },
            { new: true }
        ).populate('student', 'email username').populate('job', 'title');
        
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found or unauthorized" });
        }
        
        if (['shortlisted', 'rejected', 'hired'].includes(status)) {
            let subject = '';
            let text = '';
            if (status === 'shortlisted') {
                subject = `You've been shortlisted for ${application.job.title}!`;
                text = `Hi ${application.student.username}! We are glad to inform you that your application for the ${application.job.title} role at ${company.name || 'our company'} has been shortlisted.`;
            } else if (status === 'rejected') {
                subject = `Update on your application for ${application.job.title}`;
                text = `Hi ${application.student.username}, thank you for applying for the ${application.job.title} role at ${company.name || 'our company'}. Unfortunately, we will not be moving forward with your application at this time.`;
            } else if (status === 'hired') {
                subject = `Congratulations! You're hired for ${application.job.title}!`;
                text = `Hi ${application.student.username}, congratulations! You have been selected for the ${application.job.title} role at ${company.name || 'our company'}. The team will reach out with next steps.`;
            }
            
            setTimeout(async () => {
                try {
                    await sendEmail({
                        to: application.student.email,
                        subject,
                        text
                    });
                } catch (e) {
                    console.log("Email sending error:", e);
                }
            }, 0);
        }

        res.status(200).json({ success: true, application });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}



module.exports = { getJobApplicants, updateApplicantStatus, applyToJob, getMyApplications };
