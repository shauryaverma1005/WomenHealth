const asyncHandler = require("../../../utils/asyncHandler");
const ApiError = require("../../../utils/ApiError");
const authService = require("../services/authService");

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }

  const data = await authService.signup({ name, email, password });

  res.status(201).json({
    success: true,
    message: "Signup successful",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const data = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data,
  });
});

module.exports = { signup, login };
