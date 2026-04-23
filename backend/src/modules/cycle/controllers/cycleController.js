const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const cycleService = require("../services/cycleService");

const addPeriodLog = asyncHandler(async (req, res) => {
  const { startDate, endDate, symptoms, notes } = req.body;

  if (!startDate) {
    throw new ApiError(400, "startDate is required");
  }

  const createdLog = await cycleService.addPeriodLog({
    userId: req.user.id,
    startDate,
    endDate,
    symptoms,
    notes,
  });

  res.status(201).json({
    success: true,
    message: "Period log added successfully",
    data: createdLog,
  });
});

const getPeriodHistory = asyncHandler(async (req, res) => {
  const logs = await cycleService.getPeriodHistory(req.user.id);

  res.status(200).json({
    success: true,
    message: "Period history fetched successfully",
    data: logs,
  });
});

const predictNextCycle = asyncHandler(async (req, res) => {
  const prediction = await cycleService.getCyclePrediction(req.user.id);

  res.status(200).json({
    success: true,
    message: "Cycle prediction generated successfully",
    data: prediction,
  });
});

module.exports = {
  addPeriodLog,
  getPeriodHistory,
  predictNextCycle,
};
