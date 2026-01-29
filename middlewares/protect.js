const protect = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // 🔥 If request is from fetch / AJAX
  if (
    req.headers.accept?.includes("application/json") ||
    req.xhr
  ) {
    return res.status(401).json({
      success: false,
      notLoggedIn: true,
      message: "Please login to add items to cart"
    });
  }

  // Normal browser navigation
  return res.redirect("/login");
};

export default protect;
