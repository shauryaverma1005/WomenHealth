const mongoose = require("mongoose");

const ALLOWED_MOODS = [
  "very_sad",
  "sad",
  "neutral",
  "happy",
  "very_happy",
  "anxious",
  "stressed",
  "calm",
  "irritable",
];

const moodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mood: {
      type: String,
      enum: ALLOWED_MOODS,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

moodLogSchema.index({ userId: 1, date: -1 });
moodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MoodLog", moodLogSchema);
