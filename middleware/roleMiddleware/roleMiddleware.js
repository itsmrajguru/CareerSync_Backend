/* Who created authentication Middleware for Verifying Whether the user is authenticated or not
But now we are creating RolMiddleware Which will check type of the user
entering in the website whether it is a company,a student or an admin
And depending upon that We will redirect them to the pages they should go or have access
example:
    router.post('/jobs/', protect, isCompany, jobController.createJob);
    router.post('/apply/:jobId', protect, isStudent, applicationController.apply);
    router.get('/admin/stats', protect, isAdmin, adminController.getStats);
    router.get('/something', protect, isAnyOf('company', 'admin'), controller.fn); */

// Only students can access this route
const isStudent = (req, res, next) => {
    if (req.user?.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access restricted to student accounts only.'
        });
    }
    next();
};

// Only companies can access this route
const isCompany = (req, res, next) => {
    if (req.user?.role !== 'company') {
        return res.status(403).json({
            success: false,
            message: 'Access restricted to company accounts only.'
        });
    }
    next();
};

// Only admins can access this route
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access restricted to administrator accounts only.'
        });
    }
    next();
};

// If we want Give access for a page to multiple Users then this is the Condition
const isAnyOf = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Access restricted. Required role: ${roles.join(' or ')}.`
        });
    }
    next();
};

module.exports = { isStudent, isCompany, isAdmin, isAnyOf };
