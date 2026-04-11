const Application = require('../../../models/ApplicationModels/ApplicationModel');

// This function is made for the student to fetch his all applictaions
const getMyApplications = async (req, res) => {
    try {
        //this fetches all applications submitted by the logged-in student
        /* If the user wants a single application then pass the applicationId to the 
        model and serach in the model */
        const applications = await Application.find({ student: req.user.id })
            .populate('job', 'title location jobType status')
            .populate('company', 'name location')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            applications
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = getMyApplications;
