const Job = require('../../../models/JobModels/JobModel');
const CompanyProfile = require('../../../models/companyModels/CompanyProfileModel');

/* function to delete a job posted  by the company
logic : 1)verify the company first
        2)take the id from the params and serach in the db and just delete the job*/
const deleteJob = async (req, res) => {
    try {
        // extract the companyId from req.user.id
        const company = await CompanyProfile.findOne({ user: req.user.id });
        // extract the job created by company and delete it
        const job = await Job.findOneAndDelete({ _id: req.params.id, company: company._id });

        // if job not found, then return "Job not found"
        if (!job)
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        res.status(200).json({
            success: true,
            message: 'Job deleted'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = deleteJob;
