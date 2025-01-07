const mongoose = require("mongoose");
const Product = require("./productModel");

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "A review shouldnt be empty"],
  },
  rating: {
    type: Number,
    required: [true, "A review must have rating"],
    min: [1, "A review should have rating of atleast 1"],
    max: [5, "A review can have max rating of 5"],
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Review must belong to a product"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review cant be anonymous"],
  },
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // so that user can only review once for every product

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

reviewSchema.statics.calcAverageRating = async function (productId) {
  //since its a static method, this points to model
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRatings: { $sum: 1 },
        avgRatings: { $avg: "$rating" },
      },
    },
  ]);

  //write results to product doc
  //if stats.length>0 only then save results otherwise default ratings to 0

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      nRatings: stats[0].nRatings,
      avgRatings: stats[0].avgRatings.toFixed(2),
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      nRatings: 0,
      avgRatings: 0,
    });
  }
};

reviewSchema.post("save", function (_, next) {
  this.constructor.calcAverageRating(this.product);
  next();
});

//to update review stats of a product when review gets updated/deleted
reviewSchema.post(/^findOneAnd/, function (doc, next) {
  //if an attempt was made to delete doc which didnt existed in first place, then doc would be empty!
  if (doc) doc.constructor.calcAverageRating(doc.product);

  next();
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
