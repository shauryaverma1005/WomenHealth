const express = require("express");
const {
  getMoodTrends,
  getCycleConsistency,
  getWaterIntakeTrends,
  correlateMoodWithCyclePhase,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/mood-trends", getMoodTrends);
router.get("/cycle-consistency", getCycleConsistency);
router.get("/water-trends", getWaterIntakeTrends);
router.get("/mood-cycle-correlation", correlateMoodWithCyclePhase);

module.exports = router;
