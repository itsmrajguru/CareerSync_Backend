const Application = require('../../models/ApplicationModels/ApplicationModel');
const Job = require('../../models/JobModels/JobModel');
const CompanyProfile = require('../../models/companyModels/CompanyProfileModel');
const StudentProfile = require('../../models/studentModels/StudentProfileModel');
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
        /*b) otherwise create a NewEntry in the ApplicationModel */
        const { resumeUrl, coverNote } = req.body;
        
        const application = await Application.create({
            job: jobId,
            student: req.user.id,
            company: job.company,
            resumeUrl: resumeUrl || '',
            coverNote: coverNote || ''
        });

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

// This function is made for the student to fetch his all applictaions
const getMyApplications = async (req, res) => {
    try {
        //this fetches all applications submitted by the logged-in student
        /* If the user wants a single application then pass the applicationId to the 
        model and serach in the model */
        const applications = await Application.find({ student: req.user.id })
            .populate('job', 'title location jobType status')
            .populate('company', 'name location')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            applications
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

/* this function is written for the company to provide 
    them all jobApplications of a specific job*/

/* NOTE: This controller has been called in the jobroutes */
const getJobApplicants = async (req, res) => {
    try {
        // extract the companyId first 
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company)
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });

        // then extract the jobId
        const { jobId } = req.params;
        const job = await Job.findOne({ _id: jobId, company: company._id });
        if (!job) return res.status(404).json({
            success: false,
            message: 'Job not found or not yours'
        });

        //  and finally get all the applicants who has applied to that job
        const applications = await Application.find({ job: jobId })
            .populate('student', 'username email')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            applications
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}


/* This function is written for updatinng the ApplicantStatus
   for a student applying to it */
const updateApplicantStatus = async (req, res) => {
    try {
        /* extract the status set by the company for a application  
        and the applicationId for which we have to update teh status */

        const { status } = req.body;
        const applicationId = req.params.id;

        /* extract company details */
        const company = await CompanyProfile.findOne({ user: req.user.id });

        /* finding and updating the application with the status
            selected by the company */
        const application = await Application.findOneAndUpdate(
            { _id: applicationId, company: company._id },
            { status },
            { new: true }
        ).populate('student', 'email username').populate('job', 'title');
        /* populates done for seding email to the applicant student */

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found or unauthorized"
            });
        }
        /* creating content to send in the email depending upon the status 
            selected by the company */
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
            /* send email to the user on their registered email Id using resend */
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
        res.status(200).json({
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


/* function for getCompnayStats to power the company dashboard
-->This function is used to return all the dynamic data that the company
 dashboard page is showing
 
    a) the last 10 applicants across all company jobs
    b) stats:count of applied,shortilisted,rejected,hired for pipeline chart */

/* LOGIC : */
const getCompanyStats = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company profile not found' });

        // Recent applicants across all this company's jobs
        const recentApplications = await Application.find({ company: company._id })
            .populate('student', 'username email')
            .populate('job', 'title location')
            .sort({ appliedAt: -1 })
            .limit(10);

        // Aggregate pipeline counts by status: applied, shortlisted, rejected, hired
        const statusGroups = await Application.aggregate([
            { $match: { company: company._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = { applied: 0, shortlisted: 0, rejected: 0, hired: 0 };
        statusGroups.forEach(s => {
            if (Object.prototype.hasOwnProperty.call(stats, s._id)) stats[s._id] = s.count;
        });

        return res.status(200).json({ success: true, recentApplications, stats });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

/* This function is created for the company to get the details 
of the applicant for a particular job post */


const getApplicationDetails = async (req, res) => {
    try {
        /* step 1: get the company */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company)
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });

        /*step 2: get the application to get details of the student*/
        const application = await Application.findOne({ _id: req.params.id, company: company._id })
            .populate('job', 'title location jobType')
            .populate('student', 'username email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // also fetch the student's full profile (skills, about, portfolio)
        const studentProfile = await StudentProfile.findOne({ user: application.student._id });

        return res.status(200).json({
            success: true,
            application,
            studentProfile
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = { getJobApplicants, updateApplicantStatus, applyToJob, getMyApplications, getCompanyStats, getApplicationDetails };
