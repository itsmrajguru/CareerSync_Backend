const express=require('express')
const jobsRouter=express.Router()

//importing middleware
const { protect } = require('../../middleware/authMiddleware');

//importing controller
const jobController = require('../../controllers/jobController');

jobsRouter.get('/jobs/', protect, jobController.getJobs);

module.exports={jobsRouter}