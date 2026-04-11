const Application = require('../../../models/ApplicationModels/ApplicationModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');
const StudentProfile = require('../../../models/studentModels/StudentProfileModel');

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

module.exports = getApplicationDetails;
