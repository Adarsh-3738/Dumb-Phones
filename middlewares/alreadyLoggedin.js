// for easy login for already logged in user

import User from "../models/userSchema.js";
import logger from "../utils/logger.js";

const alreadyLoggedin = async (req, res, next) => {
  try {
    const loggedInUser = req.user || req.session?.user;
    if (loggedInUser || req.isAuthenticated?.()) {
      const user = await User.findById(loggedInUser?._id || loggedInUser);

      // Allow blocked users to reach login page
      if (user?.isBlocked) {
        return next();
      }

      logger.info("Already logged-in user redirected", {
        userId: user?._id,
        path: req.originalUrl
      });

      return res.redirect("/");
    }

    next();
  } catch (error) {
    logger.error("Error in alreadyLoggedin middleware", {
      message: error.message,
      stack: error.stack
    });

    next(error);
  }
};

const adminAlreadyLoggedin = (req, res, next) => {
  try {
    if (req.session && req.session.admin) {
      logger.info("Already logged-in admin redirected", {
        adminId: req.session.admin.id,
        path: req.originalUrl
      });
      return res.redirect("/admin/dashboard");
    }
    next();
  } catch (error) {
    logger.error("Error in adminAlreadyLoggedin middleware", {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

export { alreadyLoggedin, adminAlreadyLoggedin };
export default alreadyLoggedin;
