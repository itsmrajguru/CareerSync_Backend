const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');

/* function to create a job by the company
logic : 1)verify the company first
        2)bind the req.body to the job.create*/
        
const createJob = async (req, res) => {
    try {
        /* step 1 :before adding a incoming job to a specific company ,
        check whether the company exits or not ? */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found"
            });
        }
        // Step 2 :bind the incoming job details to the specific company
        const job = await Job.create({
            company: company._id,
            ...req.body
        });
        res.status(201).json({
            success: true,
            job
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = createJob;
