const Interview = require('../../../models/InterviewModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');

/* function to fetch all interviews scheduled by a specific company
logic : 1)verify the company first
        2)find all interviews linked to this company and sort them */

const getCompanyInterviews = async (req, res) => {
    try {
        /* step 1 :before fetching interviews,
        check whether the company exits or not ? */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        /* step 2 : get all the interviews for this company */
        const interviews = await Interview.find({ company: company._id })
            .populate('student', 'email username')
            .populate('job', 'title')
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

module.exports = getCompanyInterviews;;
