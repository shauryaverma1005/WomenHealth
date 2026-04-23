const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const notificationService = require("../services/notificationService");

const getMyNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.getUserNotifications(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markNotificationRead(
    req.user.id,
    req.params.notificationId
  );
  if (!data) {
    throw new ApiError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data,
  });
});

const runNow = asyncHandler(async (req, res) => {
  const stats = await notificationService.runNotificationJob();
  res.status(200).json({
    success: true,
    message: "Notification job executed",
    data: stats,
  });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  runNow,
};
