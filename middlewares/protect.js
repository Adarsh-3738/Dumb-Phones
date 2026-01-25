const protect = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user; // attach logged-in user
    return next();
  }

  return res.redirect("/login");
};

export default protect;
