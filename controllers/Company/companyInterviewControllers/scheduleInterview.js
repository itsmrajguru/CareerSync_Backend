const Interview = require('../../../models/InterviewModel');
const Application = require('../../../models/ApplicationModel');
const CompanyProfile = require('../../../models/CompanyProfileModel');
const { sendEmail } = require('../../../services/emailService');
const { createNotification } = require('../../../utils/notificationHelper');

/* function to schedule an interview by the company
logic : 1)verify the company first
        2)find the application and check if it is shortlisted
        3)create an entry in the InterviewModel and notify student */

const scheduleInterview = async (req, res) => {
    try {
        /* extract the applicationId from the req.params 
        and the interview details from req.body */
        const applicationId = req.params.applicationId;
        const { scheduledAt, mode, location, message } = req.body;

        /* step 1 :before scheduling an interview,
        check whether the company exits or not ? */
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        /* step 2 : get the application by searching with applicationId in the model
        and ensuring the status is shortlisted */
        const application = await Application.findOne({
            _id: applicationId,
            company: company._id,
            status: 'shortlisted'
        }).populate('student', 'email username').populate('job', 'title');
        /* populates done for seding email to the applicant student */

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or not shortlisted'
            });
        }

        // Step 3 :create a NewEntry in the InterviewModel
        const interview = await Interview.create({
            application: application._id,
            job: application.job._id,
            student: application.student._id,
            company: company._id,
            scheduledAt,
            mode,
            location,
            message: message || ''
        });

        /* creating content to send in the email and notification */
        const subject = `Interview scheduled for ${application.job.title}`;
        const text = `Hi ${application.student.username}, your interview for the ${application.job.title} role at ${company.name || 'our company'} is scheduled on ${new Date(scheduledAt).toLocaleString()} via ${mode}. Location/Link: ${location}`;

        // Trigger Notification to student
        createNotification({
            recipient: application.student._id,
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
                    to: application.student.email,
                    subject,
                    text
                });
            } catch (e) {
                console.log("Email sending error:", e);
            }
        }, 0);

        /* step 4 : reset previous AI interview data so a new round can begin fresh
           use 'none' for ipStatus (valid enum) and null for ipScore (Number, nullable) */
        await Application.findByIdAndUpdate(application._id, {
            ipStatus:    'none',
            ipScore:     null,
            ipReportUrl: '',
            ipSessionId: '',
            status:      'shortlisted'
        });

        res.status(201).json({
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

module.exports = scheduleInterview;;
