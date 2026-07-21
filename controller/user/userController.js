import {
  findUserByEmail,
  createUser,
  getUserById,
  generateOtp,
  sendOtpEmail,
  comparePassword,
  getProducts,
  getBrandsAndCategories,
  getShopProducts,
  generateResetToken,
  getUserByResetToken,
  resetUserPassword,
} from "../../services/user/userService.js";
import { validateSignup } from "../../helpers/validators.js";
import logger from "../../utils/logger.js";
import User from "../../models/userSchema.js";
import STATUS_CODES from "../../utils/statusCodes.js";

// PAGE NOT FOUND
export const pageNotFound = (req, res) => {
  logger.warn("User page not found", { url: req.originalUrl });
  res.render("user/page-404");
};

// HOME PAGE
export const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    const { search, sort, brand, category, price, page } = req.query;

    logger.info("Loading homepage", { query: req.query });

    const { products, totalPages } = await getProducts({
      search,
      sort,
      brandFilter: brand,
      categoryFilter: category,
      priceFilter: price,
      page: Number(page) || 1,
    });

    const { brands, categories } = await getBrandsAndCategories();

    const renderData = {
      products,
      brands,
      categories,
      search,
      sort,
      brand,
      category,
      price,
      currentPage: Number(page) || 1,
      totalPages,
    };

    if (user) {
      renderData.user = await getUserById(user._id);
    }

    res.render("user/home", renderData);
  } catch (error) {
    logger.error("Homepage error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Server error");
  }
};

// SHOP PAGE
export const loadShopPage = async (req, res) => {
  try {
    logger.info("Loading shop page", { query: req.query });

    const { search, sort, page } = req.query;

let { brand = [], category = [], price = [] } = req.query;

brand = Array.isArray(brand)
  ? brand
  : brand
  ? [brand]
  : [];

category = Array.isArray(category)
  ? category
  : category
  ? [category]
  : [];

price = Array.isArray(price)
  ? price
  : price
  ? [price]
  : [];

    const { products, brands, categories, totalPages } =
      await getShopProducts({
        search,
        sort,
        brand,
        category,
        price,
        page: Number(page),
      });

    console.log("Shop route - brands retrieved from DB:", brands);

    res.render("user/shop", {
      products,
      brands,
      categories,
      search,
      sort,
      brand,
      category,
      price,
      currentPage: Number(page) || 1,
      totalPages,
      user: req.session.user || req.user
    });
  } catch (error) {
    logger.error("Shop page error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("user/page-404");
  }
};

// SIGNUP /OTP
export const loadSignup = (req, res) => {
  logger.info("Loading signup page");
  const refCode = req.query.ref || "";
  res.render("user/signup", { refCode, message: null });
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    logger.info("User signup attempt", { email });

    const validationError = validateSignup(req.body);
    if (validationError) {
      logger.warn("Signup validation failed", { email, validationError });
      return res.render("user/signup", { message: validationError });
    }

    if (await findUserByEmail(email)) {
      logger.warn("Signup failed - user exists", { email });
      return res.render("user/signup", { message: "User already exists" });
    }

    const otp = generateOtp();
    const emailSent = await sendOtpEmail(email, otp);

   console.log("OTP for", email, ":", otp);

    if (!emailSent) {
      logger.error("OTP email sending failed", { email });
      return res.render("user/signup", { message: "Failed to send OTP" });
    }

    req.session.userOtp = otp;
    req.session.userData = { name, email, phone, password, referralCode };

    logger.info("OTP sent successfully", { email });

    res.render("user/verify-otp");
  } catch (error) {
    logger.error("Signup error", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/user/page-404");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (
      !req.session.userOtp ||
      otp !== req.session.userOtp.toString()
    ) {
      logger.warn("Invalid OTP attempt");
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Invalid OTP" });
    }

    const { name, email, phone, password, referralCode } = req.session.userData;

    await createUser({ name, email, phone, password, referralCode });

    logger.info("User created successfully", { email });

    delete req.session.userOtp;
    delete req.session.userData;

    res.json({ success: true, redirectUrl: "/login" });
  } catch (error) {
    logger.error("Verify OTP error", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Error verifying OTP" });
  }
};

// LOGIN / LOGOUT
export const loadLogin = (req, res) => {
  logger.info("Loading login page");

  const message = req.session.message;
  delete req.session.message; // Clear 

  res.render("user/login", { message });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("User login attempt", { email });

    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn("Login failed - user not found", { email });
      return res.render("user/login", { message: "User not found" });
    }

    if (user.isBlocked) {
      return res.render("user/login", {
        message: "Your account has been blocked by the administrator. Please contact support."
      });
    }
    
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logger.warn("Incorrect password attempt", { email });
      return res.render("user/login", { message: "Incorrect password" });
    }

    req.session.user = user;
    logger.info("User logged in successfully", { email });

    res.redirect("/");
  } catch (error) {
    logger.error("Login error", {
      message: error.message,
      stack: error.stack,
    });
    res.render("user/login", { message: "Login failed" });
  }
};

export const logout = (req, res) => {
  if (req.session) {
    delete req.session.user;
    delete req.session.passport;
    req.session.save((err) => {
      if (err) {
        logger.error("Logout session save failed", { err });
        return res.redirect("/pageerror");
      }
      logger.info("User logged out");
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
};

// FORGOT //RESET PASSWORD
export const loadForgotPassword = (req, res) => {
  logger.info("Loading forgot password page");
  res.render("user/forgot-password", { message: null });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info("Forgot password request", { email });

    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn("Forgot password - user not found", { email });
      return res.render("user/forgot-password", {
        message: "User not found",
      });
    }

    const token = await generateResetToken(user);

    logger.info("Password reset token generated", { email });

    res.render("user/forgot-password", {
      message: "Password reset link sent to email",
    });
  } catch (error) {
    logger.error("Forgot password error", {
      message: error.message,
      stack: error.stack,
    });
    res.render("user/forgot-password", {
      message: "Something went wrong",
    });
  }
};

export const loadResetPassword = (req, res) => {
  logger.info("Loading reset password page");
  res.render("user/reset-password", {
    token: req.params.token,
    message: null,
  });
};

export const resetPassword = async (req, res) => {
  try {
    const { password, cPassword } = req.body;

    if (password !== cPassword) {
      logger.warn("Reset password mismatch");
      return res.render("user/reset-password", {
        token: req.params.token,
        message: "Passwords do not match",
      });
    }

    const user = await getUserByResetToken(req.params.token);
    if (!user) {
      logger.warn("Invalid or expired reset token");
      return res.send("Token invalid or expired");
    }

    await resetUserPassword(user, password);

    logger.info("Password reset successful", { userId: user._id });

    // Render the page with a success message to trigger SweetAlert 
    res.render("user/reset-password", {
      token: req.params.token,
      message: "Password reset successful"
    });
  } catch (error) {
    logger.error("Reset password error", {
      message: error.message,
      stack: error.stack,
    });
    res.send("Something went wrong");
  }
};


//resend otp
export const resendOtp = async (req, res) => {
  try {

    if (!req.session.userData) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Session expired. Please signup again."
      });
    }

    const { email } = req.session.userData;

    const otp = generateOtp();

    req.session.userOtp = otp;

    console.log("Resent OTP:", otp);

    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send OTP"
      });
    }

    res.json({ success: true });

  } catch (error) {

    logger.error("Resend OTP error", {
      message: error.message,
      stack: error.stack
    });

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error resending OTP"
    });
  }
};

// CHECK BLOCK STATUS DYNAMICALLY
export const checkStatus = async (req, res) => {
  try {
    const loggedInUser = req.user || req.session?.user;
    if (!loggedInUser) {
      return res.json({ blocked: false, loggedIn: false });
    }

    const user = await User.findById(loggedInUser._id || loggedInUser);
    if (!user || user.isBlocked) {
      const finishLogout = () => {
        if (req.session) {
          delete req.session.user;
          delete req.session.passport;
          req.session.message = "Your account has been blocked by the administrator.";
          return req.session.save(() => {
            return res.json({ blocked: true, message: req.session.message });
          });
        }
        return res.json({ blocked: true, message: "Your account has been blocked by the administrator." });
      };

      if (req.logout) {
        const adminSession = req.session ? req.session.admin : null;
        return req.logout({ keepSessionInfo: true }, (err) => {
          if (err) logger.error("Passport logout error in checkStatus", err);
          if (req.session && adminSession) {
             req.session.admin = adminSession;
          }
          finishLogout();
        });
      } else {
        return finishLogout();
      }
    }

    return res.json({ blocked: false, loggedIn: true });
  } catch (error) {
    logger.error("Check status error", {
      message: error.message,
      stack: error.stack
    });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};