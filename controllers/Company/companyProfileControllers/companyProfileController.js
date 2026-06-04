const CompanyProfile = require('../../../models/CompanyProfileModel');

/* lets create a function for the company to return their own profile 
   for this, frontend axios calls /api/v1/companies/me
   and me is hardcoded which backedn  fetches  from the authMiddleware
   that provides the id */

const getMyCompanyProfile = async (req, res) => {
    try {
        /* use findOneAndUpdate with upsert so that if the company has
        never filled their profile before, we auto-create an empty document
        for them — this way they always appear in the Explore Companies list */
        const company = await CompanyProfile.findOneAndUpdate(
            { user: req.user.id },
            { $setOnInsert: { user: req.user.id } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
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

/* lets create a function for the company to update their own profile —
   upsert: true ensures a new document is created if it does not exist yet,
   so the company always shows up in the Explore Companies section */
const updateCompanyProfile = async (req, res) => {
    try {
        /* extract the company userId to update their profile
        upsert:true creates the document if it doesn't exist */
        const company = await CompanyProfile.findOneAndUpdate(
            { user: req.user.id },
            { ...req.body, user: req.user.id },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
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
