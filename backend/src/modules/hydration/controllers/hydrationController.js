const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const hydrationService = require("../services/hydrationService");

const addDailyIntake = asyncHandler(async (req, res) => {
  const { intake, date } = req.body;

  if (intake === undefined || intake === null) {
    throw new ApiError(400, "intake is required");
  }

  if (Number.isNaN(Number(intake)) || Number(intake) <= 0) {
    throw new ApiError(400, "intake must be a positive number");
  }

  const log = await hydrationService.addDailyIntake({
    userId: req.user.id,
    date: date || new Date(),
    intake,
  });

  res.status(201).json({
    success: true,
    message: "Daily intake added successfully",
    data: log,
  });
});

const getHydrationStats = asyncHandler(async (req, res) => {
  const stats = await hydrationService.getHydrationStats(req.user.id, req.query.date);

  res.status(200).json({
    success: true,
    message: "Hydration stats fetched successfully",
    data: stats,
  });
});

const getHydrationHistory = asyncHandler(async (req, res) => {
  const history = await hydrationService.getHydrationHistory(req.user.id);

  res.status(200).json({
    success: true,
    message: "Hydration history fetched successfully",
    data: history,
  });
});

module.exports = {
  addDailyIntake,
  getHydrationStats,
  getHydrationHistory,
};
