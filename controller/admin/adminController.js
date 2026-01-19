import { findAdminByEmail, comparePassword } from "../../services/admin/authService.js";
import logger from "../../utils/logger.js";

// PAGE ERROR
export const pageerror = async (req, res) => {
  logger.warn("Admin error page accessed");
  res.render("admin-error");
};

// LOAD LOGIN PAGE
export const loadLogin = (req, res) => {
  if (req.session.admin) {
    logger.info("Admin already logged in, redirecting to dashboard", {
      adminId: req.session.admin.id,
    });
    return res.redirect("/admin/dashboard");
  }

  logger.info("Admin login page loaded");
  res.render("admin/login", { message: null });
};

// ADMIN LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Admin login attempt", { email });

    const admin = await findAdminByEmail(email);
    if (!admin) {
      logger.warn("Admin login failed: email not found", { email });
      return res.redirect("/admin/login");
    }

    const passwordMatch = await comparePassword(password, admin.password);
    if (!passwordMatch) {
      logger.warn("Admin login failed: incorrect password", { email });
      return res.redirect("/admin/login");
    }

    // Save admin session
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

// LOAD DASHBOARD
export const loadDashboard = async (req, res) => {
  try {
    if (!req.session.admin) {
      logger.warn("Unauthorized dashboard access attempt");
      return res.redirect("/admin/login");
    }

    logger.info("Admin dashboard loaded", {
      adminId: req.session.admin.id,
    });

    res.render("admin/dashboard");
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

    req.session.destroy((err) => {
      if (err) {
        logger.error("Error destroying admin session", {
          adminId,
          error: err.message,
        });
        return res.redirect("/pageerror");
      }

      logger.info("Admin logged out successfully", { adminId });
      res.redirect("/admin/login");
    });
  } catch (error) {
    logger.error("Unexpected logout error", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/pageerror");
  }
};
