const express = require("express");
const { getNextDayMoodPrediction, getDailyCycleTips } = require("../controllers/predictionController");

const router = express.Router();

router.get("/next-day-mood", getNextDayMoodPrediction);
router.get("/tips", getDailyCycleTips);

module.exports = router;
