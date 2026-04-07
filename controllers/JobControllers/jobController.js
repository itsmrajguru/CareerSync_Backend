const Job = require('../../models/JobModels/Job');
const CompanyProfile = require('../../models/companyModels/CompanyProfile');

// lets create a function for the company to craete jobs
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

/* this function is created to get posted jobs by the company */
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

/* this function is created to update a posted jobs by the company */
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

/* this function is created to delete  a posted jobs by the company */
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

const getAllJobs = async (req, res) => {
    try {
        // extract the jobs directly from all companies with status open 
        const jobs = await Job.find({ status: 'open' }).populate('company', 'name logo location').sort({ createdAt: -1 });
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
}

module.exports = { createJob, getMyJobs, updateJob, deleteJob, getAllJobs };
