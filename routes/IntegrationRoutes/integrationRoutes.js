//creating integrationRoutes

const express        = require('express')
const integrationRouter = express.Router()

/* importing auth middleware and api secret middleware */
const { protect }      = require('../../middleware/authMiddleware')
const verifyApiSecret  = require('../../middleware/apiSecretMiddleware')

/* importing the controllers */
const { triggerAIInterview, receiveInterviewResult } = require('../../controllers/Integration/integrationController')

/* company triggers AI interview for a candidate */
integrationRouter.post('/trigger/:applicationId', protect, triggerAIInterview)

/* InterviewPilot calls this after interview completes */
integrationRouter.post('/interview-result', verifyApiSecret, receiveInterviewResult)

module.exports = { integrationRouter }
