import express from "express";
import * as referralController from "../../controller/admin/referralController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/referrals", adminAuth, referralController.getReferrals);
router.post("/referrals/add", adminAuth, referralController.addReferralOffer);
router.patch("/referrals/edit/:id", adminAuth, referralController.editReferralOffer);
router.patch("/referrals/toggle-status/:id", adminAuth, referralController.toggleReferralOfferStatus);
router.delete("/referrals/delete/:id", adminAuth, referralController.deleteReferralOffer);

export default router;
