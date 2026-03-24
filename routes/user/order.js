import express from "express";
import * as orderController from "../../controller/user/orderController.js";
import protect from "../../middlewares/protect.js";

const router = express.Router();

router.get("/orders/search", protect, orderController.searchOrders);
router.get("/orders", protect, orderController.loadOrders);
router.get("/orders/:orderId", protect, orderController.loadOrderDetails);
router.post("/orders/:orderId/cancel", protect, orderController.cancelOrder);
router.post("/orders/:orderId/item/:itemId/cancel", protect, orderController.cancelOrderItem);
router.post("/orders/:orderId/return", protect, orderController.returnOrder);
router.get("/orders/:orderId/invoice", protect, orderController.downloadInvoice);

export default router;
