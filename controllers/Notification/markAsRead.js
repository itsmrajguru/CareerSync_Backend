const NotificationModel = require('../../models/NotificationModel');

/* marks a specific notification or ALL notifications as read for the logged-in user */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // UserModel _id from JWT

        if (id === 'all') {
            await NotificationModel.updateMany(
                { recipient: userId, isRead: false },
                { isRead: true }
            );
        } else {
            await NotificationModel.findOneAndUpdate(
                { _id: id, recipient: userId },
                { isRead: true }
            );
        }

        res.status(200).json({ success: true, message: "Notification(s) marked as read." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = markAsRead;
