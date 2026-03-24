import express from "express";

import authRoutes from "./user/auth.js";
import pageRoutes from "./user/page.js";
import profileRoutes from "./user/profile.js";
import cartRoutes from "./user/cart.js";
import wishlistRoutes from "./user/wishlist.js";
import orderRoutes from "./user/order.js";
import walletRoutes from "./user/wallet.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", pageRoutes);
router.use("/", profileRoutes);
router.use("/", cartRoutes);
router.use("/", wishlistRoutes);
router.use("/", orderRoutes);
router.use("/", walletRoutes);

export default router;
