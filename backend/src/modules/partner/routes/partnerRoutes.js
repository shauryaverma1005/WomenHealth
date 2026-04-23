const express = require("express");
const {
  sendRequest,
  respondRequest,
  updatePermissions,
  getIncomingRequests,
  getSharedData,
  getMyAccess,
  disconnect,
  setQuickStatus,
} = require("../controllers/partnerController");

const router = express.Router();

router.post("/request", sendRequest);
router.get("/requests/incoming", getIncomingRequests);
router.patch("/request/:requestId/respond", respondRequest);
router.patch("/permissions", updatePermissions);
router.get("/shared-data", getSharedData);
router.get("/my-access", getMyAccess);
router.delete("/disconnect", disconnect);
router.patch("/quick-status", setQuickStatus);

module.exports = router;
