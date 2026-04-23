const mongoose = require("mongoose");
const MoodLog = require("../../../models/MoodLog");
const PeriodLog = require("../../../models/PeriodLog");
const WaterLog = require("../../../models/WaterLog");

const DAY_MS = 24 * 60 * 60 * 1000;

const MOOD_SCORE = {
  very_sad: 1,
  sad: 2,
  irritable: 2,
  anxious: 2,
  stressed: 2,
  neutral: 3,
  calm: 4,
  happy: 4,
  very_happy: 5,
};

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildDateRange = (startDate, endDate, fallbackDays = 90) => {
  const end = endDate ? toStartOfDay(endDate) : toStartOfDay(new Date());
  const start = startDate
    ? toStartOfDay(startDate)
    : new Date(end.getTime() - (fallbackDays - 1) * DAY_MS);

  return { start, end };
};

const getMoodTrends = async (userId, { startDate, endDate }) => {
  const { start, end } = buildDateRange(startDate, endDate);
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const trends = await MoodLog.aggregate([
    { $match: { userId: objectUserId, date: { $gte: start, $lte: end } } },
    {
      $project: {
        mood: 1,
        dateLabel: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      },
    },
    {
      $group: {
        _id: "$dateLabel",
        entries: { $push: "$mood" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const moodCounts = {};
  const daily = trends.map((item) => {
    const scores = item.entries.map((mood) => MOOD_SCORE[mood] || 3);

    item.entries.forEach((mood) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    return {
      date: item._id,
      count: item.count,
      averageMoodScore: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      moods: item.entries,
    };
  });

  return {
    range: { start, end },
    totalLogs: daily.reduce((sum, day) => sum + day.count, 0),
    moodCounts,
    daily,
  };
};

const getCycleConsistency = async (userId) => {
  const logs = await PeriodLog.find({ userId }).sort({ startDate: 1 });
  if (logs.length < 2) {
    return {
      cyclesTracked: logs.length,
      averageCycleLengthDays: null,
      shortestCycleDays: null,
      longestCycleDays: null,
      standardDeviationDays: null,
      cycleLengths: [],
    };
  }

  const cycleLengths = [];
  for (let i = 1; i < logs.length; i += 1) {
    const diffDays = Math.round((logs[i].startDate - logs[i - 1].startDate) / DAY_MS);
    if (diffDays > 0) {
      cycleLengths.push(diffDays);
    }
  }

  const average =
    cycleLengths.reduce((sum, length) => sum + length, 0) / (cycleLengths.length || 1);
  const variance =
    cycleLengths.reduce((sum, length) => sum + (length - average) ** 2, 0) /
    (cycleLengths.length || 1);
  const standardDeviation = Math.sqrt(variance);

  return {
    cyclesTracked: logs.length,
    averageCycleLengthDays: Number(average.toFixed(2)),
    shortestCycleDays: Math.min(...cycleLengths),
    longestCycleDays: Math.max(...cycleLengths),
    standardDeviationDays: Number(standardDeviation.toFixed(2)),
    cycleLengths,
  };
};

const getWaterIntakeTrends = async (userId, { startDate, endDate }) => {
  const { start, end } = buildDateRange(startDate, endDate, 30);
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const daily = await WaterLog.aggregate([
    { $match: { userId: objectUserId, date: { $gte: start, $lte: end } } },
    {
      $project: {
        intake: 1,
        dateLabel: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      },
    },
    {
      $group: {
        _id: "$dateLabel",
        intake: { $sum: "$intake" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalIntake = daily.reduce((sum, day) => sum + day.intake, 0);

  return {
    range: { start, end },
    daysWithLogs: daily.length,
    totalIntake: Number(totalIntake.toFixed(2)),
    averageIntakePerLoggedDay: Number((totalIntake / (daily.length || 1)).toFixed(2)),
    daily: daily.map((item) => ({ date: item._id, intake: item.intake })),
  };
};

const getCyclePhaseFromDay = (dayInCycle) => {
  if (dayInCycle <= 5) return "menstrual";
  if (dayInCycle <= 13) return "follicular";
  if (dayInCycle <= 16) return "ovulation";
  return "luteal";
};

const correlateMoodWithCyclePhase = async (userId) => {
  const [periodLogs, moodLogs] = await Promise.all([
    PeriodLog.find({ userId }).sort({ startDate: 1 }),
    MoodLog.find({ userId }).sort({ date: 1 }),
  ]);

  if (!periodLogs.length || !moodLogs.length) {
    return {
      totalCorrelatedLogs: 0,
      byPhase: {},
      note: "Not enough period or mood logs for correlation",
    };
  }

  const cycleDiffs = [];
  for (let i = 1; i < periodLogs.length; i += 1) {
    const diff = Math.round((periodLogs[i].startDate - periodLogs[i - 1].startDate) / DAY_MS);
    if (diff > 0) cycleDiffs.push(diff);
  }
  const avgCycleLength = cycleDiffs.length
    ? Math.round(cycleDiffs.reduce((a, b) => a + b, 0) / cycleDiffs.length)
    : 28;

  const phaseStats = {
    menstrual: { count: 0, moods: {}, averageMoodScore: 0 },
    follicular: { count: 0, moods: {}, averageMoodScore: 0 },
    ovulation: { count: 0, moods: {}, averageMoodScore: 0 },
    luteal: { count: 0, moods: {}, averageMoodScore: 0 },
  };

  let totalCorrelatedLogs = 0;

  moodLogs.forEach((moodLog) => {
    const lastPeriod = [...periodLogs].reverse().find((p) => p.startDate <= moodLog.date);
    if (!lastPeriod) return;

    const daysSinceStart = Math.floor((toStartOfDay(moodLog.date) - toStartOfDay(lastPeriod.startDate)) / DAY_MS);
    const dayInCycle = ((daysSinceStart % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;
    const phase = getCyclePhaseFromDay(dayInCycle);

    const score = MOOD_SCORE[moodLog.mood] || 3;
    phaseStats[phase].count += 1;
    phaseStats[phase].moods[moodLog.mood] = (phaseStats[phase].moods[moodLog.mood] || 0) + 1;
    phaseStats[phase].averageMoodScore += score;
    totalCorrelatedLogs += 1;
  });

  Object.keys(phaseStats).forEach((phase) => {
    const item = phaseStats[phase];
    item.averageMoodScore = item.count
      ? Number((item.averageMoodScore / item.count).toFixed(2))
      : 0;
  });

  return {
    totalCorrelatedLogs,
    assumedAverageCycleLengthDays: avgCycleLength,
    byPhase: phaseStats,
  };
};

module.exports = {
  getMoodTrends,
  getCycleConsistency,
  getWaterIntakeTrends,
  correlateMoodWithCyclePhase,
};
