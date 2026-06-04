const Interview = require('../../../models/InterviewModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');
const { sendEmail } = require('../../../services/emailService');
const { createNotification } = require('../../../utils/notificationHelper');

/* function to cancel an interview scheduled by the company
logic : 1)verify the company first
        2)find the interview and update status to cancelled
        3)notify the student accodingly */

const cancelInterview = async (req, res) => {
    try {
        // extract the interviewId from req.params
        const interviewId = req.params.interviewId;

        /* step 1 :before cancelling an interview,
        check whether the company exits or not ? */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        /* finding and updating the interview with the cancelled status */
        const interview = await Interview.findOneAndUpdate(
            { _id: interviewId, company: company._id },
            { status: 'cancelled' },
            { new: true }
        ).populate('student', 'email username').populate('job', 'title');
        /* populates done for seding email to the applicant student */

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        /* creating content to send in the email depending upon the cancellation */
        const subject = `Interview cancelled for ${interview.job.title}`;
        const text = `Hi ${interview.student.username}, your interview for the ${interview.job.title} role at ${company.name || 'our company'} scheduled on ${new Date(interview.scheduledAt).toLocaleString()} has been cancelled.`;

        // Trigger Notification to student
        createNotification({
            recipient: interview.student._id,
            sender: req.user.id,
            type: 'system',
            title: subject,
            message: text,
            link: '/student/applications'
        });

        /* send email to the user on their registered email Id using resend */
        setTimeout(async () => {
            try {
                await sendEmail({
                    to: interview.student.email,
                    subject,
                    text
                });
            } catch (e) {
                console.log("Email sending error:", e);
            }
        }, 0);

        res.status(200).json({
            success: true,
            interview
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = cancelInterview;;
