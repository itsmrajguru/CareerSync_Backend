const express=require('express')
const jobsRouter=express.Router()

const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');


jobsRouter.get('/jobs/', protect, jobController.getJobs);

module.exports={authRouter}