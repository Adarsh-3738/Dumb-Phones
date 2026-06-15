import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";
import Coupon from "../../models/couponSchema.js";
import { addMoneyToWallet } from "../../services/user/walletService.js";


 //  GET USER ORDERS

export const getUserOrders = async (userId) => {

  const orders = await Order.find({ userId })
    .sort({ createdOn: -1 });

  return orders;
};



 //  GET SINGLE ORDER

export const getUserOrderDetails = async (orderId, userId) => {

  const order = await Order.findOne({
    orderId,
    userId
  })
    .populate("orderedItems.product")
    .populate("orderedItems.variant")
    .populate("address");

  return order;
};



//   CANCEL ORDER

export const cancelUserOrder = async (orderId, userId, reason) => {

  const order = await Order.findOne({
    orderId,
    userId
  });

  if (!order) throw new Error("Order not found");

  if (order.status === "Cancelled")
    throw new Error("Order already cancelled");

  for (const item of order.orderedItems) {

    if (item.itemStatus === "Active") {

      const variant = await Variant.findById(item.variant);
      if (variant) {
        variant.quantity += item.quantity;
        if (variant.status === "out of stock" && variant.quantity > 0) {
          variant.status = "Available";
        }
        await variant.save();
      }

      item.itemStatus = "Cancelled";
    }
  }

  order.status = "Cancelled";
  order.cancelReason = reason || "";

  // Release coupon if applied
  if (order.couponApplied && order.couponId) {
    const coupon = await Coupon.findById(order.couponId);
    if (coupon) {
      coupon.userId = coupon.userId.filter(id => id.toString() !== userId.toString());
      await coupon.save();
    }
  }

  // AUTOMATED REFUND FOR PRE-PAID ORDERS
  if (order.paymentStatus === "Paid" || order.paymentMethod === "Wallet") {
    await addMoneyToWallet(userId, order.finalAmount, `Refund for Cancelled Order ${order.orderId}`);
    order.paymentStatus = "Refunded";
  }

  await order.save();

  return true;
};

// CANCEL SINGLE ORDER ITEM
export const cancelUserOrderItem = async (orderId, userId, itemId, reason) => {
  const order = await Order.findOne({
    orderId,
    userId
  });

  if (!order) throw new Error("Order not found");

  if (order.status === "Cancelled")
    throw new Error("Entire order is already cancelled");

  // Find the specific item
  const item = order.orderedItems.find(i => i._id.toString() === itemId);
  
  if (!item) throw new Error("Item not found in order");

  if (
    order.status === "Delivered" || 
    order.status === "Return Request" || 
    order.status === "Returned" ||
    order.status === "Out for Delivery"
  ) {
    throw new Error(`Cannot cancel item when order is ${order.status}`);
  }

  if (item.itemStatus === "Cancelled")
    throw new Error("Item is already cancelled");

  // Restore inventory
  const variantObj = await Variant.findById(item.variant);
  if (variantObj) {
    variantObj.quantity += item.quantity;
    if (variantObj.status === "out of stock" && variantObj.quantity > 0) {
      variantObj.status = "Available";
    }
    await variantObj.save();
  }

  // Mark item as cancelled
  item.itemStatus = "Cancelled";
  item.cancelReason = reason || "";

  // Update order totals and refunds
  const activeItemsBefore = order.orderedItems.filter(i => 
    i.itemStatus !== "Cancelled" && 
    i.itemStatus !== "Returned"
  );

  let previousSalePriceSubtotal = 0;
  let previousProductSavings = 0;
  for (const act of activeItemsBefore) {
    const v = await Variant.findById(act.variant);
    const regularPrice = (v && v.regularPrice > act.price) ? v.regularPrice : act.price;
    previousSalePriceSubtotal += act.price * act.quantity;
    previousProductSavings += (regularPrice - act.price) * act.quantity;
  }
  const previousCouponDeduction = Math.max(0, order.discount - previousProductSavings);
  const previousTaxableAmount = Math.max(0, previousSalePriceSubtotal - previousCouponDeduction);

  let taxRate = 0.05;
  if (previousTaxableAmount > 0) {
    taxRate = order.tax / previousTaxableAmount;
  }

  const remainingActiveItems = order.orderedItems.filter(i => 
    i._id.toString() !== itemId && 
    i.itemStatus !== "Cancelled" && 
    i.itemStatus !== "Returned"
  );

  let newTotalPrice = 0;
  let newSalePriceSubtotal = 0;
  let newProductSavings = 0;

  for (const act of remainingActiveItems) {
    const v = await Variant.findById(act.variant);
    const regularPrice = (v && v.regularPrice > act.price) ? v.regularPrice : act.price;
    newTotalPrice += regularPrice * act.quantity;
    newSalePriceSubtotal += act.price * act.quantity;
    newProductSavings += (regularPrice - act.price) * act.quantity;
  }

  let newCouponDeduction = 0;
  if (order.couponApplied && order.couponId) {
    const coupon = await Coupon.findById(order.couponId);
    if (coupon && newSalePriceSubtotal >= coupon.minimumPrice) {
      if (coupon.discountType === "Percentage") {
        let calcDeduction = Math.floor((newSalePriceSubtotal * coupon.offerPrice) / 100);
        if (coupon.maxDiscountAmount && calcDeduction > coupon.maxDiscountAmount) {
          calcDeduction = coupon.maxDiscountAmount;
        }
        newCouponDeduction = Math.min(calcDeduction, newSalePriceSubtotal);
      } else {
        newCouponDeduction = Math.min(coupon.offerPrice, newSalePriceSubtotal);
      }
    }
  }

  const newTaxableAmount = Math.max(0, newSalePriceSubtotal - newCouponDeduction);
  const newTax = Math.round(newTaxableAmount * taxRate);
  const newDiscount = newProductSavings + newCouponDeduction;

  let newFinalAmount = 0;
  let refundAmount = 0;

  if (remainingActiveItems.length === 0) {
    newTotalPrice = 0;
    newSalePriceSubtotal = 0;
    newProductSavings = 0;
    newCouponDeduction = 0;
    refundAmount = order.finalAmount;
    newFinalAmount = 0;
    order.shipping = 0;
  } else {
    newFinalAmount = newTotalPrice + newTax + order.shipping - newDiscount;
    if (newFinalAmount < 0) newFinalAmount = 0;
    newFinalAmount = Math.min(newFinalAmount, order.finalAmount);
    refundAmount = Math.max(0, order.finalAmount - newFinalAmount);
  }

  order.totalPrice = newTotalPrice;
  order.discount = newDiscount;
  order.tax = newTax;
  order.finalAmount = newFinalAmount;

  // Check if ALL items are now cancelled. If so, mark the entire order as cancelled.
  const allCancelled = order.orderedItems.every(i => i.itemStatus === "Cancelled");
  
  if (allCancelled) {
    order.status = "Cancelled";
    order.cancelReason = "All individual items cancelled";

    // Release coupon if applied
    if (order.couponApplied && order.couponId) {
      const coupon = await Coupon.findById(order.couponId);
      if (coupon) {
        coupon.userId = coupon.userId.filter(id => id.toString() !== userId.toString());
        await coupon.save();
      }
    }
  }

  // AUTOMATED PARTIAL/FULL REFUND FOR PRE-PAID ORDERS
  if (order.paymentStatus === "Paid" || order.paymentMethod === "Wallet") {
    if (refundAmount > 0) {
      await addMoneyToWallet(userId, refundAmount, `Refund for Cancelled Item in Order ${order.orderId}`);
    }
    if (allCancelled && order.finalAmount === 0) {
      order.paymentStatus = "Refunded";
    }
  }

  await order.save();

  return true;
};




 //  RETURN ORDER

export const returnUserOrder = async (orderId, userId, reason) => {

  if (!reason) throw new Error("Return reason required");

  const order = await Order.findOne({
    orderId,
    userId
  });

  if (!order || order.status !== "Delivered")
    throw new Error("Invalid return request");

  order.status = "Return Request";
  order.returnReason = reason;

  await order.save();

  return order;
};


// RETURN SINGLE ORDER ITEM
export const returnUserOrderItem = async (orderId, userId, itemId, reason) => {
  if (!reason) throw new Error("Return reason required");

  const order = await Order.findOne({ orderId, userId });
  const allowedStatuses = ["Delivered", "Return Request", "Returned", "Return Rejected"];
  if (!order || !allowedStatuses.includes(order.status)) {
    throw new Error("Invalid return request. Order must be in a post-delivery state.");
  }

  const item = order.orderedItems.find(i => i._id.toString() === itemId);
  if (!item) throw new Error("Item not found in order");

  if (item.itemStatus !== "Active") {
    throw new Error(`Item is already ${item.itemStatus}`);
  }

  item.itemStatus = "Return Request";
  item.returnReason = reason;

  if (order.status !== "Return Request" && order.status !== "Returned") {
    order.status = "Return Request";
    order.returnReason = "Partial Return Requested";
  }

  await order.save();
  return true;
};



 //  SEARCH ORDERS

export const searchUserOrders = async (userId, searchTerm) => {

  const orders = await Order.find({
    userId,
    orderId: { $regex: searchTerm, $options: "i" }
  }).sort({ createdOn: -1 });

  return orders;
};



export const getOrderForInvoice = async (orderId, userId) => {

  const order = await Order.findOne({
    orderId,
    userId
  })
    .populate("orderedItems.product")
    .populate("orderedItems.variant")
    .populate("userId", "name email phone")
    .populate("address");

  return order;
};