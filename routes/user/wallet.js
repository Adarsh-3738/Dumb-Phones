import express from "express";
import * as walletController from "../../controller/user/walletController.js";
import { userAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/wallet", walletController.loadWallet);
router.post("/wallet/add/razorpay-create", userAuth, walletController.createRazorpayTopUp);
router.post("/wallet/add/razorpay-verify", userAuth, walletController.verifyRazorpayTopUp);

export default router;
