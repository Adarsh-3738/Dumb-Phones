import express from "express";
import * as couponController from "../../controller/admin/couponController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/coupons", adminAuth, couponController.getCoupons);
router.post("/coupons/add", adminAuth, couponController.addCoupon);
router.delete("/coupons/delete/:id", adminAuth, couponController.deleteCoupon);

export default router;
