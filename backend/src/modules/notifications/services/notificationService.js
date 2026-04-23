const User = require("../../../models/User");
const MoodLog = require("../../../models/MoodLog");
const WaterLog = require("../../../models/WaterLog");
const PeriodLog = require("../../../models/PeriodLog");
const Notification = require("../../../models/Notification");

const DAY_MS = 24 * 60 * 60 * 1000;

const moodSuggestionMap = {
  very_sad: "Take it slow today. Short walks, hydration, and reaching out can help.",
  sad: "A gentle routine and good sleep can stabilize your mood.",
  anxious: "Try a short breathing exercise and reduce caffeine today.",
  stressed: "Prioritize top 1-2 tasks and schedule brief breaks.",
  neutral: "Maintain your habits and add one activity you enjoy.",
  calm: "Good emotional balance today. Keep hydration and sleep steady.",
  happy: "Use your energy for meaningful tasks and social connection.",
  very_happy: "Great momentum today. Channel it while keeping balanced rest.",
  irritable: "Keep plans light and prioritize hydration and recovery.",
};

const toStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ensureNotificationOncePerDay = async ({ userId, type, title, message, metadata }) => {
  const dayStart = toStartOfDay(new Date());
  const dayEnd = new Date(dayStart.getTime() + DAY_MS - 1);

  const exists = await Notification.findOne({
    userId,
    type,
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });
  if (exists) return null;

  return Notification.create({
    userId,
    type,
    title,
    message,
    metadata: metadata || {},
  });
};

const getCyclePredictionInfo = async (userId) => {
  const logs = await PeriodLog.find({ userId }).sort({ startDate: 1 });
  if (!logs.length) return null;

  const diffs = [];
  for (let i = 1; i < logs.length; i += 1) {
    const diff = Math.round((logs[i].startDate - logs[i - 1].startDate) / DAY_MS);
    if (diff > 0) diffs.push(diff);
  }
  const avgCycle = diffs.length
    ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
    : 28;

  const last = logs[logs.length - 1];
  const predictedStart = new Date(toStartOfDay(last.startDate).getTime() + avgCycle * DAY_MS);
  const daysUntil = Math.ceil((toStartOfDay(predictedStart) - toStartOfDay(new Date())) / DAY_MS);

  return { predictedStart, daysUntil };
};

const processPeriodReminders = async (users) => {
  let created = 0;
  for (const user of users) {
    const cycleInfo = await getCyclePredictionInfo(user._id);
    if (!cycleInfo) continue;

    if (cycleInfo.daysUntil >= 0 && cycleInfo.daysUntil <= 2) {
      const notification = await ensureNotificationOncePerDay({
        userId: user._id,
        type: "period_reminder",
        title: "Period reminder",
        message: `Your next cycle is predicted around ${cycleInfo.predictedStart
          .toISOString()
          .slice(0, 10)}.`,
        metadata: { predictedStartDate: cycleInfo.predictedStart },
      });
      if (notification) created += 1;
    }
  }
  return created;
};

const processWaterReminders = async (users) => {
  let created = 0;
  const today = toStartOfDay(new Date());

  for (const user of users) {
    const todayLog = await WaterLog.findOne({ userId: user._id, date: today });
    const currentIntake = todayLog ? todayLog.intake : 0;
    const dailyGoal = 8;

    if (currentIntake < dailyGoal) {
      const notification = await ensureNotificationOncePerDay({
        userId: user._id,
        type: "water_reminder",
        title: "Hydration reminder",
        message: `You are at ${currentIntake}/${dailyGoal} glasses today. Drink some water.`,
        metadata: { currentIntake, dailyGoal },
      });
      if (notification) created += 1;
    }
  }
  return created;
};

const processMoodSuggestions = async (users) => {
  let created = 0;

  for (const user of users) {
    const latestMood = await MoodLog.findOne({ userId: user._id }).sort({ date: -1 });
    if (!latestMood) continue;

    const suggestion = moodSuggestionMap[latestMood.mood] || moodSuggestionMap.neutral;
    const notification = await ensureNotificationOncePerDay({
      userId: user._id,
      type: "mood_suggestion",
      title: "Mood suggestion",
      message: suggestion,
      metadata: { basedOnMood: latestMood.mood },
    });
    if (notification) created += 1;
  }
  return created;
};

const runNotificationJob = async () => {
  const users = await User.find({}, "_id");

  const [periodCount, waterCount, moodCount] = await Promise.all([
    processPeriodReminders(users),
    processWaterReminders(users),
    processMoodSuggestions(users),
  ]);

  return {
    periodReminders: periodCount,
    waterReminders: waterCount,
    moodSuggestions: moodCount,
    totalCreated: periodCount + waterCount + moodCount,
  };
};

const getUserNotifications = async (userId, { limit = 30, unreadOnly = "false" } = {}) => {
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const query = { userId };
  if (String(unreadOnly) === "true") {
    query.read = false;
  }

  return Notification.find(query).sort({ createdAt: -1 }).limit(parsedLimit);
};

const markNotificationRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  );
};

module.exports = {
  runNotificationJob,
  getUserNotifications,
  markNotificationRead,
};
