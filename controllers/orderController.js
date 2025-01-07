const Product = require("../models/productModel");
const Order = require("./../models/orderModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { Cashfree } = require("cashfree-pg");

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

module.exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  let orders = [],
    order_tags = {},
    amt = 0,
    toEmptyCart = false;

  if (req.params.productId) {
    const product = await Product.findById(req.params.productId);
    orders = [
      { item_name: product.name, item_discounted_unit_price: product.price },
    ];
    order_tags = {
      1: req.params.productId,
    };
    amt = product.price;
  } else {
    const products = await Product.find({ _id: { $in: req.user.cart } });
    products.map((el, i) => {
      orders.push({ item_name: el.name, item_discounted_unit_price: el.price });
      amt += el.price;
      order_tags[`${i}`] = el._id.toString();
    });
    toEmptyCart = true;
    if (!amt)
      return res.status(400).json({ status: "fail", message: "cart is empty" });
    //empty cart while sending session use variable to decide for that before sending session
  }

  const request = {
    order_amount: amt,
    order_currency: "INR",
    customer_details: {
      //can be dummy but needed
      customer_id: req.user._id,
      customer_email: req.user.email,
      customer_phone: "9999999999",
    },
    cart_details: { cart_items: orders },
    order_tags,
  };

  Cashfree.PGCreateOrder("2022-09-01", request)
    .then((response) => {
      res.status(200).json({
        status: "success",
        sessionId: response.data.payment_session_id,
      });
      if (toEmptyCart) {
        User.findByIdAndUpdate(req.user._id, { cart: [] }).then();
      }
    })
    .catch((error) => {
      res.status(400).json({
        status: "fail",
        message: error.response.data.message,
      });
    });
});

module.exports.getCartAndOrders = catchAsync(async (req, res, next) => {
  //due to protect middleware we already have user but we still need to populate user's cart
  const user = await User.findById(req.user._id).populate({
    path: "cart",
    select: "name price images",
  });
  const orders = await Order.find({ user: user._id }).sort("-_id");
  const tmp = { ...req.user };

  const data = tmp._doc;
  data.cartDetails = user.cart;
  data.orders = orders;

  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports.webhookCheckout = catchAsync(async (req, res, next) => {
  if (
    Cashfree.PGVerifyWebhookSignature(
      req.headers["x-webhook-signature"],
      req.body,
      req.headers["x-webhook-timestamp"]
    )
  ) {
    const data = JSON.parse(req.body).data;
    const orderId = data.order.order_id;
    const user = data.customer_details.customer_id;
    const amountPaid = data.order.order_amount;
    const products = Object.values(data.order.order_tags);
    await Product.updateMany({ _id: { $in: products } }, { $inc: { qty: -1 } });
    // console.log(user, amount, products, orderId);

    const order = new Order({ orderId, user, amountPaid, products });
    await order.save();
  }
  next();
});
