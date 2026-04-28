const express = require('express');
const notificationRouter = express.Router();
const { protect } = require('../../middleware/authMiddleware');

const getMyNotifications = require('../../controllers/Notification/getMyNotifications');
const markAsRead = require('../../controllers/Notification/markAsRead');
const logCommunication = require('../../controllers/Notification/logCommunication');

// All notification routes are protected
notificationRouter.get('/', protect, getMyNotifications); //both users gets the notifications from the sender...
notificationRouter.patch('/:id/read', protect, markAsRead);//
notificationRouter.post('/log-email', protect, logCommunication);

module.exports = { notificationRouter };

