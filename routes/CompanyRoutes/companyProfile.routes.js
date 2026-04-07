const express=require('express')
const companyProfileRouter=express.Router()

const{getMyCompanyProfile, updateCompanyProfile, getCompanyById } = require('../../controllers/CompanyControllers/companyProfileController')
const { protect } = require('../../middleware/authMiddleware/auth.middleware');
const { isCompany } = require('../../middleware/roleMiddleware/role.middleware');

// Company profile routes(/api/v1/companies/)

// "/me" routes — for the logged-in company fetching their own data
companyProfileRouter.get('/me', protect, isCompany, getMyCompanyProfile);
companyProfileRouter.put('/me', protect, isCompany, updateCompanyProfile);

// "/:id" routes — for admin or user viewing a specific company's profile
companyProfileRouter.get('/:id', protect, getCompanyById);

module.exports={companyProfileRouter}