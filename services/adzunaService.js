const axios = require('axios')

//this Function returns jobs using adzuna Job search Service
const searchJobs = async (query, page = 1, limit = 10, country = "in", sort_by = "relevance", max_days_old = 30) => {

    //validate app Id and api Key
    const app_id = process.env.ADZUNA_APP_ID;
    const app_key = process.env.ADZUNA_APP_KEY;

    //if even one of them is not valid, stop the service
    if (!app_id || !app_key) {
        return { results: [], count: 0 };
    }

    //Defining params
    const params = {
        app_id: app_id,
        app_key: app_key,
        results_per_page: limit,
        what: query,
        sort_by: sort_by,
        max_days_old: max_days_old,
        "content-type": "application/json"
    }

    //Defining Adzuna Service url EndPoint
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;

    try {
        /* take response from the url and pass the params 
        automatically in the adzunaUrl */

        const response = await axios.get(adzunaUrl, { params })

        if (response.status === 200) {
            return response.data
        }
    } catch (error) {
        console.debug(`[Adzuna] Search failed: ${error.message}`);
        if (error.response) {
            console.debug(`[Adzuna] Status: ${error.response.status}`);
        }
    }
    return {results:[],count:0}
}
module.exports={searchJobs}
