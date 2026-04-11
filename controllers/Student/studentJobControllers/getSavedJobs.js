const Profile = require('../../../models/studentModels/StudentProfileModel');

/* function to fetch the saved jobs and display 
logic :1) fetch the profile of the student 
       2) populate the savedJobs field with the full job, and company details*/
const getSavedJobs = async (req, res) => {
    try {
        /* fetch the profile of the student */
        const profile = await Profile.findOne({ user: req.user.id })
        /* note :we are just populating the fields here, not the exact values */
            .populate({
                path: 'savedJobs',
                populate: {
                    path: 'company',
                    select: 'name location logo industry'
                }
            });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        res.status(200).json({
            success: true,
            savedJobs: profile.savedJobs
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = getSavedJobs;
