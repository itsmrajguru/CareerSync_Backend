const Application = require('../../../models/ApplicationModels/ApplicationModel');
const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');

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

module.exports = getJobApplicants;
