//creating integrationController

const Application = require('../../models/ApplicationModel')
const axios       = require('axios')
require('dotenv').config()

/* triggerAIInterview controller */
const triggerAIInterview = async (req, res) => {
    const { applicationId } = req.params

    try {
        /* step 1 :load the application and populate student, job and company */
        const application = await Application.findById(applicationId)
            .populate('student', 'email username')
            .populate('job', 'title')
            .populate('company', 'name')

        /* condition :application must exist */
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found.' })
        }

        /* condition :only shortlisted candidates or candidates who already received an invite can be sent an AI interview */
        if (application.status !== 'shortlisted' && application.status !== 'interview_sent') {
            return res.status(400).json({
                success: false,
                message: 'Can only trigger AI interview for shortlisted candidates.'
            })
        }

        /* condition :prevent duplicate triggers */
        if (application.ipStatus === 'interview_completed') {
            return res.status(400).json({
                success: false,
                message: 'AI interview already completed.'
            })
        }

        /* step 2 :build the payload for InterviewPilot */
        const ipPayload = {
            studentEmail:    application.student.email,
            candidateName:   application.student.username,
            role:            application.job.title,
            difficulty:      req.body.difficulty    || 'medium',
            resumeText:      req.body.resumeText     || '',
            csApplicationId: applicationId.toString()
        }

        /* step 3 :call InterviewPilot backend to create the session */
        const ipResponse = await axios.post(
            `${process.env.INTERVIEWPILOT_BACKEND_URL}/api/v1/interviews/create`,
            ipPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-secret': process.env.INTERVIEWPILOT_API_SECRET
                },
                timeout: 30000
            }
        )

        /* condition :InterviewPilot must confirm success */
        if (!ipResponse.data.success) {
            return res.status(500).json({
                success: false,
                message: 'InterviewPilot failed to create session.'
            })
        }

        /* step 4 :save the ipSessionId and update statuses on the application */
        application.ipSessionId = ipResponse.data.session._id || ''
        application.ipStatus    = 'interview_sent'
        application.status      = 'interview_sent'
        await application.save()

        return res.status(200).json({
            success: true,
            message: 'AI interview triggered. Student will receive an email with the interview link.',
            ipSessionId: application.ipSessionId
        })

    } catch (e) {
        const errorMsg = e.response?.data?.message || e.message;
        console.log('triggerAIInterview Error :', errorMsg)
        return res.status(500).json({
            success: false,
            message: `Failed to trigger AI interview: ${errorMsg}`
        })
    }
}

/* receiveInterviewResult controller */
const receiveInterviewResult = async (req, res) => {
    const { csApplicationId, overallScore, reportUrl, completedAt } = req.body

    /* condition :csApplicationId is required to find the application */
    if (!csApplicationId) {
        return res.status(400).json({ success: false, message: 'csApplicationId is required.' })
    }

    try {
        /* step 1 :find the application and update all ip fields */
        const application = await Application.findByIdAndUpdate(
            csApplicationId,
            {
                ipScore:     overallScore || 0,
                ipReportUrl: reportUrl    || '',
                ipStatus:    'interview_completed',
                status:      'interview_completed'
            },
            { new: true }
        )

        /* condition :application must exist */
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found.' })
        }

        console.log(`Interview result received for application ${csApplicationId} : ${overallScore}/100`)
        return res.status(200).json({ success: true, message: 'Interview result saved.' })

    } catch (e) {
        console.log('receiveInterviewResult Error :', e.message)
        return res.status(500).json({ success: false, message: 'Failed to save interview result.' })
    }
}

module.exports = { triggerAIInterview, receiveInterviewResult }
