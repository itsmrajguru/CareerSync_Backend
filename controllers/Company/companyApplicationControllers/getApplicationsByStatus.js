const Application = require('../../../models/ApplicationModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');

const getApplicationsByStatus = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company profile not found' });

        const { status } = req.params;
        let query = { company: company._id };
        
        /* if the company wants to see their bookmarked/saved applicants */
        if (status === 'saved') {
            query.isSaved = true;
        } 
        /* otherwise filter by the typical application status, unless it's 'all' */
        else if (status && status !== 'all') {
            query.status = status;
        }

        /* we are fetching all the matching applications to show in the applicants dashboard */
        const applications = await Application.find(query)
            .populate('student', 'username email')
            .populate('job', 'title location department type')
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, applications });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = getApplicationsByStatus;;
