import express from "express";
import passport from "passport";

import * as userController from "../controller/user/userController.js";
import * as productController from "../controller/user/productController.js";
import * as profileController from "../controller/user/profileController.js"
import * as cartController from "../controller/user/cartController.js"
import alreadyLoggedIn from "../middlewares/alreadyLoggedin.js";
import { userAuth } from "../middlewares/auth.js";
import protect from "../middlewares/protect.js";
import upload from "../middlewares/upload.js";
import * as checkoutController from "../controller/user/checkoutContoller.js";

const router = express.Router();

// Pages
router.get("/pageNotFound", userController.pageNotFound);
router.get("/", userController.loadHomepage);
router.get("/logout", userController.logout);
router.get("/signup", userController.loadSignup);

// Auth
router.post("/signup", userController.signup);
router.get("/login", alreadyLoggedIn, userController.loadLogin);
router.post("/login", userController.login);
router.post("/verify-otp", userController.verifyOtp);

// Forgot / Reset password
router.get("/forgot-password", userController.loadForgotPassword);
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password/:token", userController.loadResetPassword);
router.post("/reset-password/:token", userController.resetPassword);

// Google Login
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

// Google callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// Products
router.get("/products", productController.getProducts);
router.get("/shop", userController.loadShopPage);
router.get("/product/:id", productController.loadProductDetails);

//user profile




router.get("/profile", protect,profileController.renderProfilePage);

//user profile edit

router.get("/edit-profile", protect, profileController.getEditProfile);
router.post(
  "/edit-profile",
  protect,
  upload.single("profileImage"),
  profileController.updateProfile
);

// EMAIL OTP VERIFICATION
router.get("/change-email", protect, profileController.loadChangeEmail);
router.post("/change-email", protect, profileController.sendEmailOtp);

// Verify email
router.get("/verify-email", protect,profileController.loadVerifyEmail);
router.post("/verify-email", protect, profileController.verifyEmailOtp);

// CHANGE PASSWORD
router.get("/change-password", protect, profileController.loadChangePassword);
router.post("/change-password", protect, profileController.changePassword);


// ADDRESS MANAGEMENT
router.get("/address",protect,profileController.loadAddresses);
router.get("/add-address", protect, profileController.loadAddAddress);
router.post("/add-address", protect, profileController.addAddress);

router.get("/address/edit/:id", protect, profileController.loadEditAddress);
router.post("/address/edit/:id", protect, profileController.updateAddress);
router.post("/address/delete/:id", protect, profileController.deleteAddress);

//logout
router.post("/logout",protect,profileController.logoutUser);

//cart
router.get("/cart",protect,cartController.loadCart);
router.post("/cart/add/:productId", protect, cartController.addToCart);
router.post("/cart/increment/:productId", protect, cartController.incrementQty);
router.post("/cart/decrement/:productId", protect, cartController.decrementQty);
router.post("/cart/remove/:productId", protect, cartController.removeFromCart);

// Checkout page
router.get("/checkout", protect,checkoutController.loadCheckout);
// Place order (Cash on Delivery)
router.post("/checkout/place-order", protect, checkoutController.placeOrder);




export default router;
