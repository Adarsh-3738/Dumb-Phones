import { getCheckoutData, placeOrderService } from "../../services/user/checkoutService.js";
import { getOrCreateWallet } from "../../services/user/walletService.js";
import Coupon from "../../models/couponSchema.js";
import Cart from "../../models/cartSchema.js";


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
      walletBalance
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