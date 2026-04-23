const MoodLog = require("../../../models/MoodLog");
const PeriodLog = require("../../../models/PeriodLog");

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

const SCORE_TO_MOOD = [
  { max: 1.5, mood: "very_sad" },
  { max: 2.4, mood: "sad" },
  { max: 3.2, mood: "neutral" },
  { max: 4.3, mood: "happy" },
  { max: 5, mood: "very_happy" },
];

const PHASE_MOOD_ADJUSTMENT = {
  menstrual: -0.35,
  follicular: 0.2,
  ovulation: 0.35,
  luteal: -0.2,
};

const SUGGESTIONS = {
  very_sad: [
    "Keep commitments light and prioritize rest.",
    "Try a 10-minute walk or gentle stretching.",
    "Reach out to a trusted person and share how you feel.",
  ],
  sad: [
    "Plan low-pressure tasks and short breaks.",
    "Hydrate early and include protein-rich meals.",
    "Use journaling prompts to unload stress.",
  ],
  neutral: [
    "Maintain your normal routine and sleep schedule.",
    "Add one mood-lifting activity you enjoy today.",
    "Track hydration and energy to spot patterns.",
  ],
  happy: [
    "Use this momentum for important tasks.",
    "Schedule exercise or social time while energy is good.",
    "Prepare tomorrow's plan to sustain consistency.",
  ],
  very_happy: [
    "Channel high energy into creative or strategic work.",
    "Balance activity with hydration and recovery.",
    "Capture what is working so you can repeat it later.",
  ],
};

const PHASE_TIPS = {
  menstrual: "Focus on rest, iron-rich foods, and gentle movement.",
  follicular: "Great phase for planning, learning, and new habits.",
  ovulation: "Leverage communication and social confidence this phase.",
  luteal: "Reduce overload, keep routines simple, and prioritize sleep.",
};

const CATEGORIZED_PHASE_TIPS = {
  menstrual: {
    diet: "Focus on iron-rich foods (spinach, lentils) and dark chocolate for magnesium to help replenish blood loss.",
    exercise: "Keep movement gentle. Try restorative yoga, light walking, or simply resting to conserve energy.",
    mentalHealth: "Give yourself permission to rest. Journaling and limiting social overload can help manage fatigue.",
    pmsRelief: "A warm heating pad and staying hydrated can soothe lower back pain and abdominal cramps."
  },
  follicular: {
    diet: "Incorporate fresh, light foods like salads, fermented foods, and lean proteins to support rising estrogen.",
    exercise: "Your energy is building! This is a great time to schedule cardio, try a new workout class, or strength train.",
    mentalHealth: "Capitalize on clear thinking and optimism. Tackle difficult tasks or start a new project now.",
    pmsRelief: "PMS symptoms are usually absent now, but continue good sleep hygiene to establish a strong cycle baseline."
  },
  ovulation: {
    diet: "Eat foods rich in zinc and B vitamins (like seeds, eggs, and whole grains) to support the ovulatory peak.",
    exercise: "Peak energy! High-intensity interval training (HIIT) or group sports match this phase perfectly.",
    mentalHealth: "You might feel exceptionally social and communicative. Schedule important meetings or social events now.",
    pmsRelief: "If you experience 'mittelschmerz' (ovulation pain), gentle stretches and staying hydrated can help."
  },
  luteal: {
    diet: "Cravings may spike. Focus on complex carbs (sweet potatoes, oats) to stabilize blood sugar and reduce mood swings.",
    exercise: "Scale back from high intensity. Pilates, steady-state cardio, and longer walks are ideal as energy drops.",
    mentalHealth: "You might feel more introverted or anxious. Practice mindfulness, deep breathing, and prioritize boundaries.",
    pmsRelief: "Reduce caffeine and salty foods to minimize breast tenderness and bloating. A warm bath can deeply soothe PMS tension."
  },
  unknown: {
    diet: "Eat a balanced diet rich in whole foods, staying hydrated throughout the day.",
    exercise: "Listen to your body today. If you have energy, go for a run; if not, stick to a walk or stretching.",
    mentalHealth: "Take a few minutes for deep breathing or meditation to center your thoughts.",
    pmsRelief: "Tracking your cycle regularly will help us provide personalized relief tips here!"
  }
};

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getCyclePhaseFromDay = (dayInCycle) => {
  if (dayInCycle <= 5) return "menstrual";
  if (dayInCycle <= 13) return "follicular";
  if (dayInCycle <= 16) return "ovulation";
  return "luteal";
};

const getEstimatedCycleContext = async (userId, targetDate) => {
  const periodLogs = await PeriodLog.find({ userId }).sort({ startDate: 1 });
  if (!periodLogs.length) {
    return { cyclePhase: "unknown", cycleDay: null, averageCycleLength: 28 };
  }

  const cycleDiffs = [];
  for (let i = 1; i < periodLogs.length; i += 1) {
    const diff = Math.round((periodLogs[i].startDate - periodLogs[i - 1].startDate) / DAY_MS);
    if (diff > 0) cycleDiffs.push(diff);
  }
  const averageCycleLength = cycleDiffs.length
    ? Math.round(cycleDiffs.reduce((a, b) => a + b, 0) / cycleDiffs.length)
    : 28;

  const lastPeriod = [...periodLogs].reverse().find((log) => log.startDate <= targetDate);
  if (!lastPeriod) {
    return { cyclePhase: "unknown", cycleDay: null, averageCycleLength };
  }

  const daysSinceStart = Math.floor(
    (toStartOfDay(targetDate) - toStartOfDay(lastPeriod.startDate)) / DAY_MS
  );
  const cycleDay = ((daysSinceStart % averageCycleLength) + averageCycleLength) % averageCycleLength + 1;
  const cyclePhase = getCyclePhaseFromDay(cycleDay);

  return { cyclePhase, cycleDay, averageCycleLength };
};

const weightedMoodScore = (logs) => {
  if (!logs.length) return 3;

  const weighted = logs.map((log, idx) => {
    const recencyWeight = logs.length - idx;
    return (MOOD_SCORE[log.mood] || 3) * recencyWeight;
  });
  const denominator = logs.reduce((sum, _, idx) => sum + (logs.length - idx), 0);
  return weighted.reduce((a, b) => a + b, 0) / denominator;
};

const scoreToMood = (score) => {
  const bucket = SCORE_TO_MOOD.find((item) => score <= item.max);
  return bucket ? bucket.mood : "neutral";
};

const predictNextDayMood = async (userId) => {
  const today = toStartOfDay(new Date());
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const recentMoodLogs = await MoodLog.find({ userId }).sort({ date: -1 }).limit(14);

  const recentLogsChronological = [...recentMoodLogs].reverse();
  const baseScore = weightedMoodScore(recentLogsChronological);

  const cycleContext = await getEstimatedCycleContext(userId, tomorrow);
  const phaseAdjustment =
    cycleContext.cyclePhase === "unknown" ? 0 : PHASE_MOOD_ADJUSTMENT[cycleContext.cyclePhase] || 0;

  const finalScore = Math.max(1, Math.min(5, Number((baseScore + phaseAdjustment).toFixed(2))));
  const predictedMood = scoreToMood(finalScore);

  const suggestions = [
    ...(SUGGESTIONS[predictedMood] || SUGGESTIONS.neutral),
    cycleContext.cyclePhase !== "unknown"
      ? PHASE_TIPS[cycleContext.cyclePhase]
      : "Add at least 7 days of period logs for better cycle-aware predictions.",
  ];

  return {
    targetDate: tomorrow,
    predictedMood,
    predictedMoodScore: finalScore,
    factors: {
      recentMoodLogsUsed: recentMoodLogs.length,
      baseMoodScore: Number(baseScore.toFixed(2)),
      cyclePhase: cycleContext.cyclePhase,
      cycleDay: cycleContext.cycleDay,
      phaseAdjustment,
      averageCycleLength: cycleContext.averageCycleLength,
    },
    suggestions,
  };
};

const getDailyTips = async (userId) => {
  const today = toStartOfDay(new Date());
  const cycleContext = await getEstimatedCycleContext(userId, today);
  const phase = cycleContext.cyclePhase || "unknown";
  
  return {
    cyclePhase: phase,
    tips: CATEGORIZED_PHASE_TIPS[phase] || CATEGORIZED_PHASE_TIPS.unknown
  };
};

module.exports = { predictNextDayMood, getDailyTips };
