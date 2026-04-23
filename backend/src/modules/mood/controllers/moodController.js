const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const moodService = require("../services/moodService");

const addMoodLog = asyncHandler(async (req, res) => {
  const { date, mood, note } = req.body;

  if (!date || !mood) {
    throw new ApiError(400, "date and mood are required");
  }

  const log = await moodService.addMoodLog({
    userId: req.user.id,
    date,
    mood,
    note,
  });

  res.status(201).json({
    success: true,
    message: "Mood log saved successfully",
    data: log,
  });
});

const getMoodHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const logs = await moodService.getMoodHistory(req.user.id, {
    startDate,
    endDate,
  });

  res.status(200).json({
    success: true,
    message: "Mood history fetched successfully",
    data: logs,
  });
});

module.exports = {
  addMoodLog,
  getMoodHistory,
};
