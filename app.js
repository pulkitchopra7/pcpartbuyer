const express = require("express");
const app = express();

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const cookieParser = require("cookie-parser");
const path = require("path");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRouter.js");
const productRouter = require("./routes/productRouter.js");
const orderController = require("./controllers/orderController.js");

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  orderController.webhookCheckout
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://sdk.cashfree.com"],
      frameSrc: [
        "'self'",
        "https://sdk.cashfree.com",
        "https://sandbox.cashfree.com",
      ],
      formAction: ["'self'", "https://sandbox.cashfree.com"],
    },
  })
);

const limiter = rateLimit({
  max: 1000,
  windowMs: 30 * 60 * 1000,
  message: "Too many requests",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "frontend")));

//api

app.use("/api/v1/user", userRouter);
app.use("/api/v1/products", productRouter);

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});
app.use((req, res, next) => {
  next(
    new AppError(400, `Couldnt find requested resource: ${req.originalUrl}`)
  );
});
app.use(globalErrorHandler);
module.exports = app;
