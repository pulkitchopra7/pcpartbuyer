const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      unique: true,
    },
    category: {
      type: String,
      default: "Others",
    },
    description: {
      type: String,
      default: "No Description",
    },
    price: {
      type: Number,
      required: [true, "Product must have a price"],
    },
    images: [String],
    nRatings: Number,

    qty: {
      type: Number,
      default: 0,
      minimum: 0,
    },

    avgRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//creating virtual property on parent referencing reviews
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre("save", function (next) {
  if (this.category) this.category = this.category.toLowerCase();
  next();
});

productSchema.post("findOne", function (doc, next) {
  //if doc exists/(doc matched search criteria) and if doc doesnt contain any image then provide it with default image
  if (doc && !doc.images[0]) doc.images[0] = "default.jpeg";

  next();
});

productSchema.post("find", function (docs, next) {
  docs.forEach((doc) => {
    //if doc doesnt contain any image then provide it with default image
    if (!doc.images[0]) doc.images[0] = "default.jpeg";
  });

  next();
});

//add logic to delete reviews if product gets deleted!

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
