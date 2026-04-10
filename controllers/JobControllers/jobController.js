const Job = require('../../models/JobModels/JobModel');
const CompanyProfile = require('../../models/companyModels/CompanyProfileModel');

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

/* function for the student to get the jobs posted  by the company
logic : 1)take the query set by the filter panel , coming from req.query
        2)and search with the queries in the job model*/
const getAllJobs = async (req, res) => {
    try {
        const { search, location, jobType, industry } = req.query;
        let query = { status: 'open' };

        // step 1: build the query object based on the filters provided by the user
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        if (jobType) {
            query.jobType = jobType;
        }

        // if industry is provided, we need to filter by company's industry
        let companyQuery = {};
        if (industry) {
            companyQuery.industry = { $regex: industry, $options: 'i' };
        }

        // step 2: extract the jobs directly from all companies that match the filter
        let jobs = await Job.find(query)
            .populate({
                path: 'company',
                match: companyQuery,
                select: 'name location industry logo'
            })
            .sort({ createdAt: -1 });

        // filter out jobs where company didn't match the industry filter (if provided)
        if (industry) {
            jobs = jobs.filter(job => job.company !== null);
        }

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

/* function for the student to get the a single job posted  by the company
logic : 1)take the jobID from req.params.id and pass it to search in the job model
        2)and search with the queries in the job model*/
const getJobById = async (req, res) => {
    try {
        // search the job by its mongodb _id from the url params
        const job = await Job.findById(req.params.id).populate('company', 'name location industry');

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

module.exports = { createJob, getMyJobs, getJobById, updateJob, deleteJob, getAllJobs };
