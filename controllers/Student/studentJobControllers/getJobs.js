const Job = require('../../../models/JobModel');

/* function for the student to get the jobs posted  by the company
logic : 1)take the query set by the filter panel , coming from req.query
        2)and search with the queries in the job model*/
const getJobs = async (req, res) => {
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

module.exports = getJobs;
