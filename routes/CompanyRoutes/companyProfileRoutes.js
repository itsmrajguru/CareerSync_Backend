const express = require('express');
const companyProfileRouter = express.Router();

const {
    getMyCompanyProfile,
    updateCompanyProfile
} = require('../../controllers/Company/companyProfileControllers/companyProfileController');

const {
    getAllCompanies,
    getCompanyProfileById,
    followCompany,
    unfollowCompany,
    getFollowedCompanies,
    getCompanyJobs
} = require('../../controllers/Company/companyProfileControllers/companyDiscoveryController');

const { protect } = require('../../middleware/authMiddleware');
const { isCompany } = require('../../middleware/roleMiddleware');

// me profile routes
companyProfileRouter.get('/me', protect, isCompany, getMyCompanyProfile);
companyProfileRouter.put('/me', protect, isCompany, updateCompanyProfile);

// discovery and follow routes
companyProfileRouter.get('/', protect, getAllCompanies);
companyProfileRouter.get('/followed', protect, getFollowedCompanies);
companyProfileRouter.post('/follow', protect, followCompany);
companyProfileRouter.post('/unfollow', protect, unfollowCompany); // Changed to POST for simpler frontend request handling
companyProfileRouter.get('/:id', protect, getCompanyProfileById);
companyProfileRouter.get('/:id/jobs', protect, getCompanyJobs);

module.exports = { companyProfileRouter };
