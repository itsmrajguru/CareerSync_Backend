const express = require('express');
const companyDiscoveryRouter = express.Router();

const {
    getAllCompanies,
    getCompanyProfileById,
    followCompany,
    unfollowCompany,
    getFollowedCompanies,
    getCompanyJobs
} = require('../../controllers/Company/companyProfileControllers/companyDiscoveryController');

const { protect } = require('../../middleware/authMiddleware');

// student discovery routes
companyDiscoveryRouter.get('/', protect, getAllCompanies);
companyDiscoveryRouter.get('/followed', protect, getFollowedCompanies);
companyDiscoveryRouter.post('/follow', protect, followCompany);
companyDiscoveryRouter.delete('/unfollow', protect, unfollowCompany);
companyDiscoveryRouter.get('/:id', protect, getCompanyProfileById);
companyDiscoveryRouter.get('/:id/jobs', protect, getCompanyJobs);

module.exports = { companyDiscoveryRouter };
