const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();
const Product = require("../../models/productSchema");
const { validateSignup } = require("../../helpers/validators");
const Brand = require("../../models/brandSchema"); 
const Category = require("../../models/categorySchema");
const crypto = require("crypto");

// PAGE NOT FOUND
const pageNotFound = async (req, res) => {
  try {
    res.render("user/page-404");
  } catch (error) {
    res.redirect("user/pageNotFound");
  }
};

// HOME PAGE

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    const search = req.query.search || "";
    const sort = req.query.sort || "";
    const brandFilter = req.query.brand || "";
    const categoryFilter = req.query.category || "";
    const priceFilter = req.query.price || "";
    const page = parseInt(req.query.page) || 1; // CURRENT PAGE
    const limit = 6; // PRODUCTS PER PAGE

    // Fetch brands and categories for filters
    const brands = await Brand.find({});
    const categories = await Category.find({});

    // Build query
    let query = {
      isBlocked: false,
      productName: { $regex: search, $options: "i" },
      ...(brandFilter && { brand: brandFilter }),
      ...(categoryFilter && { category: categoryFilter }),
    };

    if (priceFilter) {
      const [min, max] = priceFilter.split("-").map(Number);
      query.salesPrice = { $gte: min, $lte: max };
    }

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Find products with skip & limit for pagination
    let productQuery = Product.find(query)
      .populate("brand")
      .populate("category")
      .skip((page - 1) * limit)
      .limit(limit);

    // Apply sorting
    if (sort === "priceLowHigh") {
      productQuery = productQuery.sort({ salesPrice: 1 });
    } else if (sort === "priceHighLow") {
      productQuery = productQuery.sort({ salesPrice: -1 });
    } else {
      productQuery = productQuery.sort({ createdAt: -1 });
    }

    const products = await productQuery;

    const renderData = {
      products,
      search,
      sort,
      brands,
      brand: brandFilter,
      categories,
      category: categoryFilter,
      price: priceFilter,
      currentPage: page,        // PASS current page
      totalPages,               // PASS total pages
    };

    if (user) {
      const userData = await User.findById(user._id);
      renderData.user = userData;
    }

    return res.render("user/home", renderData);
  } catch (error) {
    console.log("Home page error", error);
    res.status(500).send("Server error");
  }
};




// LOAD SIGNUP
const loadSignup = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// OTP GENERATOR
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SEND OTP EMAIL
async function sendVerificationEmail(email, otp) {
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
    console.error("Error sending email", error);
    return false;
  }
}




// SIGNUP (SEND OTP)
const signup = async (req, res) => {
  try {
    const { name, phone, email, password, cPassword } = req.body;

    // 🔐 Backend validation
    const validationError = validateSignup(req.body);
    if (validationError) {
      return res.render("user/signup", { message: validationError });
    }

    // Check existing user
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("user/signup", {
        message: "User already exists with this email"
      });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.render("user/signup", {
        message: "Failed to send OTP. Please try again."
      });
    }

    // Store OTP & user data temporarily
    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password };

    console.log("OTP sent:", otp);

    return res.render("user/verify-otp");

  } catch (error) {
    console.error("Signup error", error);
    res.redirect("/user/page-404");
  }
};


// HASH PASSWORD
const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch {
        throw new Error("Password hashing failed");
    }
};

// VERIFY OTP
// VERIFY OTP
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.userOtp) {
      return res.json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otp !== req.session.userOtp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again",
      });
    }

    const user = req.session.userData;
    const passwordHash = await securePassword(user.password);

    const saveUserData = new User({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: passwordHash,
    });

    await saveUserData.save();

    // CLEAR SESSION TEMP DATA
    delete req.session.userOtp;
    delete req.session.userData;

    return res.json({
      success: true,
      redirectUrl: "/login",
    });

  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying OTP",
    });
  }
};

// RESEND OTP
const resendOtp = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.json({
                success: false,
                message: "Session expired. Please signup again.",
            });
        }

        const newOtp = generateOtp();
        req.session.userOtp = newOtp;

        const emailSent = await sendVerificationEmail(req.session.userData.email, newOtp);

        if (!emailSent) {
            return res.json({
                success: false,
                message: "Failed to resend OTP. Try again.",
            });
        }

        console.log("New OTP Sent:", newOtp);

        return res.json({
            success: true,
            message: "New OTP sent successfully!",
        });
    } catch (error) {
        console.log("Resend OTP error:", error);
        return res.json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const loadLogin = async (req,res)=>{
    try{
        if(!req.session.user){
            return res.render("user/login",{message: null });
        }
        else{
            res.redirect("/")
        }

    } catch(error){
       res.redirect("/pageNotFound") 
    }
}



const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ isAdmin: false, email });

    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("user/login", { message: "User is blocked by admin" });
    }

    // Google-only account protection
    if (findUser.googleId && !findUser.password) {
      return res.render("user/login", {
        message: "Please login using Google"
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("user/login", { message: "Incorrect password" });
    }

    // PASSPORT LOGIN (THIS IS THE KEY)
    req.login(findUser, (err) => {
      if (err) {
        console.error("req.login error:", err);
        return res.render("user/login", {
          message: "Login failed"
        });
      }

      return res.redirect("/");
    });

  } catch (error) {
    console.error("login error", error);
    return res.render("user/login", {
      message: "Login failed. Please try again later"
    });
  }
};



const logout = async (req,res)=>{
try {
req.session.destroy(err =>{
if(err){
console.log ("Error destroying session",err);
return res.redirect ("/pageerror");
}
res.redirect ("/");
})
}catch(error) {
console.log (("unexpected error during logout",error))

res. redirect ("/pageerror")
}}

//forgot password
const loadForgotPassword = (req, res) => {
  res.render("user/forgot-password", { message: null });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/forgot-password", {
        message: "User not found"
      });
    }

    // Block Google-only users
    if (user.googleId && !user.password) {
      return res.render("user/forgot-password", {
        message: "Please login using Google"
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    const resetLink = `http://localhost:3001/reset-password/${token}`;

    // TEMP: show link in console
    console.log("Password reset link:", resetLink);

    return res.render("user/forgot-password", {
      message: "Password reset link sent to your email"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.render("user/forgot-password", {
      message: "Something went wrong"
    });
  }
};

//reset password

const loadResetPassword = async (req, res) => {
  res.render("user/reset-password", {
    token: req.params.token,
    message: null
  });
};

const resetPassword = async (req, res) => {
  try {
    const { password, cPassword } = req.body;

    if (password !== cPassword) {
      return res.render("user/reset-password", {
        token: req.params.token,
        message: "Passwords do not match"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.send("Token invalid or expired");
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.redirect("/login");

  } catch (error) {
    console.error("Reset password error:", error);
    res.send("Something went wrong");
  }
};




module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  loadLogin,
  login,
  logout,
  loadForgotPassword,
  forgotPassword,
  loadResetPassword,
  resetPassword,
}
