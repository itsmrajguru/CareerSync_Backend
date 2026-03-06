const axios = require('axios');

const searchJobs = async (query, page = 1, limit = 10, country = "in", sort_by = "relevance", max_days_old = 30) => {
    const app_id = process.env.ADZUNA_APP_ID;
    const app_key = process.env.ADZUNA_APP_KEY;

    if (!app_id || !app_key) {
        return { results: [], count: 0 };
    }

    // Adzuna endpoint structure: /api/jobs/{country}/search/{page}
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;

    const params = {
        app_id: app_id,
        app_key: app_key,
        results_per_page: limit,
        what: query,
        sort_by: sort_by,
        max_days_old: max_days_old,
        "content-type": "application/json"
    };

    try {
        const response = await axios.get(url, { params });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.debug(`[Adzuna] Search failed: ${error.message}`);
        if (error.response) {
            console.debug(`[Adzuna] Status: ${error.response.status}`);
        }
    }

    return { results: [], count: 0 };
};

module.exports = { searchJobs };
