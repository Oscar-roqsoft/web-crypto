const Notification = require("../models/notification");

const {
  sendSuccessResponse,
  sendSuccessResponseData,
  sendBadRequestResponse,
  sendUnauthenticatedErrorResponse
} = require("../responses");

/* =========================
   SEND NOTIFICATION
========================= */

const sendNotification = async (req, res) => {
  try {

    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      return sendBadRequestResponse(res, "Missing required fields");
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type
    });

    return sendSuccessResponseData(res, "Notification sent", {notification});

  } catch (error) {
    console.error(error);
    sendUnauthenticatedErrorResponse(res, error.message);
  }
};

/* =========================
   GET USER NOTIFICATIONS
========================= */

const getUserNotifications = async (req, res) => {
    try {
  
      const userId = req.user.userId;
  
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      const total = await Notification.countDocuments({ userId });
  
      return sendSuccessResponseData(res, "Notifications fetched", {
        notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
  
    } catch (error) {
      console.error(error);
      sendUnauthenticatedErrorResponse(res, error.message);
    }
  };


  /* =========================
   MARK ONE AS READ
========================= */

const markAsRead = async (req, res) => {
    try {
  
      const { id } = req.params;
  
      await Notification.findByIdAndUpdate(id, {
        isRead: true
      });
  
      return sendSuccessResponse(res, "Notification marked as read");
  
    } catch (error) {
      console.error(error);
      sendUnauthenticatedErrorResponse(res, error.message);
    }
  };



  /* =========================
   MARK ALL AS READ
========================= */

const markAllAsRead = async (req, res) => {
    try {
  
      const userId = req.user.userId;
  
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
  
      return sendSuccessResponse(res, "All notifications marked as read");
  
    } catch (error) {
      console.error(error);
      sendUnauthenticatedErrorResponse(res, error.message);
    }
  };




  
  module.exports = {
    sendNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead
  };
