const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const reviewRouter = require("./reviewRouter");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.use("/:productId/reviews", reviewRouter);

router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    productController.uploadProductImage,
    productController.processImages,
    productController.createProduct
  );

router
  .route("/:productId")
  .get(productController.getProduct)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    productController.deleteProduct
  );

router
  .route("/:productId/cart")
  .post(authController.protect, userController.addToCart)
  .delete(authController.protect, userController.removeFromCart);

router.get(
  "/:productId/buy",
  authController.protect,
  orderController.getCheckoutSession
);

module.exports = router;
