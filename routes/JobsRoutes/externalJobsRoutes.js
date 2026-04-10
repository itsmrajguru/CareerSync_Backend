const express = require('express')
const externalJobsRouter = express.Router()

const { protect } = require('../../middleware/authMiddleware/authMiddleware');
const { getJobs } = require('../../controllers/JobControllers/externalJobController');

//external jobs routes (/api/v1/external-jobs/) [Adzuna API]
externalJobsRouter.get('/', protect, getJobs);  //called by externalJobs Page

module.exports = { externalJobsRouter }