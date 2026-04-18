import { getCheckoutData, placeOrderService } from "../../services/user/checkoutService.js";
import { getOrCreateWallet } from "../../services/user/walletService.js";
import Coupon from "../../models/couponSchema.js";
import Cart from "../../models/cartSchema.js";
import crypto from "crypto";
import Order from "../../models/orderSchema.js"; // make sure Order is imported


// LOAD CHECKOUT

export const loadCheckout = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const userId = req.user._id;

    const data = await getCheckoutData(userId);

    if (!data || data.cart.items.length === 0) {
      return res.redirect("/cart");
    }

    const wallet = await getOrCreateWallet(userId);
    const walletBalance = wallet ? wallet.balance : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentSubtotal = 0;
    data.cart.items.forEach(i => { currentSubtotal += i.price * i.quantity; });
    
    const availableCoupons = await Coupon.find({
      isList: true,
      startDate: { $lte: new Date() },
      expireOn: { $gte: today },
      userId: { $ne: userId },
      minimumPrice: { $lte: currentSubtotal }
    });

    res.render("user/checkout", {
      user: req.user,
      cartItems: data.cart.items,
      addresses: data.addresses,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      shipping: data.shipping,
      total: data.total,
      totalSavings: data.totalSavings,
      couponDeduction: data.couponDeduction,
      appliedCouponCode: data.appliedCouponCode,
      walletBalance,
      availableCoupons
    });

  } catch (error) {
    console.error("Checkout load error:", error);
    res.redirect("/cart");
  }
};


// PLACE ORDER (COD)

export const placeOrder = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const userId = req.user._id;
    const { addressId, paymentMethod = "COD" } = req.body;

    if (!addressId) return res.redirect("/checkout");

    const order = await placeOrderService(userId, addressId, paymentMethod);
    res.render("user/order-success", {
      user: req.user,
      order
    });

  } catch (error) {
    console.error("Place order error:", error);
    res.redirect("/checkout");
  }
};

// APPLY COUPON
export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code } = req.body;
    
    if (!code) return res.status(400).json({ success: false, message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ name: code.toUpperCase() });
    
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code" });

    const now = new Date();
    const expiry = new Date(coupon.expireOn);
    expiry.setHours(23, 59, 59, 999);

    if (now > expiry) {
       return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    const hasUsed = coupon.userId && coupon.userId.some(id => id.toString() === userId.toString());
    if (hasUsed) {
       return res.status(400).json({ success: false, message: "You have already used this coupon" });
    }

    // Check minimum spend
    const cart = await Cart.findOne({ userId }).populate("items.variantId");
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    let currentSubtotal = 0;
    cart.items.forEach(i => { currentSubtotal += i.price * i.quantity; });
    
    if (currentSubtotal < coupon.minimumPrice) {
       return res.status(400).json({ success: false, message: `Minimum spend of ₹${coupon.minimumPrice.toLocaleString('en-IN')} required` });
    }

    cart.appliedCoupon = coupon._id;
    await cart.save();

    res.json({ success: true, message: "Coupon applied successfully" });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// REMOVE COUPON
export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.findOneAndUpdate({ userId }, { $set: { appliedCoupon: null } });
    res.json({ success: true, message: "Coupon removed successfully" });
  } catch (error) {
    console.error("Remove coupon error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



//payment integration
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.body;

    
    const order = await placeOrderService(userId, addressId, "Razorpay");

    
    const { generateRazorpay } = await import("../../services/user/checkoutService.js");
    const razorpayData = await generateRazorpay(order.orderId, order.finalAmount);

    res.json({
      success: true,
      razorpayOrderId: razorpayData.id,
      systemOrderId: order._id,
      amount: order.finalAmount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, systemOrderId } = req.body;

    // Hash the details using your secret key from the .env file
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    // Check if the hashes exactly match
    if (razorpay_signature === expectedSign) {
    
      // Find the pending order and mark it as Paid cleanly
      const order = await Order.findById(systemOrderId);
      if (order) {
        const newStatus = (order.status === "Payment Failed" || order.status === "Pending") ? "Processing" : order.status;
        await Order.findByIdAndUpdate(systemOrderId, { 
          paymentStatus: "Paid",
          status: newStatus 
        }, { runValidators: false });
      }
      
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

export const orderSuccessPage = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findById(orderId);
    if (!order) return res.redirect("/");
    res.render("user/order-success", { user: req.user, order });
  } catch (error) {
    res.redirect("/");
  }
};

export const orderFailedPage = async (req, res) => {
  try {
    const { orderId } = req.query;

    // Store the custom string orderId for the frontend retry script
    let customOrderId = null;
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (order) {
        customOrderId = order.orderId;
      }
      
      // If the order is still pending payment, it means they closed Razorpay or card declined.
      if (order && order.paymentStatus === "Pending" && order.status !== "Cancelled") {
        order.paymentStatus = "Failed";
        order.status = "Payment Failed";
        
        // Restore stock to the variants
        for (const item of order.orderedItems) {
           const { Variant } = await import("../../models/variantSchema.js").then(m => ({ Variant: m.default }));
           const v = await Variant.findById(item.variant);
           if (v) {
             v.quantity += item.quantity;
             if (v.status === "out of stock" && v.quantity > 0) {
               v.status = "Available";
             }
             await v.save();
           }
        }
        await order.save();
      }
    }

    res.render("user/order-failed", { user: req.user, orderId, customOrderId });
  } catch (error) {
    console.error("Failed Page Error:", error);
    res.redirect("/");
  }
};

export const retryRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "Failed" && order.paymentStatus !== "Pending") {
      return res.status(400).json({ success: false, message: "Payment cannot be retried for this order." });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "This order has been cancelled and cannot be paid." });
    }

    // Re-reserve stock if the order was in 'Payment Failed' state and stock was restored
    if (order.paymentStatus === "Failed") {
      const reservedStock = [];
      const { Variant } = await import("../../models/variantSchema.js").then(m => ({ Variant: m.default }));
      
      try {
        for (const item of order.orderedItems) {
          const variant = await Variant.findOneAndUpdate(
            { _id: item.variant, quantity: { $gte: item.quantity } },
            { $inc: { quantity: -item.quantity } },
            { new: true }
          );
          if (!variant) throw new Error("One or more items in your order are now out of stock.");
          if (variant.quantity === 0) variant.status = "out of stock";
          await variant.save();
          reservedStock.push({ variantId: item.variant, quantity: item.quantity });
        }
      } catch (error) {
        // Rollback reserved stock if one of the items fails
        for (const reserved of reservedStock) {
           const v = await Variant.findById(reserved.variantId);
           if (v) { 
             v.quantity += reserved.quantity; 
             if (v.status === "out of stock" && v.quantity > 0) v.status = "Available"; 
             await v.save(); 
           }
        }
        return res.status(400).json({ success: false, message: error.message });
      }

      // Reset to pending so if it fails again, it hits the /order-failed logic properly
      order.paymentStatus = "Pending";
      order.status = "Pending";
      await order.save();
    }

    const { generateRazorpay } = await import("../../services/user/checkoutService.js");
    const razorpayData = await generateRazorpay(order.orderId, order.finalAmount);

    res.json({
      success: true,
      razorpayOrderId: razorpayData.id,
      systemOrderId: order._id,
      amount: order.finalAmount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Retry Payment Error:", error);
    res.status(500).json({ success: false, message: "Server error during payment retry" });
  }
};
