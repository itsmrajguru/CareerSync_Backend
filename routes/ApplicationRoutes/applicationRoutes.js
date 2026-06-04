const express = require('express');
const applicationRouter = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware');
const { applyToJob, getMyApplications } = require('../../controllers/Student/studentApplicationControllers');
const { updateApplicantStatus, getCompanyStats, getApplicationDetails, getApplicationsByStatus, toggleSaveApplicant } = require('../../controllers/Company/companyApplicationControllers');

//Application Routes (/api/v1/applications/)

// Static routes 
applicationRouter.get('/mine', protect, getMyApplications); //called by the myApplications page...(student) sees all their applications
applicationRouter.get('/company-stats', protect, isCompany, getCompanyStats);             // company dashboard: recent applicants + pipeline counts

// Dynamic routes
applicationRouter.get('/company/status/:status', protect, isCompany, getApplicationsByStatus); // get all applications for company by status
applicationRouter.post('/:jobId', protect, applyToJob); //called by the applyPage...(student) applies to a job
applicationRouter.get('/:id/detail', protect, isCompany, getApplicationDetails); //called by the application deatails page...(Company) views specific application
applicationRouter.patch('/:id/status', protect, isCompany, updateApplicantStatus); //called by the application deatails page... company updates status in the application
applicationRouter.patch('/:id/save', protect, isCompany, toggleSaveApplicant); //called by company to toggle save an applicant

module.exports = { applicationRouter };;
