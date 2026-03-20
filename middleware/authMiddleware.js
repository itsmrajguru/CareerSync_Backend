const jwt = require('jsonwebtoken');
const userModel = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await userModel.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ detail: 'User not found' }); // Django message: "User not found" (rare) or "Given token not valid for any token type"
            }

            next();
        } catch (error) {
            console.error(error);
            // Django SimpleJWT says: {"detail": "Given token not valid for any token type", "code": "token_not_valid", "messages": [...]}
            // But usually just 401 Unauthorized
            return res.status(401).json({ detail: 'Given token not valid for any token type', code: 'token_not_valid' });
        }
    }

    if (!token) {
        return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
    }
};

module.exports = { protect };
