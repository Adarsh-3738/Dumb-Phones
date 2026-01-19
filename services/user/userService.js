import User from "../../models/userSchema.js";
import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// PASSWORD & OTP
export const hashPassword = async (password) => await bcrypt.hash(password, 10);
export const comparePassword = async (plainPassword, hashedPassword) => await bcrypt.compare(plainPassword, hashedPassword);

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// USER DB OPERATIONS
export const findUserByEmail = async (email) => await User.findOne({ email });
export const createUser = async ({ name, email, phone, password }) => {
  const hashedPassword = await hashPassword(password);
  const user = new User({ name, email, phone, password: hashedPassword });
  await user.save();
  return user;
};
export const getUserById = async (id) => await User.findById(id);

//PRODUCTS & SHOP
export const getProducts = async ({ search = "", sort = "", brandFilter = "", categoryFilter = "", priceFilter = "", page = 1, limit = 6 }) => {
  const query = {
    isBlocked: false,
    productName: { $regex: search, $options: "i" },
    ...(brandFilter && { brand: brandFilter }),
    ...(categoryFilter && { category: categoryFilter }),
  };

  if (priceFilter) {
    const [min, max] = priceFilter.split("-").map(Number);
    query.salesPrice = { $gte: min, $lte: max };
  }

  let productQuery = Product.find(query)
    .populate("brand")
    .populate("category")
    .skip((page - 1) * limit)
    .limit(limit);

  if (sort === "priceLowHigh") productQuery = productQuery.sort({ salesPrice: 1 });
  else if (sort === "priceHighLow") productQuery = productQuery.sort({ salesPrice: -1 });
  else productQuery = productQuery.sort({ createdAt: -1 });

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);
  const products = await productQuery;
  return { products, totalPages };
};

export const getBrandsAndCategories = async () => {
  const brands = await Brand.find({});
  const categories = await Category.find({});
  return { brands, categories };
};

//  SHOP PAGE
export const getShopProducts = async ({ search = "", sort = "", brand = "", category = "", price = "", page = 1, limit = 5 }) => {
  const filter = { isBlocked: false };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (price) {
    const [min, max] = price.split("-").map(Number);
    filter.salesPrice = { $gte: min, $lte: max };
  }
  if (search) filter.productName = { $regex: search, $options: "i" };

  let sortOption = {};
  if (sort === "priceLowHigh") sortOption.salesPrice = 1;
  if (sort === "priceHighLow") sortOption.salesPrice = -1;
  if (sort === "nameAZ") sortOption.productName = 1;
  if (sort === "nameZA") sortOption.productName = -1;

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  const products = await Product.find(filter)
    .populate("brand", "name")
    .populate("category", "name")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  const brands = await Brand.find({});
  const categories = await Category.find({});

  return { products, brands, categories, totalPages };
};

//PASSWORD RESET 
export const generateResetToken = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save();
  return token;
};

export const getUserByResetToken = async (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
};

export const resetUserPassword = async (user, newPassword) => {
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};
