import express from "express";
import * as orderController from "../../controller/admin/orderController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/orders", adminAuth, orderController.loadOrders);
router.get("/orders/:orderId", adminAuth, orderController.loadOrderDetails);
router.post("/orders/:orderId/status", adminAuth, orderController.updateOrderStatus);

export default router;
