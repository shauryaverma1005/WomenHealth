const User = require("../../../models/User");
const ApiError = require("../../../utils/ApiError");
const { generateToken } = require("../../../utils/jwt");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  partnerId: user.partnerId,
  privacySettings: user.privacySettings,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signup = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "Email already in use");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const token = generateToken({ userId: user._id });
  return { token, user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({ userId: user._id });
  return { token, user: sanitizeUser(user) };
};

module.exports = { signup, login };
