import express from "express";
import * as walletController from "../../controller/user/walletController.js";
import protect from "../../middlewares/protect.js";

const router = express.Router();

router.get("/wallet", protect, walletController.loadWallet);
router.post("/wallet/add/razorpay-create", protect, walletController.createRazorpayTopUp);
router.post("/wallet/add/razorpay-verify", protect, walletController.verifyRazorpayTopUp);

export default router;
