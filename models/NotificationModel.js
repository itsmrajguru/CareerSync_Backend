//Har Har Mahadev

const mongoose = require('mongoose');

/*
Notification System Design:
- Every user (student or company) has a single entry in UserModel.
- Their profile details live in StudentProfileModel or CompanyProfileModel.
- For notifications, we always use the UserModel _id as the recipient/sender.
- We use req.user.id which is the UserModel._id from the JWT token.
- We use the 'role' field on the User to determine who to notify.
*/

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'   // Always the UserModel — works for both students and companies
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'   // Always the UserModel — sender is also a User
    },
    type: {
        type: String,
        required: true,
        enum: ['application_update', 'new_application', 'message', 'system']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String // Optional URL to redirect to
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
