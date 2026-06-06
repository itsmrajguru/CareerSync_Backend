const Application = require('../../../models/ApplicationModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');
const { sendEmail } = require('../../../services/emailService');

/* This function is written for updatinng the ApplicantStatus
   for a student applying to it */
const updateApplicantStatus = async (req, res) => {
    try {
        /* extract the status set by the company for a application  
        and the applicationId for which we have to update teh status */

        const { status } = req.body;
        const applicationId = req.params.id;

        /* extract company details */
        const company = await CompanyProfile.findOne({ user: req.user.id });

        /* finding and updating the application with the status
            selected by the company */
        const application = await Application.findOneAndUpdate(
            { _id: applicationId, company: company._id },
            { status },
            { new: true }
        ).populate('student', 'email username').populate('job', 'title');
        /* populates done for seding email to the applicant student */

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found or unauthorized"
            });
        }
        /* creating content to send in the email depending upon the status 
            selected by the company */
        if (['shortlisted', 'rejected', 'hired'].includes(status)) {
            let subject = '';
            let text    = '';
            let html    = '';

            if (status === 'shortlisted') {
                subject = `You've been shortlisted for ${application.job.title}!`;
                text    = `Hi ${application.student.username}! We are glad to inform you that your application for the ${application.job.title} role at ${company.name || 'our company'} has been shortlisted.`;
                html = `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f0fbfe;border-radius:16px;">
                        <h2 style="color:#0179a0;margin-bottom:8px;">&#127881; You've been Shortlisted!</h2>
                        <p style="color:#444;font-size:15px;">
                            Hi <strong>${application.student.username}</strong>, great news! Your application for the
                            <strong>${application.job.title}</strong> role at <strong>${company.name || 'our company'}</strong>
                            has been shortlisted. The hiring team will be in touch with next steps.
                        </p>
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/applications"
                           style="display:inline-block;margin:20px 0;padding:14px 28px;background:#0179a0;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                            View My Applications
                        </a>
                        <p style="color:#888;font-size:12px;">If you did not apply for this role, you can safely ignore this email.</p>
                    </div>`;

            } else if (status === 'rejected') {
                subject = `Update on your application for ${application.job.title}`;
                text    = `Hi ${application.student.username}, thank you for applying for the ${application.job.title} role at ${company.name || 'our company'}. Unfortunately, we will not be moving forward with your application at this time.`;
                html = `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff5f5;border-radius:16px;">
                        <h2 style="color:#b91c1c;margin-bottom:8px;">Application Update</h2>
                        <p style="color:#444;font-size:15px;">
                            Hi <strong>${application.student.username}</strong>, thank you for your interest in the
                            <strong>${application.job.title}</strong> role at <strong>${company.name || 'our company'}</strong>.
                            After careful consideration, we will not be moving forward with your application at this time.
                        </p>
                        <p style="color:#444;font-size:15px;">We encourage you to keep applying — the right opportunity is out there for you!</p>
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/applications"
                           style="display:inline-block;margin:20px 0;padding:14px 28px;background:#b91c1c;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                            Explore More Jobs
                        </a>
                        <p style="color:#888;font-size:12px;">If you did not apply for this role, you can safely ignore this email.</p>
                    </div>`;

            } else if (status === 'hired') {
                subject = `Congratulations! You're hired for ${application.job.title}!`;
                text    = `Hi ${application.student.username}, congratulations! You have been selected for the ${application.job.title} role at ${company.name || 'our company'}. The team will reach out with next steps.`;
                html = `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f0fdf4;border-radius:16px;">
                        <h2 style="color:#15803d;margin-bottom:8px;">&#127881; Congratulations — You're Hired!</h2>
                        <p style="color:#444;font-size:15px;">
                            Hi <strong>${application.student.username}</strong>, we are thrilled to inform you that you have been
                            selected for the <strong>${application.job.title}</strong> role at
                            <strong>${company.name || 'our company'}</strong>!
                        </p>
                        <p style="color:#444;font-size:15px;">The team will reach out shortly with onboarding details and next steps. Welcome aboard! &#128640;</p>
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/applications"
                           style="display:inline-block;margin:20px 0;padding:14px 28px;background:#15803d;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                            View My Applications
                        </a>
                        <p style="color:#888;font-size:12px;">If you did not apply for this role, you can safely ignore this email.</p>
                    </div>`;
            }

            // Trigger in-app Notification to the student (application.student._id = UserModel._id)
            const { createNotification } = require('../../../utils/notificationHelper');
            createNotification({
                recipient: application.student._id,  // User._id of the student
                sender: req.user.id,                 // User._id of the company user
                type: 'application_update',
                title: subject,
                message: text,
                link: '/student/applications'
            });

            /* send email to the user on their registered email Id using resend */
            setTimeout(async () => {
                try {
                    await sendEmail({
                        to: application.student.email,
                        subject,
                        text,
                        html
                    });
                } catch (e) {
                    console.log("Email sending error:", e);
                }
            }, 0);
        }
        res.status(200).json({
            success: true,
            application
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = updateApplicantStatus;
