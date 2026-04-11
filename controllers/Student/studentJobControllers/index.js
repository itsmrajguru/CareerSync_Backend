const getAllJobs = require('./getAllJobs');
const getJobById = require('./getJobById');
const getJobs = require('./getJobs');
const externalJobController = require('./externalJobController');
const toggleSaveJob = require('./toggleSaveJob');
const getSavedJobs = require('./getSavedJobs');

module.exports = {
    getAllJobs,
    getJobById,
    getJobs,
    externalJobController,
    toggleSaveJob,
    getSavedJobs
};


