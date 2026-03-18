// for easy login for already logged in user
import logger from "../utils/logger.js";

const alreadyLoggedin = (req, res, next) => {
  try {
    if (req.user || (req.isAuthenticated && req.isAuthenticated()) || (req.session && req.session.user)) {
      logger.info("Already logged-in user redirected", {
        userId: req.user?._id || req.session?.user?._id,
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
