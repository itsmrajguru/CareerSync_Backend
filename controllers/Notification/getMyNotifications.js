const NotificationModel = require('../../models/NotificationModel');

/* fetches notifications for the logged-in user (student or company).
   Both are stored in UserModel, so we just query by req.user.id */
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // this is the UserModel _id from JWT

        const notifications = await NotificationModel.find({ recipient: userId })
            .sort({ isRead: 1, createdAt: -1 })
            .limit(50);

        const unreadCount = await NotificationModel.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = getMyNotifications;
