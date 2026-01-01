const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const passport = require("passport");

router.get("/pageNotFound",userController.pageNotFound) 
router.get("/",userController.loadHomepage);
router.get("/logout",userController.logout);
router.get("/signup",userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/login", userController.loadLogin);
router.post("/login",userController.login);
router.post("/verify-otp",userController.verifyOtp);

//forgot password
router.get("/forgot-password", userController.loadForgotPassword);
router.post("/forgot-password", userController.forgotPassword);
//reset password
router.get("/reset-password/:token", userController.loadResetPassword);
router.post("/reset-password/:token", userController.resetPassword);


// Google Login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

// Callback route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login", // redirect if login fails
  }),
  (req, res) => {
    // Successful login
    res.redirect("/"); // redirect to homepage
  }
);


const productController = require("../controller/user/productController");

// Product listing page 
router.get("/products", productController.getProducts);




module.exports = router;