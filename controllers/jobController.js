const { searchJobs } = require("../services/adzunaService");

//getJobs Controller
const getJobs = async (req, res) => {
    try {
        //step 1: Lets extract params from frontend
        const query = (req.query.q || "").trim();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const country = req.query.country || "in";
        const max_days_old = parseInt(req.query.days) || 30;
        const sort_by = req.query.sort || "relevance";

        //step 2 :Inject these params into the searchJobs function
        const data = await searchJobs(query, page, limit, country, sort_by, max_days_old)

        return res.status(200).json({
            success: true,
            message: 'Data Fetched Successfully',
            jobs: data.results || [],
            count: data.count || 0
        });

    } catch (e) {
        console.error(`[getJobs] Failed to fetch Jobs, ${e}`)
        return res.status(500).json({
          success: false,
          message: 'Something went wrong! Please try again'
        });
    }
}
module.exports = { getJobs }
