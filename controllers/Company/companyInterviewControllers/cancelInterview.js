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
        const html = `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff7ed;border-radius:16px;">
                <h2 style="color:#c2410c;margin-bottom:8px;">&#128683; Interview Cancelled</h2>
                <p style="color:#444;font-size:15px;">
                    Hi <strong>${interview.student.username}</strong>, we regret to inform you that your interview for the
                    <strong>${interview.job.title}</strong> role at <strong>${company.name || 'our company'}</strong> has been cancelled.
                </p>
                <div style="background:#fff;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:16px 0;">
                    <p style="margin:6px 0;color:#444;">&#128336; <strong>Was scheduled for:</strong> ${new Date(interview.scheduledAt).toLocaleString()}</p>
                </div>
                <p style="color:#444;font-size:15px;">The hiring team may reach out to reschedule. Keep an eye on your applications.</p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/applications"
                   style="display:inline-block;margin:20px 0;padding:14px 28px;background:#c2410c;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                    View My Applications
                </a>
                <p style="color:#888;font-size:12px;">If you did not apply for this role, you can safely ignore this email.</p>
            </div>`;

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
                    text,
                    html
                });
            } catch (e) {
                console.log("Email sending error:", e);
            }
        }, 0);

        /* step 3 : reset the application's ipStatus so the company can
           trigger a fresh AI interview after rescheduling */
        const Application = require('../../../models/ApplicationModel');
        await Application.findByIdAndUpdate(interview.application, {
            ipStatus:   'none',
            status:     'shortlisted'
        });

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
