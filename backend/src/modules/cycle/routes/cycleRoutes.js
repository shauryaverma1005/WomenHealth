const express = require("express");
const {
  addPeriodLog,
  getPeriodHistory,
  predictNextCycle,
} = require("../controllers/cycleController");

const router = express.Router();

router.post("/logs", addPeriodLog);
router.get("/history", getPeriodHistory);
router.get("/predict", predictNextCycle);

module.exports = router;
