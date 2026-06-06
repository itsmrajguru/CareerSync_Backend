const rateLimit = require('express-rate-limit');

/* authRateLimiter...
     this function is built to prevent the server from brute-force attacks on the 
     sensitive routes like auth Routes
     so the ratelimiter applies a limit on the incoming requests to the a server
     from a specific IP address,
     and if the IP address make too much requests within the windowMs time
     then show the error to the user */

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 1000, // Limit each IP to 10 requests per window
    message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { authRateLimiter };
