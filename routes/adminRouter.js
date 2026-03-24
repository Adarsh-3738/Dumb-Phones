import express from "express";

import authRoutes from "./admin/auth.js";
import customerRoutes from "./admin/customer.js";
import categoryRoutes from "./admin/category.js";
import productRoutes from "./admin/product.js";
import brandRoutes from "./admin/brand.js";
import orderRoutes from "./admin/order.js";
import settingsRoutes from "./admin/settings.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", customerRoutes);
router.use("/", categoryRoutes);
router.use("/", productRoutes);
router.use("/", brandRoutes);
router.use("/", orderRoutes);
router.use("/", settingsRoutes);

export default router;
