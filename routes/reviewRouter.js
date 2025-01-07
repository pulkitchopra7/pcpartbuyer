const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("./../controllers/authController");

const Router = express.Router({ mergeParams: true });

Router.route("/")
  .get(reviewController.getAllReviews)
  .post(authController.protect, reviewController.createReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = Router;
