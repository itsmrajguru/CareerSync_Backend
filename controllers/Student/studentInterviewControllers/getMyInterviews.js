const Interview = require('../../../models/InterviewModel');

// This function is made for the student to fetch his all scheduled interviews
const getMyInterviews = async (req, res) => {
    try {
        //this fetches all interviews scheduled for the logged-in student
        /* If the user wants a single interview we could pass the id but here
        we are fetching all the interviews and sorting them by date */
        const interviews = await Interview.find({ student: req.user.id })
            .populate('job', 'title location jobType')
            .populate('company', 'name location')
            .sort({ scheduledAt: 1 });

        res.status(200).json({
            success: true,
            interviews
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = getMyInterviews;;
