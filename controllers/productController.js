const Product = require("./../models/productModel");
const apiFeatures = require("../utils/apiFeatures");
const fs = require("fs").promises;
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const multer = require("multer");
const sharp = require("sharp");
const slugify = require("slugify");

const multerStorage = multer.memoryStorage(); //so that we can manipulate images before saving them

const multerFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image"))
    cb(null, true); //accept if file upload is an image
  else cb(new AppError(400, "Only images are allowed to be uploaded"));
};

const upload = multer({ storage: multerStorage, fileFilter: multerFileFilter });

module.exports.uploadProductImage = upload.array("images", 15);

module.exports.processImages = catchAsync(async (req, res, next) => {
  //check if there is any upload handled by multer
  //   console.log(req.files);
  if (!req.files[0]) return next();

  //for each uploaded image, store the file name on DB, and the file on server
  req.body.images = [];

  await Promise.all(
    req.files.map(async (file, i) => {
      req.body.images.push(
        `${slugify(req.body.name, { lower: true })}-image-${i}.jpeg`
      );
      await sharp(file.buffer)
        .resize(500, 500, { fit: "fill" })
        .toFormat("jpeg")
        .toFile(`public/img/products/${req.body.images[i]}`); //fileName must be unique
    })
  );

  next();
});

module.exports.getAllProducts = catchAsync(async (req, res, next) => {
  //assuming query is simple, to fetch no of records as well as implementing pagination, preferring 2seperate queries instead of aggreagation pipeline

  //build query
  const countQuery = new apiFeatures(Product.find(), req.query);
  countQuery.filter().query.countDocuments();

  const productQuery = new apiFeatures(Product.find(), req.query);
  productQuery.filter().sort().paginate();

  const nRecords = await countQuery.query;
  const products = await productQuery.query;

  //   console.log(req.query);

  res.status(200).json({
    status: "success",
    data: products,
    nRecords,
  });
});

//add multer to upload images for createProduct Endpoint
module.exports.createProduct = catchAsync(async (req, res, next) => {
  //take only needed fields from body, create and then save new product

  const product = new Product({
    name: req.body.name,
    category: req.body.category, //?.toLowerCase(),
    price: req.body.price,
    description: req.body.description,
    images: req.body.images,
  });
  await product.save();

  res.status(201).json({
    status: "success",
    message: "new product added",
  });
});

module.exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.productId }).populate(
    "reviews"
  );
  res.status(200).json({
    status: "success",
    data: product,
  });
});

module.exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.productId);

  product?.images.forEach((file) => {
    fs.unlink(`public/img/products/${file}`).catch((err) => {
      console.error(`Couldnt delete file: ${file}\n`, err);
    });
  });

  res.status(204).json({
    status: "success",
  });
});
