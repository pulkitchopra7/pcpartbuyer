const AppError = require("../utils/AppError");
const Review = require("./../models/reviewModel");
const catchAsync = require("./../utils/catchAsync");

module.exports.createReview = catchAsync(async (req, res, next) => {
  //user is authenticated already hence req obj should have user on it

  // create and save doc
  const review = new Review({
    review: req.body.review,
    rating: req.body.rating,
    user: req.user._id,
    product: req.params.productId,
  });

  await review.save();

  res.status(201).json({
    status: "success",
    data: review,
    message: "Review added successfully",
  });
});

//its a protected route, expecting user info on req

//find review and edit
module.exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndUpdate(
    {
      user: req.user._id,
      product: req.params.productId,
    },
    {
      rating: req.body.rating,
      review: req.body.review,
    },
    {
      new: true,
    }
  );

  // if review doesnt exist then send error
  if (!review) next(new AppError(404, "couldnt find review"));

  res.status(200).json({
    status: "success",
    data: review,
    message: "Review updated successfully",
  });
});

module.exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndDelete({
    product: req.params.productId,
    user: req.user._id,
  });

  if (!review)
    return next(new AppError(404, "Couldnt find the review to be deleted"));

  res.status(204).json({
    status: "success",
  });
});

module.exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ product: req.params.productId });

  res.status(200).json({
    status: "success",
    length: reviews.length,
    data: reviews,
  });
});
