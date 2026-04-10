const express = require('express');
const applicationRouter = express.Router();

const { protect } = require('../../middleware/authMiddleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware/roleMiddleware');
const { getJobApplicants, updateApplicantStatus, applyToJob, getMyApplications, getCompanyStats, getApplicationDetails } = require('../../controllers/ApplicationControllers/applicationController');

//Application Routes (/api/v1/applications/)

// Static routes 
applicationRouter.get('/mine', protect, getMyApplications);  // student sees all their applications
applicationRouter.get('/company-stats', protect, isCompany, getCompanyStats);  // company dashboard: recent applicants + pipeline counts

// Dynamic routes
applicationRouter.post('/:jobId', protect, applyToJob); //called by the applyPage...(student) applies to a job
applicationRouter.get('/:id/detail', protect, isCompany, getApplicationDetails); // company views specific application
applicationRouter.patch('/:id/status', protect, isCompany, updateApplicantStatus);  // company updates one application status

module.exports = { applicationRouter };
