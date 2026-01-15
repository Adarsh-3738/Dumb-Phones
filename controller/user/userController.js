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
    res.status(500).send("Server error");
  }
};

// SHOP PAGE
export const loadShopPage = async (req, res) => {
  try {
    logger.info("Loading shop page", { query: req.query });

    const { search, sort, brand, category, price, page } = req.query;
    const { products, brands, categories, totalPages } =
      await getShopProducts({
        search,
        sort,
        brand,
        category,
        price,
        page: Number(page),
      });

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
    });
  } catch (error) {
    logger.error("Shop page error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).render("user/error");
  }
};

// SIGNUP + OTP
export const loadSignup = (req, res) => {
  logger.info("Loading signup page");
  res.render("user/signup");
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

    if (!emailSent) {
      logger.error("OTP email sending failed", { email });
      return res.render("user/signup", { message: "Failed to send OTP" });
    }

    req.session.userOtp = otp;
    req.session.userData = { name, email, phone, password };

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
        .status(400)
        .json({ success: false, message: "Invalid OTP" });
    }

    const { name, email, phone, password } = req.session.userData;

    await createUser({ name, email, phone, password });

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
      .status(500)
      .json({ success: false, message: "Error verifying OTP" });
  }
};

// LOGIN / LOGOUT
export const loadLogin = (req, res) => {
  logger.info("Loading login page");
  res.render("user/login", { message: null });
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
      logger.warn("Blocked user login attempt", { email });
      return res.render("user/login", { message: "User blocked" });
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
  req.session.destroy((err) => {
    if (err) {
      logger.error("Logout session destroy failed", { err });
      return res.redirect("/pageerror");
    }
    logger.info("User logged out");
    res.redirect("/");
  });
};

// FORGOT + RESET PASSWORD
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

    res.redirect("/login");
  } catch (error) {
    logger.error("Reset password error", {
      message: error.message,
      stack: error.stack,
    });
    res.send("Something went wrong");
  }
};
