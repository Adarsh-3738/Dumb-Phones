import express from "express";
import * as cartController from "../../controller/user/cartController.js";
import * as checkoutController from "../../controller/user/checkoutContoller.js";
import protect from "../../middlewares/protect.js";

const router = express.Router();

router.get("/cart", protect, cartController.loadCart);
router.post("/cart/add", protect, cartController.addToCart);
router.post("/cart/increment", protect, cartController.incrementQty);
router.post("/cart/decrement", protect, cartController.decrementQty);
router.post("/cart/remove", protect, cartController.removeFromCart);

router.get("/checkout", protect, checkoutController.loadCheckout);
router.post("/checkout/place-order", protect, checkoutController.placeOrder);
router.post("/checkout/apply-coupon", protect, checkoutController.applyCoupon);
router.post("/checkout/remove-coupon", protect, checkoutController.removeCoupon);


router.post("/checkout/razorpay-create", protect, checkoutController.createRazorpayOrder);
router.post("/checkout/razorpay-verify", protect, checkoutController.verifyRazorpayPayment);

router.get("/order-success", protect, checkoutController.orderSuccessPage);
router.get("/order-failed", protect, checkoutController.orderFailedPage);

export default router;
