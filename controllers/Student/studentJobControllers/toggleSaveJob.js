// const Profile = require('../../../models/studentModels/StudentProfileModel');

const Profile = require('../../../models/studentModels/StudentProfileModel');

/* function for save and unsave a job to show in the saved jobs
Logic :1) get the jobId from params
       2) verify the user in the db
       3) find the studentProfile and save the job to it,
       if already present in the db , remove it */
       
const toggleSaveJob = async (req, res) => {
    try {
        /* step 1 :Extract the jobId from req.params*/
        const { jobId } = req.params;
        const profile = await Profile.findOne({ user: req.user.id });

        /* step 2: Verify the user in the db */
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }
        /* step 3 : before Storing the JobId in the savedjobs fields of the db,
        check , does the job already exists in the db or not, if yes remove it 
        and if not add it ? */
        const isSaved = profile.savedJobs.includes(jobId);
        if (isSaved) {
            // remove from savedJobs
            profile.savedJobs = profile.savedJobs.filter(id => id.toString() !== jobId);
        } else {
            // add to savedJobs
            profile.savedJobs.push(jobId);
        }
        await profile.save();
        res.status(200).json({
            success: true,
            message: isSaved ? "Job removed from saved" : "Job saved successfully",
            isSaved: !isSaved
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = toggleSaveJob;
