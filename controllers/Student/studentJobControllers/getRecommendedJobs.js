const Job = require('../../../models/JobModel');
const Profile = require('../../../models/StudentProfileModel');
const Application = require('../../../models/ApplicationModel');

/* this function handles fetching and scoring recommended jobs for a student
   based on their profile skills, domain, and location */

/* LOGIC : 
   1) Fetch student profile and their past applications to filter them out.
   2) Fetch all open jobs.
   3) Compute a matching score for each job based on profile overlap.
   4) Return the top scoring jobs. 
*/
const getRecommendedJobs = async (req, res) => {
    try {
        const studentId = req.user.id;

        /* step 1 : get the profile to know what they are looking for */
        const profile = await Profile.findOne({ user: studentId });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        /* step 2 : get jobs they have already applied to, so we don't recommend them again */
        const applications = await Application.find({ student: studentId }).select('job');
        const appliedJobIds = applications.map(app => app.job.toString());

        // step 3 : fetch all open jobs with their company populated
        const openJobs = await Job.find({ status: 'open' }).populate('company', 'name logo location');

        /* filtering out already applied jobs */
        const availableJobs = openJobs.filter(job => !appliedJobIds.includes(job._id.toString()));

        /* step 4 : calculate recommendation scores */
        const profileSkills = profile.skills ? profile.skills.toLowerCase() : '';
        const profileDomain = profile.domain ? profile.domain.toLowerCase() : '';
        const profileField = profile.field ? profile.field.toLowerCase() : '';
        const profileLocation = profile.location ? profile.location.toLowerCase() : '';

        const scoredJobs = availableJobs.map(job => {
            let score = 0;

            const jobTitle = job.title ? job.title.toLowerCase() : '';
            const jobLocation = job.location ? job.location.toLowerCase() : '';
            const jobType = job.jobType ? job.jobType.toLowerCase() : '';

            // check for domain or field match in the title or jobType
            if (profileDomain && (jobTitle.includes(profileDomain) || jobType.includes(profileDomain))) score += 2;
            if (profileField && (jobTitle.includes(profileField) || jobType.includes(profileField))) score += 2;

            // check location match
            if (profileLocation && jobLocation.includes(profileLocation)) score += 2;

            // skill overlaps
            if (job.skills && job.skills.length > 0) {
                job.skills.forEach(skill => {
                    const skillLower = skill.toLowerCase();
                    if (profileSkills.includes(skillLower)) {
                        score += 1;
                    }
                });
            }

            return { ...job.toObject(), matchScore: score };
        });

        /* sort jobs descending by their match score */
        scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

        /* return the top 12 recommended jobs */
        const recommendedJobs = scoredJobs.slice(0, 12);

        res.status(200).json({
            success: true,
            jobs: recommendedJobs
        });

    } catch (e) {
        console.error("Recommendation Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = getRecommendedJobs;
