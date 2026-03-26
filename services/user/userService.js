import User from "../../models/userSchema.js";
import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import Variant from "../../models/variantSchema.js";
import Offer from "../../models/offerSchema.js";
import Coupon from "../../models/couponSchema.js";
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
export const createUser = async ({ name, email, phone, password, referralCode }) => {
  const hashedPassword = await hashPassword(password);
  const newReferalCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  
  const user = new User({ 
    name, 
    email, 
    phone, 
    password: hashedPassword,
    referalCode: newReferalCode
  });
  await user.save();

  // Handle provided referral code
  if (referralCode) {
    const referrer = await User.findOne({ referalCode: referralCode });
    if (referrer) {
      if (!referrer.redeemedUsers) referrer.redeemedUsers = [];
      referrer.redeemedUsers.push(user._id);
      await referrer.save();

      const activeReferralOffer = await Offer.findOne({ type: "Referral", status: "Active" });
      if (activeReferralOffer) {
        // Generate a new unique coupon for the referrer
        const uniqueCouponCode = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
        
        const newCoupon = new Coupon({
          name: uniqueCouponCode,
          expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
          offerPrice: activeReferralOffer.discountValue,
          minimumPrice: 0,
          userId: [referrer._id]
        });
        await newCoupon.save();
      }
    }
  }

  return user;
};
export const getUserById = async (id) => await User.findById(id);

//PRODUCTS & SHOP


export const getProducts = async ({
  search = "",
  sort = "",
  brandFilter = "",
  categoryFilter = "",
  priceFilter = "",
  page = 1,
  limit = 6,
}) => {
  const skip = (page - 1) * limit;

  // FILTER PRODUCTS 
  const productFilter = {
    isBlocked: false,
    ...(search && { productName: { $regex: search, $options: "i" } }),
    ...(brandFilter && { brand: brandFilter }),
    ...(categoryFilter && { category: categoryFilter }),
  };

  const products = await Product.find(productFilter)
    .populate("brand")
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // ATTACH DEFAULT VARIANT 
  for (const product of products) {
    const variant = await Variant.findOne({ productId: product._id })
      .sort({ salesPrice: 1 }) // cheapest variant first
      .lean();

    product.defaultVariant = variant || null;
  }

  // PRICE FILTER 
  let filteredProducts = products;

  if (priceFilter) {
    const [min, max] = priceFilter.split("-").map(Number);
    filteredProducts = filteredProducts.filter(
      p =>
        p.defaultVariant &&
        p.defaultVariant.salesPrice >= min &&
        p.defaultVariant.salesPrice <= max
    );
  }

  // SORT 
  if (sort === "priceLowHigh") {
    filteredProducts.sort(
      (a, b) => a.defaultVariant.salesPrice - b.defaultVariant.salesPrice
    );
  } else if (sort === "priceHighLow") {
    filteredProducts.sort(
      (a, b) => b.defaultVariant.salesPrice - a.defaultVariant.salesPrice
    );
  } else if (sort === "aToZ") {
    filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
  } else if (sort === "zToA") {
    filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
  }

  const totalProducts = await Product.countDocuments(productFilter);
  const totalPages = Math.ceil(totalProducts / limit);

  return { products: filteredProducts, totalPages };
};





export const getBrandsAndCategories = async () => {
  const brands = await Brand.find({}).lean();
  const categories = await Category.find({ isDeleted: false, isListed: true }).lean();
  return { brands, categories };
};

//  SHOP PAGE


export const getShopProducts = async ({
  search = "",
  sort = "",
  brand = "",
  category = "",
  price = "",
  page = 1,
}) => {
  const limit = 8;
  const currentPage = Math.max(parseInt(page) || 1, 1);
  const skip = (currentPage - 1) * limit;

  const productFilter = {
    isBlocked: false,
    ...(search && { productName: { $regex: search, $options: "i" } }),
    ...(brand && { brand }),
    ...(category && { category }),
  };

  const products = await Product.find(productFilter)
    .populate("brand", "name")
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Attach default variant 
  for (const product of products) {
    const variant = await Variant.findOne({ productId: product._id })
      .sort({ salesPrice: 1 })
      .lean();

    product.defaultVariant = variant || null;
  }

  // Price filter
  let filteredProducts = products;

  if (price) {
    const [min, max] = price.split("-").map(Number);
    filteredProducts = filteredProducts.filter(
      p =>
        p.defaultVariant &&
        p.defaultVariant.salesPrice >= min &&
        p.defaultVariant.salesPrice <= max
    );
  }

  // Sort 
  if (sort === "priceLowHigh") {
    filteredProducts.sort(
      (a, b) => a.defaultVariant.salesPrice - b.defaultVariant.salesPrice
    );
  } else if (sort === "priceHighLow") {
    filteredProducts.sort(
      (a, b) => b.defaultVariant.salesPrice - a.defaultVariant.salesPrice
    );
  } else if (sort === "aToZ") {
    filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
  } else if (sort === "zToA") {
    filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
  }

  const totalProducts = await Product.countDocuments(productFilter);
  const totalPages = Math.max(Math.ceil(totalProducts / limit), 1);

  const brands = await Brand.find({}).lean();
  const categories = await Category.find({ isDeleted: false, isListed: true }).lean();

  return {
    products: filteredProducts,
    brands,
    categories,
    totalPages,
  };
};

//PASSWORD RESET 
export const generateResetToken = async (user) => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // HASH token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save();

  const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;

  await sendResetEmail(user.email, resetUrl);

  return resetToken;
};

export const getUserByResetToken = async (token) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+password");  
};


export const resetUserPassword = async (user, newPassword) => {
  const hashed = await hashPassword(newPassword);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      password: hashed,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    },
    { new: true }
  );

  console.log("Updated password:", updatedUser.password);
};


//email sent link to forgot password
export const sendResetEmail = async (toEmail, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or SMTP service
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"DumbPhones" <${process.env.NODEMAILER_EMAIL}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click this link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};