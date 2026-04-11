const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');

/* function to get the jobs posted  by the company
logic : 1)verify the company first
        2)seracah for the jobs in the jobmodel with adding the companyId and sort in it*/
const getMyJobs = async (req, res) => {
    try {
        // extract the companyId from req.user.id
        const company = await CompanyProfile.findOne({ user: req.user.id });
        // extract the jobs created by company and sort by newsest first
        const jobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            jobs
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = getMyJobs;
