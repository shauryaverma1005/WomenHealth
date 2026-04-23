const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const partnerService = require("../services/partnerService");

const sendRequest = asyncHandler(async (req, res) => {
  const { partnerEmail, permissions } = req.body;
  if (!partnerEmail) {
    throw new ApiError(400, "partnerEmail is required");
  }

  const data = await partnerService.sendPartnerRequest({
    requesterId: req.user.id,
    partnerEmail,
    permissions,
  });

  res.status(201).json({
    success: true,
    message: "Partner request sent successfully",
    data,
  });
});

const respondRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const data = await partnerService.respondToPartnerRequest({
    requesterId: req.user.id,
    requestId: req.params.requestId,
    action,
  });

  res.status(200).json({
    success: true,
    message: `Partner request ${action === "accept" ? "accepted" : "rejected"} successfully`,
    data,
  });
});

const updatePermissions = asyncHandler(async (req, res) => {
  const { partnerId, permissions } = req.body;
  if (!partnerId || !permissions) {
    throw new ApiError(400, "partnerId and permissions are required");
  }

  const data = await partnerService.updatePermissions({
    requesterId: req.user.id,
    partnerId,
    permissions,
  });

  res.status(200).json({
    success: true,
    message: "Partner permissions updated successfully",
    data,
  });
});

const getIncomingRequests = asyncHandler(async (req, res) => {
  const data = await partnerService.getIncomingRequests(req.user.id);

  res.status(200).json({
    success: true,
    message: "Incoming partner requests fetched successfully",
    data,
  });
});

const getSharedData = asyncHandler(async (req, res) => {
  const data = await partnerService.getSharedDataForPartner(req.user.id);

  res.status(200).json({
    success: true,
    message: "Shared partner data fetched successfully",
    data,
  });
});

const getMyAccess = asyncHandler(async (req, res) => {
  const PartnerAccess = require("../../../models/PartnerAccess");
  const access = await PartnerAccess.findOne({ userId: req.user.id }).populate("partnerId", "name email");

  res.status(200).json({
    success: true,
    data: access || null,
  });
});

const disconnect = asyncHandler(async (req, res) => {
  await partnerService.disconnectPartner(req.user.id);
  res.status(200).json({
    success: true,
    message: "Partner completely disconnected successfully.",
  });
});

const setQuickStatus = asyncHandler(async (req, res) => {
  const User = require("../../../models/User");
  const { status } = req.body;
  
  if (status === undefined) {
    throw new ApiError(400, "status text is required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { "quickStatus.text": status, "quickStatus.updatedAt": new Date() } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Partner quick status updated.",
    data: updatedUser.quickStatus,
  });
});

module.exports = {
  sendRequest,
  respondRequest,
  updatePermissions,
  getIncomingRequests,
  getSharedData,
  getMyAccess,
  disconnect,
  setQuickStatus,
};
