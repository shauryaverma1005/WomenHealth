const PeriodLog = require("../../../models/PeriodLog");

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addPeriodLog = async ({ userId, startDate, endDate, symptoms, notes }) => {
  const payload = {
    userId,
    startDate: toStartOfDay(startDate),
    endDate: endDate ? toStartOfDay(endDate) : null,
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    notes: notes || "",
  };

  return PeriodLog.create(payload);
};

const getPeriodHistory = async (userId) => {
  return PeriodLog.find({ userId }).sort({ startDate: -1 });
};

const getCyclePrediction = async (userId) => {
  const logs = await PeriodLog.find({ userId }).sort({ startDate: 1 });

  if (!logs.length) {
    return {
      predictedNextStartDate: null,
      predictedNextEndDate: null,
      predictedOvulationDate: null,
      predictedFertileWindowStart: null,
      predictedFertileWindowEnd: null,
      averageCycleLengthDays: DEFAULT_CYCLE_LENGTH,
      averagePeriodLengthDays: DEFAULT_PERIOD_LENGTH,
      confidence: "low",
    };
  }

  const cycleDiffs = [];
  for (let i = 1; i < logs.length; i += 1) {
    const diff = Math.round((logs[i].startDate - logs[i - 1].startDate) / DAY_MS);
    if (diff > 0) {
      cycleDiffs.push(diff);
    }
  }

  const periodDurations = logs
    .filter((log) => log.endDate && log.endDate >= log.startDate)
    .map((log) => Math.max(1, Math.round((log.endDate - log.startDate) / DAY_MS) + 1));

  const averageCycleLengthDays = cycleDiffs.length
    ? Math.round(cycleDiffs.reduce((sum, val) => sum + val, 0) / cycleDiffs.length)
    : DEFAULT_CYCLE_LENGTH;

  const averagePeriodLengthDays = periodDurations.length
    ? Math.round(periodDurations.reduce((sum, val) => sum + val, 0) / periodDurations.length)
    : DEFAULT_PERIOD_LENGTH;

  const lastLog = logs[logs.length - 1];
  const predictedNextStartDate = new Date(
    toStartOfDay(lastLog.startDate).getTime() + averageCycleLengthDays * DAY_MS
  );
  const predictedNextEndDate = new Date(
    predictedNextStartDate.getTime() + (averagePeriodLengthDays - 1) * DAY_MS
  );

  const predictedOvulationDate = new Date(
    predictedNextStartDate.getTime() - 14 * DAY_MS
  );
  
  const predictedFertileWindowStart = new Date(
    predictedOvulationDate.getTime() - 5 * DAY_MS
  );
  
  const predictedFertileWindowEnd = new Date(
    predictedOvulationDate.getTime() + 1 * DAY_MS
  );

  return {
    predictedNextStartDate,
    predictedNextEndDate,
    predictedOvulationDate,
    predictedFertileWindowStart,
    predictedFertileWindowEnd,
    averageCycleLengthDays,
    averagePeriodLengthDays,
    confidence: logs.length >= 3 ? "medium" : "low",
  };
};

module.exports = {
  addPeriodLog,
  getPeriodHistory,
  getCyclePrediction,
};
