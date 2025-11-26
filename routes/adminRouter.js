const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin/adminController");

const { adminAuth } = require("../middlewares/auth");
console.log("Loaded adminAuth =", adminAuth);

// Redirect root to login
router.get("/", (req, res) => {
  res.redirect("/admin/login");
});

// Admin Routes
router.get("/pageerror", adminController.pageerror);

router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);

router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get ("/logout", adminController.logout);

module.exports = router;
