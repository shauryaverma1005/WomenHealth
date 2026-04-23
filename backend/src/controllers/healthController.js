const asyncHandler = require("../utils/asyncHandler");

const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

const getProtectedProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed",
    data: { user: req.user },
  });
});

module.exports = { getHealth, getProtectedProfile };
