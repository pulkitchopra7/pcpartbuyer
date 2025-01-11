const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const email = require("./../utils/email");
const crypto = require("crypto");

const createSendJWT = (user, statusCode, req, res, message) => {
  //sign jwt
  user.password = undefined;
  const id = user._id;
  const token = jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN + "h",
  });

  //send jwt via cookie
  res.cookie("jwt", token, {
    maxAge: process.env.JWT_EXPIRES_IN * 3600 * 1000,
    httpOnly: true,
    https: req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: user,
  });
};

module.exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    DOB: req.body.DOB,
    password: req.body.password,
    address:req.body.address
  });

  createSendJWT(newUser, 201, req, res, "Signup successful");
});

module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError(400, "Please provide email and password"));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.isPasswordMatch(req.body.password, user.password)))
    return next(new AppError(401, "Error: Wrong username/password"));

  createSendJWT(user, 200, req, res, "Login successful");
});

module.exports.logout = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
};

module.exports.protect = catchAsync(async (req, res, next) => {
  //check if user has jwt
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError(401, "You are not logged in"));

  //check if jwt is valid
  const { id, iat } = jwt.verify(token, process.env.JWT_KEY);

  //check if user exists
  const user = await User.findById(id);
  if (!user)
    return next(new AppError(401, "No user found with the provided token"));

  //check if user password has changed after jwt got issued
  if (user.isPasswordChangedAfter(iat))
    next(new AppError(401, "Token Expired"));

  req.user = user;
  // res.locals.user = user;
  next();
});

module.exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // as of now enum roles ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You dont have permissions for this action")
      );
    }

    next();
  };
};

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  //user is coming from protected route, so check if currentpassword is correct
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.isPasswordMatch(req.body.currentPassword, user.password)))
    return next(new AppError(401, "Current password is wrong"));

  //if currentPassword is correct then update password
  user.password = req.body.newPassword;
  await user.save();

  createSendJWT(user, 200, req, res, "Password updated successfully");
});

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  //check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, "No user found with this email"));
  }
  //create a reset token and link
  const token = user.createPasswordResetToken();
  const baseUrl =
    process.env.FRONTEND_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const link = `${baseUrl}/resetPassword/${token}`;

  try {
    await email({
      to: user.email,
      subject: "Password reset link",
      html: `click this <a href="${link}">link</a>, valid for 10 minutes`,
    });
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Reset token send to mail",
    });
  } catch (err) {
    next(new AppError(500, "Error sending email, try again later"));
  }
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
  //check if user has send token
  //convert token to hash

  if (!req.params.token)
    return next(new AppError(400, "provide token to reset password"));

  const tokenHash = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //check if user exists with such token and token is valid
  const user = await User.findOne({ passwordResetToken: tokenHash }).select(
    "+password +passwordResetTokenExpires"
  );

  if (!user || Date.now() > user.passwordResetTokenExpires)
    return next(new AppError(400, "Invalid/Expired token"));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  createSendJWT(user, 200, req, res, "Password changed successfully");
});
