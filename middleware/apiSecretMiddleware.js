/* apiSecretMiddleware */
const verifyApiSecret = (req, res, next) => {
    const secret = req.headers['x-api-secret']

    /* condition :if the secret is missing or does not match, reject the request */
    if (!secret || secret !== process.env.INTERVIEWPILOT_API_SECRET) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized service call — invalid API secret.'
        })
    }

    next()
}

module.exports = verifyApiSecret
