const express = require("express");
const router = express.Router();

const {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require("../handlers/notification");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");


// user
router.get("/:pageNumber",verifyToken, getUserNotifications);
router.put("/:id/read",verifyToken, markAsRead);
router.put("/read-all",verifyToken,markAllAsRead);

// admin/system
router.post("/send",verifyToken,adminAuth, sendNotification);

module.exports = router;