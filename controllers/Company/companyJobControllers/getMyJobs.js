const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');
const Application = require('../../../models/ApplicationModels/ApplicationModel');

/* function to get the jobs posted by the company
   logic: 1) verify the company first
          2) search for the jobs in the jobmodel using the companyId
          3) calculate the number of applicants for every job in real-time */
const getMyJobs = async (req, res) => {
    try {
        // extract the companyId from req.user.id
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }
        
        // using .lean() to get plain JS objects instead of Mongoose documents
        const rawJobs = await Job.find({ company: company._id }).sort({ createdAt: -1 }).lean();

        /* logic: for every job, we count how many applications exist
           we use Promise.all to do this efficiently */
        const jobs = await Promise.all(rawJobs.map(async (job) => {
            const count = await Application.countDocuments({ job: job._id });
            return {
                ...job,
                applicationsCount: count
            };
        }));

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
