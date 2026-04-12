const Job = require('../../../models/JobModels/JobModel');

/* function for the student to get the jobs posted  by the company
logic : 1)take the query set by the filter panel , coming from req.query
        2)and search with the queries in the job model*/
const getAllJobs = async (req, res) => {
    try {
        const { search, location, jobType, industry, page = 1, limit = 12 } = req.query;
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

        /* step 2: extract all matching jobs first
           this is slightly inefficient for very large datasets but necessary
           to filter by company industry since it's a separate model */
        let jobs = await Job.find(query)
            .populate({
                path: 'company',
                select: 'name location industry logo'
            })
            .sort({ createdAt: -1 });

        // filter out jobs where company didn't match the industry filter (if provided)
        if (industry) {
            jobs = jobs.filter(job => 
                job.company && 
                job.company.industry && 
                job.company.industry.toLowerCase().includes(industry.toLowerCase())
            );
        }

        // step 3: implement manual pagination logic
        const totalJobs = jobs.length;
        const totalPages = Math.ceil(totalJobs / limit);
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedJobs = jobs.slice(startIndex, startIndex + parseInt(limit));

        res.status(200).json({
            success: true,
            totalJobs,
            totalPages,
            currentPage: parseInt(page),
            jobs: paginatedJobs
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = getAllJobs;
