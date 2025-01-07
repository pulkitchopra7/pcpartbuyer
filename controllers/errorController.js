const fs = require("fs").promises;
// const path = require("path");
const AppError = require("./../utils/AppError");

const handleValidationError = (err, req) => {
  const msg =
    Object.values(err.errors)
      .map((obj) => obj.message)
      .join(". ") + ".";

  //cleanup any uploads
  req.body?.images?.map((file) => {
    fs.unlink(`public/img/products/${file}`).catch((err) => {
      console.error(`Couldnt delete file: ${file}\n`, err);
    });
  });
  return new AppError(400, msg);
};

const handleDuplicateKeyError = (err) => {
  const msg = Object.values(err.keyValue) + " already exists"; //prone to fail in case err.keyValue lists multiple duplicate values
  return new AppError(400, msg);
};
const handleJWTError = () => {
  return new AppError(401, "Invalid Token");
};
const handleJWTExpiredError = () => {
  return new AppError(401, "Your token has expired. Log in again");
};
const handleCastError = () => {
  return new AppError(400, "Cast Error");
};
const sendErrDev = (OriginalErr, error, req, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    OriginalErr,
    stack: error.stack,
  });
};
const sendErrProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error(`Error Occurred for route: ${req.originalUrl} \n`, err);
    res.status(500).json({
      status: "Error",
      message: "Oops! Somthing went wrong!",
    });
  }
};

module.exports = (OriginalErr, req, res, next) => {
  //global err handler
  let error = { ...OriginalErr };

  error.message = OriginalErr.message;
  error.statusCode = error.statusCode || 500; //internal server err if err isnt identified as operational
  error.status = error.status || "Error"; // assuming error to be server side

  if (OriginalErr.name === "ValidationError")
    error = handleValidationError(OriginalErr, req);
  if (OriginalErr.code === 11000) error = handleDuplicateKeyError(OriginalErr);
  if (OriginalErr.name === "JsonWebTokenError") error = handleJWTError();
  if (OriginalErr.name === "TokenExpiredError") error = handleJWTExpiredError();
  if (OriginalErr.name === "CastError") error = handleCastError();

  if (process.env.NODE_ENV !== "production") {
    //considering default environment as development or similar config
    sendErrDev(OriginalErr, error, req, res);
  } else {
    sendErrProd(error, req, res);
  }
  // res.end("Error Occured");

  next();
};
