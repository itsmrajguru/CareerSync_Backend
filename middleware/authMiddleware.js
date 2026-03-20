const jwt = require('jsonwebtoken');
const userModel = require('../models/User');

const protect = async (req, res, next) => {

    // check if Authorization header exists and starts with Bearer
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Please login.'
        });
    }

    // extract token from "Bearer eyJhbGci..."
    const token = authHeader.split(' ')[1];

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // get user from DB, exclude password
        req.user = await userModel.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        next(); // ← user is valid, proceed to next middleware/controller

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalid or expired. Please login again.'
        });
    }
};

module.exports = { protect };