const express=require('express')
const externalJobsRouter=express.Router()

//importing middleware
const { protect } = require('../../middleware/authMiddleware');

//importing controller
const { getJobs } = require('../../controllers/JobControllers/externalJobController');

//external jobs routes (Adzuna API)
externalJobsRouter.get('/', protect, getJobs);

module.exports={externalJobsRouter}