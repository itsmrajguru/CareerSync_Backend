const User = require('../../models/AuthModels/UserModel');
const Company = require('../../models/companyModels/CompanyProfileModel');
const Job = require('../../models/JobModels/JobModel');
const Application = require('../../models/ApplicationModels/ApplicationModel');

/* function to get all platform statistics for admin dashboard
logic: 1) count total students, companies, and jobs
       2) count total applications submitted
       3) return the numbers to the frontend */
const getPlatformStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const companyCount = await Company.countDocuments();
        const jobCount = await Job.countDocuments();
        const applicationCount = await Application.countDocuments();

        res.status(200).json({
            success: true,
            stats: {
                students: studentCount,
                companies: companyCount,
                jobs: jobCount,
                applications: applicationCount
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

/* function to get all registered companies for moderation
logic: 1) fetch all companies and populate user data
       2) sort by creation date (newest first) */
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find()
            .populate('user', 'username email date_joined')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            companies
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

/* function to verify or unverify a company
logic: 1) take companyId from params
       2) take isVerified status from body
       3) update the company record in database */
const verifyCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        const company = await Company.findByIdAndUpdate(
            id,
            { isVerified },
            { new: true }
        );

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(200).json({
            success: true,
            message: `Company ${isVerified ? 'verified' : 'unverified'} successfully`,
            company
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

/* function to get all jobs posted on the platform
logic: 1) fetch all jobs and populate company info
       2) allow admin to see everything for moderation purposes */
const getAllJobsAdmin = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('company', 'name location isVerified')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            jobs
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = {
    getPlatformStats,
    getAllCompanies,
    verifyCompany,
    getAllJobsAdmin
};
