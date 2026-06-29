import express from "express";
import passport from "passport";
import * as userController from "../../controller/user/userController.js";
import alreadyLoggedIn from "../../middlewares/alreadyLoggedin.js";
import auth from "../../middlewares/auth.js"
const router = express.Router();

router.post("/signup", userController.signup);
router.get("/login", alreadyLoggedIn, userController.loadLogin);
router.post("/login", userController.login);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/auth/check-status", userController.checkStatus);

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
    failureRedirect: "/login",
    keepSessionInfo: true
  }),
  (req, res) => {
    if (req.user?.isBlocked) {
      const message = "Your account has been blocked by the administrator. Please contact support.";

      return req.logout({ keepSessionInfo: true }, (err) => {
        if (err) {
          console.error("Google blocked logout error:", err);
        }

        delete req.session.user;
        delete req.session.passport;
        req.session.message = message;

        return req.session.save(() => {
          res.redirect("/login");
        });
      });
    }

    req.session.user = req.user;
    req.session.save(() => {
      res.redirect("/");
    });
  }
);

export default router;
