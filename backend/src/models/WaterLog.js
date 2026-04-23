const mongoose = require("mongoose");

const waterLogSchema = new mongoose.Schema(
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
    intake: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
    },
  },
  { timestamps: true }
);

waterLogSchema.index({ userId: 1, date: -1 });
waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WaterLog", waterLogSchema);
