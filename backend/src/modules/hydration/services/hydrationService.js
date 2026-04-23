const WaterLog = require("../../../models/WaterLog");

const DAY_MS = 24 * 60 * 60 * 1000;

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDailyIntake = async ({ userId, date, intake }) => {
  const normalizedDate = toStartOfDay(date);
  const intakeValue = Number(intake);

  return WaterLog.findOneAndUpdate(
    { userId, date: normalizedDate },
    { $inc: { intake: intakeValue } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const getHydrationStats = async (userId, date) => {
  const targetDate = toStartOfDay(date || new Date());
  const weekStartDate = new Date(targetDate.getTime() - 6 * DAY_MS);

  const [dailyLog, weeklyLogs] = await Promise.all([
    WaterLog.findOne({ userId, date: targetDate }),
    WaterLog.find({
      userId,
      date: { $gte: weekStartDate, $lte: targetDate },
    }).sort({ date: 1 }),
  ]);

  const dailyIntake = dailyLog ? dailyLog.intake : 0;
  const weeklyTotalIntake = weeklyLogs.reduce((sum, log) => sum + log.intake, 0);
  const weeklyAverageIntake = Number((weeklyTotalIntake / 7).toFixed(2));

  return {
    date: targetDate,
    dailyIntake,
    weekRange: {
      start: weekStartDate,
      end: targetDate,
    },
    weeklyTotalIntake,
    weeklyAverageIntake,
    weeklyLogs,
  };
};

const getHydrationHistory = async (userId) => {
  return WaterLog.find({ userId }).sort({ date: -1 });
};

module.exports = {
  addDailyIntake,
  getHydrationStats,
  getHydrationHistory,
};
