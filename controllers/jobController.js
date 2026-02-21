const { searchJobs } = require('../services/adzunaService');

// GET /api/jobs/
const getJobs = async (req, res) => {
    const query = (req.query.q || "").trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const country = req.query.country || "in";
    const max_days_old = parseInt(req.query.days) || 30;
    const sort_by = req.query.sort || "relevance";

    const data = await searchJobs(query, page, limit, country, sort_by, max_days_old);

    res.json({
        jobs: data.results || [],
        count: data.count || 0
    });
};

module.exports = { getJobs };
