const express = require("express");
const { addDailyIntake, getHydrationStats, getHydrationHistory } = require("../controllers/hydrationController");

const router = express.Router();

router.post("/logs", addDailyIntake);
router.get("/stats", getHydrationStats);
router.get("/history", getHydrationHistory);

module.exports = router;
