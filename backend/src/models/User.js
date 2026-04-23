const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const privacySettingsSchema = new mongoose.Schema(
  {
    shareMood: { type: Boolean, default: false },
    shareCycle: { type: Boolean, default: false },
    shareHydration: { type: Boolean, default: false },
    sharePredictions: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    privacySettings: {
      type: privacySettingsSchema,
      default: () => ({}),
    },
    quickStatus: {
      text: {
        type: String,
        default: "",
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ partnerId: 1 });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
