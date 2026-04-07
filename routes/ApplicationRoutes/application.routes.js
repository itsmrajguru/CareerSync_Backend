const express = require('express');
const applicationRouter = express.Router();


const { protect } = require('../../middleware/authMiddleware/auth.middleware');
const { isCompany } = require('../../middleware/roleMiddleware/role.middleware');
const { getJobApplicants, updateApplicantStatus, applyToJob, getMyApplications } = require('../../controllers/ApplicationControllers/applicationController');

//Application Routes

applicationRouter.post('/:jobId', protect, applyToJob);      // student applies to a job
applicationRouter.get('/mine', protect, getMyApplications);  // student sees all their applications
applicationRouter.patch('/:id/status', protect, isCompany, updateApplicantStatus); // company updates one application status

module.exports = { applicationRouter };
