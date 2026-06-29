import User from "../models/userSchema.js";
import logger from "../utils/logger.js";

// USER AUTH
const userAuth = async (req, res, next) => {
  try {
    const loggedInUser = req.user || req.session?.user;
    if (!loggedInUser) {
      return res.redirect("/login");
    }

    // Fetch latest user data from DB
    const user = await User.findById(loggedInUser._id || loggedInUser);

    if (!user || user.isBlocked) {
      req.session.message = "Your account has been blocked by the administrator.";

      const finishLogout = () => {
        if (req.session) {
          delete req.session.user;
          delete req.session.passport;
          return req.session.save(() => {
            return res.redirect("/login");
          });
        }
        return res.redirect("/login");
      };

      if (req.logout) {
        return req.logout((err) => {
          if (err) {
            logger.error("Logout error", {
              message: err.message
            });
          }
          finishLogout();
        });
      } else {
        return finishLogout();
      }
    }

    next();
  } catch (error) {
    logger.error("Error in userAuth middleware", {
      message: error.message,
      stack: error.stack
    });

    return res.redirect("/login");
  }
};
// ADMIN AUTH
const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      logger.warn("Admin access denied - no session", {
        path: req.originalUrl
      });
      return res.redirect("/admin/login");
    }

    const admin = await User.findById(req.session.admin.id);

    if (admin && admin.isAdmin) {
      logger.info("Admin authenticated", {
        adminId: admin._id,
        path: req.originalUrl
      });
      return next();
    }

    logger.warn("Admin access denied - not admin", {
      adminId: req.session.admin.id
    });

    return res.redirect("/admin/login");
  } catch (error) {
    logger.error("Error in adminAuth middleware", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).send("Internal Server Error");
  }
};

export { userAuth, adminAuth };
export default userAuth;