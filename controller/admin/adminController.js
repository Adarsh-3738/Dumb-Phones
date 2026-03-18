
import logger from "../../utils/logger.js";
import Order from "../../models/orderSchema.js";
import User from "../../models/userSchema.js";
import Product from "../../models/productSchema.js";
import {
  findAdminByEmail,
  generateOtp,
  sendOtpEmail,
  comparePassword,
  generateResetToken,
  getUserByResetToken,
  resetUserPassword,
} from "../../services/admin/authService.js";
// PAGE ERROR
export const pageerror = async (req, res) => {
  logger.warn("Admin error page accessed");
  res.render("admin-error");
};

export const loadLogin = (req, res) => {
  const error = req.session.error || null;
  req.session.error = null; // clear after reading

  res.render("admin/login", { error });
};

// ADMIN LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Admin login attempt", { email });



    // VALIDATION 

    if (!email || !password) {
      logger.warn("Admin login failed: missing fields", { email });
      req.session.error = "Email and password are required";
      return res.redirect("/admin/login");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Admin login failed: invalid email format", { email });
      req.session.error = "Invalid email address";
      return res.redirect("/admin/login");
    }

    if (password.length < 6) {
      logger.warn("Admin login failed: password too short", { email });
      req.session.error = "Password must be at least 6 characters";
      return res.redirect("/admin/login");
    }

    //AUTH CHECK

    const admin = await findAdminByEmail(email);
    if (!admin) {
      logger.warn("Admin login failed: email not found", { email });
      req.session.error = "Invalid email or password";
      return res.redirect("/admin/login");
    }

    const passwordMatch = await comparePassword(password, admin.password);
    if (!passwordMatch) {
      logger.warn("Admin login failed: incorrect password", { email });
      req.session.error = "Invalid email or password";
      return res.redirect("/admin/login");
    }

    //SESSION 

    req.session.admin = {
      id: admin._id,
      email: admin.email,
    };

    logger.info("Admin login successful", {
      adminId: admin._id,
      email: admin.email,
    });

    return res.redirect("/admin/dashboard");

  } catch (error) {
    logger.error("Admin login error", {
      message: error.message,
      stack: error.stack,
    });
    return res.redirect("/pageerror");
  }
};

// FORGOT //RESET PASSWORD
export const loadForgotPassword = (req, res) => {
  logger.info("Loading forgot password page");
  res.render("admin/forgot-password", { message: null });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info("Forgot password request", { email });

    const user = await findAdminByEmail(email);
    if (!user) {
      logger.warn("Forgot password - user not found", { email });
      return res.render("admin/forgot-password", {
        message: "User not found",
      });
    }

    const token = await generateResetToken(user);

    logger.info("Password reset token generated", { email });

    res.render("admin/forgot-password", {
      message: "Password reset link sent to email",
    });
  } catch (error) {
    logger.error("Forgot password error", {
      message: error.message,
      stack: error.stack,
    });
    res.render("admin/forgot-password", {
      message: "Something went wrong",
    });
  }
};

export const loadResetPassword = (req, res) => {
  logger.info("Loading reset password page");
  res.render("admin/reset-password", {
    token: req.params.token,
    message: null,
  });
};

export const resetPassword = async (req, res) => {
  try {
    const { password, cPassword } = req.body;

    if (password !== cPassword) {
      logger.warn("Reset password mismatch");
      return res.render("admin/reset-password", {
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

    // Render the page with a success message to trigger SweetAlert instead of hard redirect
    res.render("admin/reset-password", {
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
      return res.status(400).json({
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
      return res.status(500).json({
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

    res.status(500).json({
      success: false,
      message: "Error resending OTP"
    });
  }
};






// LOAD DASHBOARD
export const loadDashboard = async (req, res) => {
  try {
    if (!req.session.admin) {
      logger.warn("Unauthorized dashboard access attempt");
      return res.redirect("/admin/login");
    }

    // Data Aggregation for Dashboard

    //  Total Revenue (sum of finalAmount for Delivered orders)
    const revenueAggregation = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, totalRevenue: { $sum: "$finalAmount" } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    //  Counts
    const salesCount = await Order.countDocuments();
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();

    //  Recent Orders (last 5)
    const recentOrders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdOn: -1 })
      .limit(5)
      .lean();

    //  Chart Data Monthly Revenue (Current Year)
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: "Delivered",
          createdOn: { 
            $gte: new Date(`${currentYear}-01-01`), 
            $lte: new Date(`${currentYear}-12-31`) 
          }
        } 
      },
      {
        $group: {
          _id: { $month: "$createdOn" },
          revenue: { $sum: "$finalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format for Chart.js (Array of 12 elements for Jan to Dec)
    const monthlyData = new Array(12).fill(0);
    monthlyRevenue.forEach(item => {
      monthlyData[item._id - 1] = item.revenue;
    });

    // 5. Chart Data Order Status Distribution
    const orderStatusData = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusLabels = [];
    const statusCounts = [];
    orderStatusData.forEach(item => {
      statusLabels.push(item._id);
      statusCounts.push(item.count);
    });

    logger.info("Admin dashboard loaded", {
      adminId: req.session.admin.id,
    });

    res.render("admin/dashboard", {
      totalRevenue,
      salesCount,
      usersCount,
      productsCount,
      recentOrders,
      monthlyData: JSON.stringify(monthlyData), // pass as JSON string for easy parsing in EJS script
      statusLabels: JSON.stringify(statusLabels),
      statusCounts: JSON.stringify(statusCounts)
    });
  } catch (error) {
    logger.error("Dashboard load error", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/pageerror");
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const adminId = req.session?.admin?.id;

    if (req.session) {
      delete req.session.admin;
      req.session.save((err) => {
        if (err) {
          logger.error("Error saving session on admin logout", {
            adminId,
            error: err.message,
          });
          return res.redirect("/pageerror");
        }

        logger.info("Admin logged out successfully", { adminId });
        res.redirect("/admin/login");
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    logger.error("Unexpected logout error", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/pageerror");
  }
};
