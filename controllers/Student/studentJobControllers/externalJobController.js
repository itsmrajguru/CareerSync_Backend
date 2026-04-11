const { searchJobs } = require('../../../services/adzunaService');

/* function to fetch jobs from adzuna external api
logic: 1) extract query, page, and limit from req.query
       2) call the adzuna service and return results */
const getJobs = async (req, res) => {
    try {
        const { q, page, limit } = req.query;
        const data = await searchJobs(q, page, limit);
        
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = { getJobs };
