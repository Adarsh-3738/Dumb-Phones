
import logger from "../../utils/logger.js";
import STATUS_CODES from "../../utils/statusCodes.js";
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






// LOAD DASHBOARD
export const loadDashboard = async (req, res) => {
  try {
    if (!req.session.admin) {
      logger.warn("Unauthorized dashboard access attempt");
      return res.redirect("/admin/login");
    }

    // Data Aggregation for Dashboard

    const salesReportQuery = {
      $or: [
        { status: { $in: ["Delivered", "Returned"] } },
        { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
      ]
    };

    //  Total Revenue (sum of finalAmount for Delivered orders, excluding Returned orders)
    const revenueAggregation = await Order.aggregate([
      { $match: salesReportQuery },
      { $group: { _id: null, totalRevenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    //  Counts
    const salesCount = await Order.countDocuments(salesReportQuery);
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
          createdOn: { 
            $gte: new Date(`${currentYear}-01-01`), 
            $lte: new Date(`${currentYear}-12-31`) 
          },
          $or: [
            { status: { $in: ["Delivered", "Returned"] } },
            { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
          ]
        } 
      },
      {
        $group: {
          _id: { $month: "$createdOn" },
          revenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } }
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

    // Top 10 Best Selling Products
    const topProducts = await Order.aggregate([
      { $match: { status: { $nin: ["Cancelled", "Returned", "Payment Failed"] } } },
      { $unwind: "$orderedItems" },
      { $match: { "orderedItems.itemStatus": { $nin: ["Cancelled", "Returned"] } } },
      { $group: { _id: "$orderedItems.product", totalSold: { $sum: "$orderedItems.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          name: "$productInfo.productName",
          totalSold: 1
        }
      }
    ]);

    // Top 10 Best Selling Categories
    const topCategories = await Order.aggregate([
      { $match: { status: { $nin: ["Cancelled", "Returned", "Payment Failed"] } } },
      { $unwind: "$orderedItems" },
      { $match: { "orderedItems.itemStatus": { $nin: ["Cancelled", "Returned"] } } },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      { $group: { _id: "$productInfo.category", totalSold: { $sum: "$orderedItems.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          name: "$categoryInfo.name",
          totalSold: 1
        }
      }
    ]);

    // Top 10 Best Selling Brands
    const topBrands = await Order.aggregate([
      { $match: { status: { $nin: ["Cancelled", "Returned", "Payment Failed"] } } },
      { $unwind: "$orderedItems" },
      { $match: { "orderedItems.itemStatus": { $nin: ["Cancelled", "Returned"] } } },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      { $group: { _id: "$productInfo.brand", totalSold: { $sum: "$orderedItems.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandInfo"
        }
      },
      { $unwind: "$brandInfo" },
      {
        $project: {
          name: "$brandInfo.name",
          totalSold: 1
        }
      }
    ]);

    logger.info("Admin dashboard loaded", {
      adminId: req.session.admin.id,
    });

    res.render("admin/dashboard", {
      totalRevenue,
      salesCount,
      usersCount,
      productsCount,
      recentOrders,
      topProducts,
      topCategories,
      topBrands,
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
// FILTER CHART DATA (API Endpoint)
export const filterChartData = async (req, res) => {
  try {
    const filter = req.query.filter || 'monthly';
    let matchCondition = {
      $or: [
        { status: { $in: ["Delivered", "Returned"] } },
        { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
      ]
    };
    
    let labels = [];
    let data = [];

    if (filter === 'yearly') {
      const currentYear = new Date().getFullYear();
      matchCondition.createdOn = { 
        $gte: new Date(`${currentYear - 4}-01-01`), 
        $lte: new Date(`${currentYear}-12-31`) 
      };

      const yearlyRevenue = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $year: "$createdOn" },
            revenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      const baseYear = currentYear - 4;
      labels = Array.from({length: 5}, (_, i) => (baseYear + i).toString());
      data = new Array(5).fill(0);
      
      yearlyRevenue.forEach(item => {
        const index = item._id - baseYear;
        if (index >= 0 && index < 5) {
          data[index] = item.revenue;
        }
      });
    } else if (filter === 'weekly') {
      const today = new Date();
      const pastWeek = new Date(today);
      pastWeek.setDate(pastWeek.getDate() - 6);
      pastWeek.setHours(0, 0, 0, 0);

      matchCondition.createdOn = { 
        $gte: pastWeek, 
        $lte: today 
      };

      const weeklyRevenue = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $dayOfWeek: "$createdOn" },
            revenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } }
          }
        }
      ]);

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for(let i=6; i>=0; i--) {
        let d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(dayNames[d.getDay()]);
        
        let match = weeklyRevenue.find(r => r._id === (d.getDay() + 1));
        data.push(match ? match.revenue : 0);
      }
    } else {
      const currentYear = new Date().getFullYear();
      matchCondition.createdOn = { 
        $gte: new Date(`${currentYear}-01-01`), 
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) 
      };

      const monthlyRevenue = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $month: "$createdOn" },
            revenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } }
          }
        },
        { $sort: { "_id": 1 } }
      ]);

      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = new Array(12).fill(0);
      monthlyRevenue.forEach(item => {
        data[item._id - 1] = item.revenue;
      });
    }

    res.json({ success: true, labels, data });

  } catch (error) {
    logger.error("Chart filter error", { message: error.message, stack: error.stack });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching chart data" });
  }
};
