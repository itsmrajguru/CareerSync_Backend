const Job = require('../../../models/JobModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');

/* function to update a job posted  by the company
logic : 1)verify the company first
        2)take the id from the params and serach in the db by passing the jobId to it*/
const updateJob = async (req, res) => {
    try {
        // extract the companyId from req.user.id
        const company = await CompanyProfile.findOne({ user: req.user.id });
        // extract the job created by company and upate it with the data coming from the frontend
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, company: company._id },
            req.body,
            { new: true }
        );

        // if job not found, then return "Job not found"
        if (!job)
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        res.status(200).json({
            success: true,
            job
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = updateJob;
