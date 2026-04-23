const mongoose = require("mongoose");

const periodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { timestamps: true }
);

periodLogSchema.index({ userId: 1, startDate: -1 });
periodLogSchema.index({ userId: 1, endDate: -1 });

module.exports = mongoose.model("PeriodLog", periodLogSchema);
