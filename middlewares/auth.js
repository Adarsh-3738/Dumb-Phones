const User = require("../models/userSchema");

// USER AUTH
const userAuth = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user.id);

    if (user && !user.isBlocked) {
      return next();
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log("Error in user auth middleware", error);
    return res.status(500).send("Internal Server Error");
  }
};

// ADMIN AUTH
const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      console.log("No admin session found");
      return res.redirect("/admin/login");
    }

    console.log("Session admin:", req.session.admin);
    const admin = await User.findById(req.session.admin.id);
    console.log("DB admin:", admin);

    if (admin && admin.isAdmin) {
      console.log("Admin authenticated");
      return next();
    } else {
      console.log("Admin not found or not isAdmin");
      return res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("Error in admin auth middleware", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { userAuth, adminAuth };
