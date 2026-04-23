const MoodLog = require("../../../models/MoodLog");

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addMoodLog = async ({ userId, date, mood, note }) => {
  const normalizedDate = toStartOfDay(date);

  return MoodLog.findOneAndUpdate(
    { userId, date: normalizedDate },
    { $set: { mood, note: note || "" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const getMoodHistory = async (userId, { startDate, endDate }) => {
  const query = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = toStartOfDay(startDate);
    }
    if (endDate) {
      query.date.$lte = toStartOfDay(endDate);
    }
  }

  return MoodLog.find(query).sort({ date: -1 });
};

module.exports = {
  addMoodLog,
  getMoodHistory,
};
