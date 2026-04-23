const mongoose = require("mongoose");

const permissionsSchema = new mongoose.Schema(
  {
    mood: { type: Boolean, default: false },
    cycle: { type: Boolean, default: false },
    hydration: { type: Boolean, default: false },
    predictions: { type: Boolean, default: false },
    tips: { type: Boolean, default: false },
  },
  { _id: false }
);

const partnerRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

partnerRequestSchema.index({ fromUserId: 1, toUserId: 1, status: 1 });

module.exports = mongoose.model("PartnerRequest", partnerRequestSchema);
