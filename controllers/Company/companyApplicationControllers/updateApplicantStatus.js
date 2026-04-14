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
            let text = '';
            if (status === 'shortlisted') {
                subject = `You've been shortlisted for ${application.job.title}!`;
                text = `Hi ${application.student.username}! We are glad to inform you that your application for the ${application.job.title} role at ${company.name || 'our company'} has been shortlisted.`;
            } else if (status === 'rejected') {
                subject = `Update on your application for ${application.job.title}`;
                text = `Hi ${application.student.username}, thank you for applying for the ${application.job.title} role at ${company.name || 'our company'}. Unfortunately, we will not be moving forward with your application at this time.`;
            } else if (status === 'hired') {
                subject = `Congratulations! You're hired for ${application.job.title}!`;
                text = `Hi ${application.student.username}, congratulations! You have been selected for the ${application.job.title} role at ${company.name || 'our company'}. The team will reach out with next steps.`;
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
                        text
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
