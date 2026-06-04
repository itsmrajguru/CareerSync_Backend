const CompanyProfile = require('../../../models/CompanyProfileModel');
const CompanyFollower = require('../../../models/CompanyFollowersModel');
const Job = require('../../../models/JobModel');

// get all companies with search and filters
const getAllCompanies = async (req, res) => {
    try {
        const { search, industry, location, companySize, hiringStatus } = req.query;
        let query = {};

        // search by name, industry, or location
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { industry: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        // exact filters
        if (industry) {
            query.industry = { $regex: industry, $options: 'i' };
        }
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // employee count size ranges
        if (companySize) {
            if (companySize === '1-50') {
                query.employeesCount = { $gte: 1, $lte: 50 };
            } else if (companySize === '51-200') {
                query.employeesCount = { $gte: 51, $lte: 200 };
            } else if (companySize === '201-1000') {
                query.employeesCount = { $gte: 201, $lte: 1000 };
            } else if (companySize === '1000+') {
                query.employeesCount = { $gte: 1000 };
            }
        }

        // hiring status filter
        if (hiringStatus) {
            const hiringCompanies = await Job.distinct('company', {
                status: 'open',
                $or: [
                    { deadline: { $gt: new Date() } },
                    { deadline: null }
                ]
            });

            if (hiringStatus === 'hiring') {
                query._id = { $in: hiringCompanies };
            } else if (hiringStatus === 'not-hiring') {
                query._id = { $nin: hiringCompanies };
            }
        }

        const companies = await CompanyProfile.find(query);

        // add open jobs count and follow status for student
        const result = await Promise.all(companies.map(async (c) => {
            const openJobsCount = await Job.countDocuments({
                company: c._id,
                status: 'open',
                $or: [
                    { deadline: { $gt: new Date() } },
                    { deadline: null }
                ]
            });

            let isFollowing = false;
            if (req.user) {
                const follow = await CompanyFollower.findOne({ studentId: req.user.id, companyId: c._id });
                if (follow) isFollowing = true;
            }

            return {
                ...c.toObject(),
                openJobsCount,
                isFollowing
            };
        }));

        res.status(200).json({
            success: true,
            companies: result
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// get single company profile details
const getCompanyProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await CompanyProfile.findById(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // increase profile views
        company.views = (company.views || 0) + 1;
        await company.save();

        // count open jobs
        const openJobsCount = await Job.countDocuments({
            company: company._id,
            status: 'open',
            $or: [
                { deadline: { $gt: new Date() } },
                { deadline: null }
            ]
        });

        // check if current student follows this company
        let isFollowing = false;
        if (req.user) {
            const follow = await CompanyFollower.findOne({ studentId: req.user.id, companyId: company._id });
            if (follow) isFollowing = true;
        }

        res.status(200).json({
            success: true,
            company: {
                ...company.toObject(),
                openJobsCount,
                isFollowing
            }
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// follow a company
const followCompany = async (req, res) => {
    try {
        const { companyId } = req.body;
        const studentId = req.user.id;

        const company = await CompanyProfile.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const existing = await CompanyFollower.findOne({ studentId, companyId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already following this company'
            });
        }

        await CompanyFollower.create({ studentId, companyId });

        // update cache count
        company.followersCount = (company.followersCount || 0) + 1;
        await company.save();

        res.status(200).json({
            success: true,
            message: 'Successfully followed company'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// unfollow a company
const unfollowCompany = async (req, res) => {
    try {
        const { companyId } = req.body;
        const studentId = req.user.id;

        const company = await CompanyProfile.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const follow = await CompanyFollower.findOneAndDelete({ studentId, companyId });
        if (!follow) {
            return res.status(400).json({
                success: false,
                message: 'Not following this company'
            });
        }

        // update cache count
        company.followersCount = Math.max(0, (company.followersCount || 0) - 1);
        await company.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unfollowed company'
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// get all followed companies
const getFollowedCompanies = async (req, res) => {
    try {
        const studentId = req.user.id;
        const follows = await CompanyFollower.find({ studentId }).populate('companyId');
        
        const companies = follows
            .filter(f => f.companyId !== null)
            .map(f => f.companyId);

        res.status(200).json({
            success: true,
            companies
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// get jobs posted by specific company
const getCompanyJobs = async (req, res) => {
    try {
        const { id } = req.params;
        const jobs = await Job.find({ company: id, status: 'open' });
        
        res.status(200).json({
            success: true,
            jobs
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = {
    getAllCompanies,
    getCompanyProfileById,
    followCompany,
    unfollowCompany,
    getFollowedCompanies,
    getCompanyJobs
};
