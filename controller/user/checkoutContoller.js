import { getCheckoutData, placeOrderService } from "../../services/user/checkoutService.js";

// Load checkout page
export const loadCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = await getCheckoutData(userId);

    if (!data) return res.redirect("/cart"); // Cart empty

    res.render("user/checkout", {
      user: req.user,
      cartItems: data.cart.items,
      addresses: data.addresses,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      shipping: data.shipping,
      total: data.total
    });
  } catch (error) {
    console.error("Checkout load error:", error);
    res.redirect("/cart");
  }
};

// Place order cod
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.body;

    if (!addressId) return res.redirect("/checkout");

    const order = await placeOrderService(userId, addressId);

    res.render("user/order-success", { user: req.user, order });
  } catch (error) {
    console.error("Place order error:", error);
    res.redirect("/checkout");
  }
};
