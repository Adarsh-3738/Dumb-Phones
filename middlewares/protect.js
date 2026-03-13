import User from "../models/userSchema.js";

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
            return req.session.save((err) => {
              if (err) console.error("Session save error:", err);
              return res.redirect("/login");
            });
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