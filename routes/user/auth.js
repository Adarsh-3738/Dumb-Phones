import express from "express";
import passport from "passport";
import * as userController from "../../controller/user/userController.js";
import alreadyLoggedIn from "../../middlewares/alreadyLoggedin.js";

const router = express.Router();

router.post("/signup", userController.signup);
router.get("/login", alreadyLoggedIn, userController.loadLogin);
router.post("/login", userController.login);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get("/forgot-password", alreadyLoggedIn, userController.loadForgotPassword);
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password/:token", alreadyLoggedIn, userController.loadResetPassword);
router.post("/reset-password/:token", userController.resetPassword);

router.get(
  "/auth/google",
  alreadyLoggedIn,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    res.redirect("/");
  }
);

export default router;
