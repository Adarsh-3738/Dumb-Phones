import express from "express";
import * as referralController from "../../controller/admin/referralController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/referrals", adminAuth, referralController.getReferrals);

export default router;
