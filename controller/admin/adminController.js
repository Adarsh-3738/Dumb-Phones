import { findAdminByEmail, comparePassword } from "../../services/admin/authService.js";
import logger from "../../utils/logger.js";

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
