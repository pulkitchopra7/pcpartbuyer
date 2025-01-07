const AppError = require("../utils/AppError");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage(); //its better to manipulate image in memory

const multerFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image"))
    cb(null, true); //accept if file upload is an image
  else cb(new AppError(400, "Only images are allowed to be uploaded"));
};
const upload = multer({ storage: multerStorage, fileFilter: multerFileFilter });
module.exports.uploadUserPhoto = upload.single("photo");

module.exports.resizePhoto = catchAsync(async (req, res, next) => {
  //check if file is uploaded by client
  // console.log(req.files);
  if (!req.file) return next();

  await sharp(req.file.buffer)
    .resize(500, 500, { fit: "fill" })
    .toFormat("jpeg")
    .toFile(`public/img/users/${req.user._id}.jpeg`);

  next();
});

module.exports.deleteMe = catchAsync(async (req, res, next) => {
  //user is already authenticated
  const user = await User.findByIdAndDelete(req.user._id);
  res.status(204).json({
    status: "success",
    data: user,
  });
});

module.exports.updateMe = catchAsync(async (req, res, next) => {
  //user is already authenticated and hence req.user._id is available

  //only update allowed fields
  const allowedFields = ["address", "name", "DOB"];

  const user = await User.findById(req.user._id);
  if (req.file) user.photo = true;
  allowedFields.forEach((el) => {
    if (req.body[el]) user[el] = req.body[el];
  });

  await user.save();

  res.status(200).json({
    status: "success",
    message: "update successful",
    data: user,
  });
});

module.exports.me = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
});

module.exports.addToCart = catchAsync(async (req, res, next) => {
  //its a protected route, req has user on it

  //find user in db, add item to cart

  const user = await User.findById(req.user._id);

  if (user.cart.length !== 10) {
    user.cart.push(req.params.productId);

    await user.save();

    res.status(201).json({
      status: "success",
      message: "Product added to cart successfully",
    });
  } else
    res.status(400).json({
      status: "fail",
      message: "cart full",
    });
});

module.exports.removeFromCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((el) => el.toString() !== req.params.productId);

  await user.save();
  res.status(200).json({
    status: "success",
    message: "Product removed from cart successfully",
  });
});
