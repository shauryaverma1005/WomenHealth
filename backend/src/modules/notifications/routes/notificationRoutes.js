const express = require("express");
const {
  getMyNotifications,
  markAsRead,
  runNow,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getMyNotifications);
router.patch("/:notificationId/read", markAsRead);
router.post("/run-now", runNow);

module.exports = router;
