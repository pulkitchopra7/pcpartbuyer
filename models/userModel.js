const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name cant be empty"],
  },
  DOB: {
    type: Date,
    required: [true, "DOB is required"],
    validate: {
      validator: function (value) {
        // Calculate the age
        const currentDate = new Date();
        const ageDifMs = currentDate - value;
        const ageDate = new Date(ageDifMs); // miliseconds from epoch
        const age = Math.abs(ageDate.getUTCFullYear() - 1970); // Check if age is at least 13
        return age >= 13;
      },
      message: "User must be at least 13 years old.",
    },
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [validator.isEmail, "Invalid Email"],
  },
  password: {
    type: String,
    required: [true, "Account must have a password"],
    minLength: [8, "Password must be atleast 8 characters long"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordResetTokenExpires: {
    type: Date,
    select: false,
  },

  photo: {
    type: Boolean,
    default: false,
  },
  address: String,
  cart: [{ type: mongoose.Schema.ObjectId, ref: "Product" }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); //hash password if its modified

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 3000; //offsetting the possible delay in saving doc to db
  next();
});

userSchema.pre("save", function (next) {
  if (this.isModified("cart")) {
    // Use a Set to remove duplicates
    //mongoose.schema.objectId being object have different reference value pointing to same productId
    //in other words cart is an array of objects and objects cant be compared directly
    this.cart = [...new Set(this.cart.map((item) => item.toString()))];
    // console.log(this.cart);
    // this.cart = [...new Set(this.cart)];
  }

  next();
});

userSchema.methods.isPasswordChangedAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    let changeTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return changeTimeStamp > JWTTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  // console.log(
  //   `token: ${token} \nhashedToken: ${
  //     this.passwordResetToken
  //   } \ntokenExpires: ${this.passwordResetTokenExpires.getTime() / 1000}s`
  // );
  return token;
};

userSchema.methods.isPasswordMatch = async (candidatePass, hashedPass) => {
  return await bcrypt.compare(candidatePass, hashedPass);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
