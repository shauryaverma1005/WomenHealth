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

const partnerAccessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

partnerAccessSchema.index({ userId: 1, partnerId: 1 }, { unique: true });
partnerAccessSchema.index({ partnerId: 1 });

module.exports = mongoose.model("PartnerAccess", partnerAccessSchema);
