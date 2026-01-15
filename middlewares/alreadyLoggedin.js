// for easy login for already logged in user
// middlewares/alreadyLoggedin.js
import logger from "../utils/logger.js";

const alreadyLoggedin = (req, res, next) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      logger.info("Already logged-in user redirected", {
        userId: req.user?._id,
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

export default alreadyLoggedin;
