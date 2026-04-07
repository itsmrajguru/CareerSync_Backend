const express = require('express');
const jobsRouter = express.Router();

const { protect } = require('../../middleware/authMiddleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware/roleMiddleware');
const { createJob, getMyJobs, getJobById, getAllJobs, updateJob, deleteJob } = require('../../controllers/JobControllers/jobController');
const { getJobApplicants } = require('../../controllers/ApplicationControllers/applicationController');

//Job Routes (/api/v1/jobs/)

// public routes — no auth needed
jobsRouter.get('/', getAllJobs);    // students browse all open jobs
jobsRouter.get('/:id', getJobById); // students view a single job detail

// company routes — auth + role required
jobsRouter.post('/', protect, isCompany, createJob);    // company creates a job
jobsRouter.get('/mine', protect, isCompany, getMyJobs);  // company sees their own posted jobs
jobsRouter.put('/:id', protect, isCompany, updateJob);     // company edits their job
jobsRouter.delete('/:id', protect, isCompany, deleteJob); // company deletes their job
jobsRouter.get('/:id/applicants', protect, isCompany, getJobApplicants); // company sees who applied

module.exports = { jobsRouter };
