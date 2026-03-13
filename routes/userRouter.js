import express from "express";
import passport from "passport";

import * as userController from "../controller/user/userController.js";
import * as productController from "../controller/user/productController.js";
import * as profileController from "../controller/user/profileController.js"
import * as cartController from "../controller/user/cartController.js"
import * as walletController from "../controller/user/walletController.js"
import alreadyLoggedIn from "../middlewares/alreadyLoggedin.js";
import { userAuth } from "../middlewares/auth.js";
import protect from "../middlewares/protect.js";
import upload from "../middlewares/upload.js";
import * as checkoutController from "../controller/user/checkoutContoller.js";
import * as orderController from "../controller/user/orderController.js"
import { loadWallet, addMoney } from "../controller/user/walletController.js";
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
router.post("/resend-otp", userController.resendOtp);
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
router.get("/shop", protect,userController.loadShopPage);
router.get("/product/:id", productController.loadProductDetails);

//user profile
router.get("/profile", protect,profileController.renderProfilePage);

//profile edit

router.get("/profile/edit", protect, profileController.getEditProfile);
router.patch(
  "/profile/edit",
  protect,
  upload.single("profileImage"),
  profileController.updateProfile
);

// EMAIL OTP VERIFICATION
router.get("/email/change", protect, profileController.loadChangeEmail);
router.post("/email/change", protect, profileController.sendEmailOtp);
router.post('/resend/otp', protect,profileController.resendEmailOtp);
// Verify email
router.get("/email/verify", protect,profileController.loadVerifyEmail);
router.post("/email/verify", protect, profileController.verifyEmailOtp);

// CHANGE PASSWORD
router.get("/change-password", protect, profileController.loadChangePassword);
router.patch("/change-password", protect, profileController.changePassword);


// ADDRESS MANAGEMENT
router.get("/address",protect,profileController.loadAddresses);
router.get("/address/add", protect, profileController.loadAddAddress);
router.post("/address/add", protect, profileController.addAddress);

router.get("/address/edit/:id", protect, profileController.loadEditAddress);
router.patch("/address/edit/:id", protect, profileController.updateAddress);
router.delete("/address/delete/:id", protect, profileController.deleteAddress);

//logout
router.post("/logout",protect,profileController.logoutUser);

//cart
router.get("/cart",protect,cartController.loadCart);
router.post("/cart/add", protect, cartController.addToCart);
router.post("/cart/increment", protect, cartController.incrementQty);
router.post("/cart/decrement", protect, cartController.decrementQty);
router.post("/cart/remove", protect, cartController.removeFromCart);

// Checkout page
router.get("/checkout", protect,checkoutController.loadCheckout);
// Place order 
router.post("/checkout/place-order", protect, checkoutController.placeOrder);


//order management;

// Search orders
router.get("/orders/search", protect, orderController.searchOrders);
// Orders list
router.get("/orders", protect, orderController.loadOrders);
// Order details page
router.get("/orders/:orderId", protect, orderController.loadOrderDetails);
// Cancel order or product
router.post("/orders/:orderId/cancel", protect, orderController.cancelOrder);
// Cancel specific item in order
router.post("/orders/:orderId/item/:itemId/cancel", protect, orderController.cancelOrderItem);
// Return order
router.post("/orders/:orderId/return", protect, orderController.returnOrder);
// Download invoice
router.get("/orders/:orderId/invoice", protect, orderController.downloadInvoice);


//wallet


router.get("/wallet", walletController.loadWallet);
router.post("/add", userAuth, addMoney);




export default router;
