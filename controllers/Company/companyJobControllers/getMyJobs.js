const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');
const Application = require('../../../models/ApplicationModels/ApplicationModel');

/* function to show the jobs for the company,posted by the company
logic:    1) get the company Id to fetch the jobs accodingly
          2) serach the jobs in the jobModel on the basis of
             the company and sort it 
          3) Calulate number of aplplicants for every indivisual job  */
const getMyJobs = async (req, res) => {
    try {
        /* step 1 :get the company first so that we could show the
        jobs of that company only */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        
        /* step 2 : get the jobs depending upon the company*/
        const rawJobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
        
        /* step 3 :get the applicants of the job...*/
        const jobs = await Promise.all(rawJobs.map(async (job) => {
            const count = await Application.countDocuments({ job: job._id });
            return {
                ...job._doc,
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
