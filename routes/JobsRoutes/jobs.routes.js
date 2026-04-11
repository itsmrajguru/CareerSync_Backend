const express = require('express');
const jobsRouter = express.Router();

const { protect } = require('../../middleware/authMiddleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware/roleMiddleware');
const { getAllJobs, getJobById, toggleSaveJob, getSavedJobs } = require('../../controllers/Student/studentJobControllers');

const { createJob, getMyJobs, updateJob, deleteJob, getJobApplicants } = require('../../controllers/Company/companyJobControllers');


//Job Routes (/api/v1/jobs/)

// public routes — no auth needed
jobsRouter.get('/', getAllJobs);  // called by JobsPage... (students) browse all open jobs

// company routes — static paths first
jobsRouter.post('/', protect, isCompany, createJob);                       // company creates a job
jobsRouter.get('/mine', protect, isCompany, getMyJobs);                    // company sees their own posted jobs

// dynamic /:id routes — must come AFTER all static routes
jobsRouter.get('/:id', getJobById);  // called by JobDetails Page...(students) view a single job detail
jobsRouter.post('/:jobId/save', protect, toggleSaveJob); //called by the jobsPage...(student) saves/unsaves a job
jobsRouter.get('/saved/all', protect, getSavedJobs);                        // student gets all saved jobs
jobsRouter.put('/:id', protect, isCompany, updateJob);                     // company edits their job

jobsRouter.delete('/:id', protect, isCompany, deleteJob);                  // company deletes their job
jobsRouter.get('/:id/applicants', protect, isCompany, getJobApplicants);   // company sees who applied

module.exports = { jobsRouter };
