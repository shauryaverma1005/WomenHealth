const User = require("../../../models/User");
const MoodLog = require("../../../models/MoodLog");
const WaterLog = require("../../../models/WaterLog");
const PeriodLog = require("../../../models/PeriodLog");
const PartnerAccess = require("../../../models/PartnerAccess");
const PartnerRequest = require("../../../models/PartnerRequest");
const ApiError = require("../../../utils/ApiError");

const normalizePermissions = (permissions = {}) => ({
  mood: Boolean(permissions.mood),
  cycle: Boolean(permissions.cycle),
  hydration: Boolean(permissions.hydration),
  predictions: Boolean(permissions.predictions),
  tips: Boolean(permissions.tips),
});

const sendPartnerRequest = async ({ requesterId, partnerEmail, permissions }) => {
  const normalizedEmail = partnerEmail.trim().toLowerCase();
  const partner = await User.findOne({ email: normalizedEmail });

  if (!partner) {
    throw new ApiError(404, "Partner user not found");
  }
  if (String(partner._id) === String(requesterId)) {
    throw new ApiError(400, "You cannot send request to yourself");
  }

  const existingPending = await PartnerRequest.findOne({
    fromUserId: requesterId,
    toUserId: partner._id,
    status: "pending",
  });
  if (existingPending) {
    throw new ApiError(409, "Partner request already pending");
  }

  const request = await PartnerRequest.create({
    fromUserId: requesterId,
    toUserId: partner._id,
    permissions: normalizePermissions(permissions),
  });

  return request;
};

const respondToPartnerRequest = async ({ requesterId, requestId, action }) => {
  const request = await PartnerRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Partner request not found");
  }
  if (String(request.toUserId) !== String(requesterId)) {
    throw new ApiError(403, "You are not allowed to respond to this request");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Partner request already processed");
  }

  if (!["accept", "reject"].includes(action)) {
    throw new ApiError(400, "action must be either accept or reject");
  }

  request.status = action === "accept" ? "accepted" : "rejected";
  request.respondedAt = new Date();
  await request.save();

  if (action === "accept") {
    const fromUser = await User.findById(request.fromUserId);
    const toUser = await User.findById(request.toUserId);

    if (!fromUser || !toUser) {
      throw new ApiError(404, "One or both users were not found");
    }

    fromUser.partnerId = toUser._id;
    toUser.partnerId = fromUser._id;
    await Promise.all([fromUser.save(), toUser.save()]);

    await PartnerAccess.findOneAndUpdate(
      { userId: fromUser._id, partnerId: toUser._id },
      { $set: { permissions: request.permissions } },
      { upsert: true, new: true }
    );
  }

  return request;
};

const updatePermissions = async ({ requesterId, partnerId, permissions }) => {
  const normalized = normalizePermissions(permissions);

  const partner = await User.findById(partnerId);
  if (!partner) {
    throw new ApiError(404, "Partner not found");
  }

  const access = await PartnerAccess.findOneAndUpdate(
    { userId: requesterId, partnerId },
    { $set: { permissions: normalized } },
    { new: true, upsert: true }
  );

  return access;
};

const getIncomingRequests = async (requesterId) => {
  return PartnerRequest.find({ toUserId: requesterId, status: "pending" })
    .populate("fromUserId", "name email")
    .sort({ createdAt: -1 });
};

const getSharedDataForPartner = async (requesterId) => {
  const access = await PartnerAccess.findOne({ partnerId: requesterId }).populate(
    "userId",
    "name email quickStatus"
  );

  if (!access) {
    throw new ApiError(404, "No partner sharing settings found for this account");
  }

  const sharedData = {
    sharedBy: access.userId,
    permissions: access.permissions,
    moodLogs: [],
    periodLogs: [],
    waterLogs: [],
  };

  const tasks = [];
  if (access.permissions.mood) {
    tasks.push(
      MoodLog.find({ userId: access.userId._id }).sort({ date: -1 }).limit(30).then((data) => {
        sharedData.moodLogs = data;
      })
    );
  }
  if (access.permissions.cycle) {
    tasks.push(
      PeriodLog.find({ userId: access.userId._id })
        .sort({ startDate: -1 })
        .limit(12)
        .then((data) => {
          sharedData.periodLogs = data;
        })
    );
  }
  if (access.permissions.hydration) {
    tasks.push(
      WaterLog.find({ userId: access.userId._id }).sort({ date: -1 }).limit(30).then((data) => {
        sharedData.waterLogs = data;
      })
    );
  }

  await Promise.all(tasks);
  return sharedData;
};

const disconnectPartner = async (requesterId) => {
  const user = await User.findById(requesterId);
  if (!user || !user.partnerId) {
    throw new ApiError(400, "No active partner connection exists.");
  }

  const partnerId = user.partnerId;
  const partnerUser = await User.findById(partnerId);

  user.partnerId = null;
  if (partnerUser) {
    partnerUser.partnerId = null;
    await partnerUser.save();
  }
  await user.save();

  await PartnerAccess.deleteMany({
    $or: [
      { userId: requesterId, partnerId },
      { userId: partnerId, partnerId: requesterId }
    ]
  });

  return { success: true };
};

module.exports = {
  sendPartnerRequest,
  respondToPartnerRequest,
  updatePermissions,
  getIncomingRequests,
  getSharedDataForPartner,
  disconnectPartner,
};
