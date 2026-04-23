const asyncHandler = require("../../../utils/asyncHandler");
const analyticsService = require("../services/analyticsService");

const getMoodTrends = asyncHandler(async (req, res) => {
  const data = await analyticsService.getMoodTrends(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: "Mood trends fetched successfully",
    data,
  });
});

const getCycleConsistency = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCycleConsistency(req.user.id);
  res.status(200).json({
    success: true,
    message: "Cycle consistency fetched successfully",
    data,
  });
});

const getWaterIntakeTrends = asyncHandler(async (req, res) => {
  const data = await analyticsService.getWaterIntakeTrends(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: "Water intake trends fetched successfully",
    data,
  });
});

const correlateMoodWithCyclePhase = asyncHandler(async (req, res) => {
  const data = await analyticsService.correlateMoodWithCyclePhase(req.user.id);
  res.status(200).json({
    success: true,
    message: "Mood and cycle phase correlation fetched successfully",
    data,
  });
});

module.exports = {
  getMoodTrends,
  getCycleConsistency,
  getWaterIntakeTrends,
  correlateMoodWithCyclePhase,
};
