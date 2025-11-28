const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin/adminController");
const customerController = require("../controller/admin/customerController");
const categoryController = require("../controller/admin/categoryController.js");


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



//user management

router.get("/users", adminAuth, customerController.customerInfo);
router.get("/blockCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth, customerController.customerunBlocked);

//category management

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/category/add", adminAuth, categoryController.addCategory);



module.exports = router;
