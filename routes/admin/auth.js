import express from "express";
import * as adminController from "../../controller/admin/adminController.js";
import { adminAlreadyLoggedin } from "../../middlewares/alreadyLoggedin.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", adminAlreadyLoggedin, (req, res) => { res.redirect("/admin/login"); });
router.get("/pageerror", adminController.pageerror);
router.get("/login", adminAlreadyLoggedin, adminController.loadLogin);
router.post("/login", adminController.login);
router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get("/dashboard/chart-data", adminAuth, adminController.filterChartData);
router.get("/logout", adminController.logout);

router.get("/forgot-password", adminAlreadyLoggedin, adminController.loadForgotPassword);
router.post("/forgot-password", adminController.forgotPassword);
router.get("/reset-password/:token", adminAlreadyLoggedin, adminController.loadResetPassword);
router.post("/reset-password/:token", adminController.resetPassword);

export default router;
