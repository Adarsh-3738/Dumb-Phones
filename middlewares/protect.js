import User from "../models/userSchema.js";
import STATUS_CODES from "../utils/statusCodes.js";

const protect = async (req, res, next) => {
  try {
    let userId = null;

    // Passport login (Google)
    if (req.user) {
      userId = req.user._id;
    } 
    // Normal login
    else if (req.session && req.session.user) {
      userId = req.session.user._id || req.session.user;
    }

    if (userId) {
      // Check live database status
      const liveUser = await User.findById(userId);
      
      if (liveUser && !liveUser.isBlocked) {
        req.user = liveUser;
        if (req.session && req.session.user) {
           req.session.user = liveUser; // Keep session fresh
        }
        return next();
      } else {
        // User is blocked or deleted
        const finishLogout = () => {
          if (req.session) {
            delete req.session.user;
            delete req.session.passport;
            
            req.session.message = "Your account has been blocked by the administrator.";
            
            return req.session.save((err) => {
              if (err) console.error("Session save error:", err);
              
              if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
                return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, blocked: true, message: req.session.message });
              }
              return res.redirect("/login");
            });
          }
          
          if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
            return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, blocked: true, message: "Your account has been blocked by the administrator." });
          }
          return res.redirect("/login");
        };

        if (req.logout) {
          const adminSession = req.session ? req.session.admin : null;
          return req.logout({ keepSessionInfo: true }, (err) => {
            if (err) console.error("Passport logout error:", err);
            if (req.session && adminSession) {
               req.session.admin = adminSession;
            }
            finishLogout();
          });
        } else {
          return finishLogout();
        }
      }
    }

    // AJAX / fetch requests
    if (
      req.headers.accept?.includes("application/json") ||
      req.xhr
    ) {
      return res.status(401).json({
        success: false,
        notLoggedIn: true,
        message: "Your account is blocked or you are not logged in."
      });
    }

    // Normal navigation
    return res.redirect("/login");
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.redirect("/login");
  }
};

export default protect;