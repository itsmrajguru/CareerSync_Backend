const Job = require('../../../models/JobModel');

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

module.exports = getJobById;
