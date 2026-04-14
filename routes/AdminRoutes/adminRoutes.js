const express = require('express');
const router = express.Router();
const { 
    getPlatformStats, 
    getAllCompanies, 
    verifyCompany, 
    getAllJobsAdmin 
} = require('../../controllers/Admin/adminController');

const { protect } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

/* admin routes...
all routes are protected and restricted to admin role only */

// get platform overview stats
router.get('/stats', protect, isAdmin, getPlatformStats);

// company management
router.get('/companies', protect, isAdmin, getAllCompanies);
router.patch('/companies/:id/verify', protect, isAdmin, verifyCompany);

// job management
router.get('/jobs', protect, isAdmin, getAllJobsAdmin);

module.exports = { adminRouter: router };
