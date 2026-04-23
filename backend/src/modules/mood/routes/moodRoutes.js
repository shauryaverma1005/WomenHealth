const express = require("express");
const { addMoodLog, getMoodHistory } = require("../controllers/moodController");

const router = express.Router();

router.post("/logs", addMoodLog);
router.get("/history", getMoodHistory);

module.exports = router;
