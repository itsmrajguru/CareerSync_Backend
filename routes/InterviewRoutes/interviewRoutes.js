const express = require('express');
const interviewRouter = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware');

const { scheduleInterview, cancelInterview, getInterviewsForJob, getCompanyInterviews } = require('../../controllers/Company/companyInterviewControllers');
const { getMyInterviews } = require('../../controllers/Student/studentInterviewControllers');

// Interview Routes (/api/v1/interviews/)

// Company routes
interviewRouter.post('/:applicationId/schedule', protect, isCompany, scheduleInterview); //called by the company to schedule an interview
interviewRouter.patch('/:interviewId/cancel', protect, isCompany, cancelInterview); //called by the company to cancel an interview
interviewRouter.get('/job/:jobId', protect, isCompany, getInterviewsForJob); //called by the company to see scheduled interviews for a specific job
interviewRouter.get('/company/all', protect, isCompany, getCompanyInterviews); //called by the company to see all their scheduled interviews

// Student routes
interviewRouter.get('/mine', protect, getMyInterviews); //called by the student to view all their scheduled interviews

module.exports = { interviewRouter };;