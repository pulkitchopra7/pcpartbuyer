const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
    select: false,
  },
  products: [
    {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Product",
    },
  ],
  amountPaid: {
    type: Number,
    required: true,
  },
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "products",
    select: "name price images",
  });
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
