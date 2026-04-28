const { createNotification } = require('../../utils/notificationHelper');

/* Logs a manual email/contact attempt as an in-app notification for the recipient.
   Both sender and recipient are Users (UserModel _ids from JWT). */
const logCommunication = async (req, res) => {
    try {
        const { recipientId, subject, message } = req.body;
        const senderId = req.user.id;

        await createNotification({
            recipient: recipientId,
            sender: senderId,
            type: 'message',
            title: subject || 'New Communication',
            message: message || `Someone has initiated contact with you.`,
            link: '/notifications'
        });

        res.status(200).json({ success: true, message: "Communication logged as notification." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = logCommunication;
