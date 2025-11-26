const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const passport = require("passport");

router.get("/user/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHomepage);
router.get("/user/logout",userController.logout);
router.get("/user/signup",userController.loadSignup);
router.post("/user/signup", userController.signup);
router.post("/user/verify-otp",userController.verifyOtp);

router.get ('/auth/google' ,passport.authenticate('google',{scope:['profile','email']})) ;
router.get ('/auth/google/callback', passport.authenticate( 'google', {failureRedirect: '/signup'}),(req,res)=>{
res.redirect ('/')
})

router.get("/user/login",userController.loadLogin);
router.post("/user/login",userController.login);

module.exports = router;