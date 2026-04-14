const CompanyProfile = require('../../../models/CompanyProfileModel');

/* lets create a function for the company to return their own profile 
   for this, frontend axios calls /api/v1/companies/me
   and me is hardcoded which backedn  fetches  from the authMiddleware
   that provides the id */

const getMyCompanyProfile = async (req, res) => {
    try {
        // extract the company userId to get their profile
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company)
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        res.status(200).json({
            success: true,
            company
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

// lets create a function for the company to update their own profile 
const updateCompanyProfile = async (req, res) => {
    try {
        // extract the company userId to update their profile
        const company = await CompanyProfile.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            company
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

/* lets create a function for the admins and users to get(view) profile of any company 
    In this case, the frontend is calling the GET /api/v1/companies/64abc123 
    where the 64abc123 is coming from the jobDetails that stores populated company details*/
const getCompanyById = async (req, res) => {
    try {
        // extract the company userId to update their profile
        const company = await CompanyProfile.findById(req.params.id);
        if (!company) return res.status(404).json({
            success: false,
            message: 'Company not found'
        });
        res.status(200).json({
            success: true,
            company
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = { getMyCompanyProfile, updateCompanyProfile, getCompanyById };
