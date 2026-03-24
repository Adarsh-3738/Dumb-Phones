import express from "express";
import * as walletController from "../../controller/user/walletController.js";
import { userAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/wallet", walletController.loadWallet);
router.post("/add", userAuth, walletController.addMoney);

export default router;
