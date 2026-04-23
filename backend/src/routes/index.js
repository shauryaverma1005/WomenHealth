const express = require("express");
const { getHealth, getProtectedProfile } = require("../controllers/healthController");
const authRoutes = require("../modules/auth/routes/authRoutes");
const cycleRoutes = require("../modules/cycle/routes/cycleRoutes");
const moodRoutes = require("../modules/mood/routes/moodRoutes");
const hydrationRoutes = require("../modules/hydration/routes/hydrationRoutes");
const analyticsRoutes = require("../modules/analytics/routes/analyticsRoutes");
const predictionRoutes = require("../modules/prediction/routes/predictionRoutes");
const reportRoutes = require("../modules/reports/routes/reportRoutes");
const partnerRoutes = require("../modules/partner/routes/partnerRoutes");
const notificationRoutes = require("../modules/notifications/routes/notificationRoutes");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.get("/auth/me", protect, getProtectedProfile);
router.use("/cycle", protect, cycleRoutes);
router.use("/mood", protect, moodRoutes);
router.use("/hydration", protect, hydrationRoutes);
router.use("/analytics", protect, analyticsRoutes);
router.use("/prediction", protect, predictionRoutes);
router.use("/reports", protect, reportRoutes);
router.use("/partner", protect, partnerRoutes);
router.use("/notifications", protect, notificationRoutes);

module.exports = router;
