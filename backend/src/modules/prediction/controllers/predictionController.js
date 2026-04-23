const asyncHandler = require("../../../utils/asyncHandler");
const predictionService = require("../services/predictionService");

const getNextDayMoodPrediction = asyncHandler(async (req, res) => {
  const data = await predictionService.predictNextDayMood(req.user.id);

  res.status(200).json({
    success: true,
    message: "Next day mood prediction generated successfully",
    data,
  });
});

const getDailyCycleTips = asyncHandler(async (req, res) => {
  const data = await predictionService.getDailyTips(req.user.id);

  res.status(200).json({
    success: true,
    message: "Daily cycle tips fetched successfully",
    data,
  });
});

module.exports = { getNextDayMoodPrediction, getDailyCycleTips };
