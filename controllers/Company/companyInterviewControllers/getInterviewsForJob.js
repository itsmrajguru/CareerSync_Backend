const Interview = require('../../../models/InterviewModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');

/* function to show the scheduled interviews for a specific job posted by the company
logic:    1) verify the company first so that we could show their data only
          2) search the interviews in the InterviewModel on the basis of
             the company and jobId and sort it */

const getInterviewsForJob = async (req, res) => {
    try {
        // extract the jobId from the req.params
        const jobId = req.params.jobId;

        /* step 1 :get the company first */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        /* step 2 : get the interviews depending upon the company and job */
        const interviews = await Interview.find({ job: jobId, company: company._id })
            .populate('student', 'username email')
            .sort({ scheduledAt: 1 });

        res.status(200).json({
            success: true,
            interviews
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = getInterviewsForJob;;
