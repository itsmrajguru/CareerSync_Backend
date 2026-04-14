const Application = require('../../../models/ApplicationModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');

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

module.exports = getCompanyStats;
