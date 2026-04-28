const NotificationModel = require('../models/NotificationModel');

/*
How the notification targets work:
- 'recipient' is ALWAYS a UserModel._id
- Application.student = User._id directly
- Job.company = CompanyProfile._id → need CompanyProfile.user to get User._id
*/
const createNotification = async ({ recipient, sender, type, title, message, link }) => {
    try {
        await NotificationModel.create({
            recipient,
            sender,
            type,
            title,
            message,
            link
        });
    } catch (error) {
        console.error("Failed to create notification:", error.message);
    }
};

module.exports = { createNotification };
