const express = require("express");
const authController = require("../controllers/authController");
const userController = require("./../controllers/userController");
const orderController = require("../controllers/orderController");
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);
router.get("/me", userController.me);
router.patch("/updatePassword", authController.updatePassword);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizePhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);
router.get("/cartCheckout", orderController.getCheckoutSession);
router.get("/cartAndOrders", orderController.getCartAndOrders);

module.exports = router;
