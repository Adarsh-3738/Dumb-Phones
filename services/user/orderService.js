import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";
import Coupon from "../../models/couponSchema.js";
import { addMoneyToWallet } from "../../services/user/walletService.js";

const FULFILLMENT_STATUSES = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];
const RETURNABLE_ITEM_STATUSES = ["Delivered", "Return Rejected"];
const TERMINAL_ITEM_STATUSES = ["Cancelled", "Returned"];

const getEffectiveItemStatus = (item, orderStatus) => {
  return item.itemStatus === "Active" ? orderStatus : item.itemStatus;
};

const isFinanciallyActiveItem = (item) => {
  return !TERMINAL_ITEM_STATUSES.includes(item.itemStatus);
};

const syncOrderStatusFromItems = (order) => {
  const itemStatuses = order.orderedItems.map((item) => getEffectiveItemStatus(item, order.status));

  if (itemStatuses.every((status) => status === "Cancelled")) {
    order.status = "Cancelled";
    return;
  }

  if (itemStatuses.every((status) => status === "Returned" || status === "Cancelled")) {
    order.status = "Returned";
    return;
  }

  if (itemStatuses.some((status) => status === "Return Request")) {
    order.status = "Return Request";
    return;
  }

  const activeFulfillmentStatuses = itemStatuses
    .map((status) => status === "Return Rejected" ? "Delivered" : status)
    .filter((status) => FULFILLMENT_STATUSES.includes(status));

  if (activeFulfillmentStatuses.length) {
    order.status = activeFulfillmentStatuses.reduce((lowestStatus, status) => {
      return FULFILLMENT_STATUSES.indexOf(status) < FULFILLMENT_STATUSES.indexOf(lowestStatus)
        ? status
        : lowestStatus;
    }, activeFulfillmentStatuses[0]);
  }
};


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

    const itemStatus = getEffectiveItemStatus(item, order.status);

    if (FULFILLMENT_STATUSES.includes(itemStatus)) {

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
    order.refundedAmount = (order.refundedAmount || 0) + order.finalAmount;
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

  const currentItemStatus = getEffectiveItemStatus(item, order.status);

  if (!["Pending", "Processing"].includes(currentItemStatus)) {
    throw new Error(`Cannot cancel item when item is ${currentItemStatus}`);
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

  // Update order totals and refunds
  const activeItemsBefore = order.orderedItems.filter(i => 
    isFinanciallyActiveItem(i)
  );

  let previousSalePriceSubtotal = 0;
  let previousProductSavings = 0;
  for (const act of activeItemsBefore) {
    const regularPrice = (act.regularPrice !== undefined && act.regularPrice !== null && act.regularPrice > 0) ? act.regularPrice : act.price;
    previousSalePriceSubtotal += act.price * act.quantity;
    previousProductSavings += (regularPrice - act.price) * act.quantity;
  }
  const previousCouponDeduction = Math.max(0, order.discount - previousProductSavings);
  const previousTaxableAmount = Math.max(0, previousSalePriceSubtotal - previousCouponDeduction);

  let taxRate = 0.05;
  if (previousTaxableAmount > 0) {
    taxRate = order.tax / previousTaxableAmount;
  }

  // Mark item as cancelled
  item.itemStatus = "Cancelled";
  item.cancelReason = reason || "";

  const remainingActiveItems = order.orderedItems.filter(i => 
    i._id.toString() !== itemId && 
    isFinanciallyActiveItem(i)
  );

  let newTotalPrice = 0;
  let newSalePriceSubtotal = 0;
  let newProductSavings = 0;

  for (const act of remainingActiveItems) {
    const regularPrice = (act.regularPrice !== undefined && act.regularPrice !== null && act.regularPrice > 0) ? act.regularPrice : act.price;
    newTotalPrice += regularPrice * act.quantity;
    newSalePriceSubtotal += act.price * act.quantity;
    newProductSavings += (regularPrice - act.price) * act.quantity;
  }

  let couponRevoked = false;
  let newCouponDeduction = 0;
  if (order.couponApplied && order.couponId) {
    const coupon = await Coupon.findById(order.couponId);
    if (coupon) {
      if (newSalePriceSubtotal >= coupon.minimumPrice) {
        if (coupon.discountType === "Percentage") {
          let calcDeduction = Math.floor((newSalePriceSubtotal * coupon.offerPrice) / 100);
          if (coupon.maxDiscountAmount && calcDeduction > coupon.maxDiscountAmount) {
            calcDeduction = coupon.maxDiscountAmount;
          }
          newCouponDeduction = Math.min(calcDeduction, newSalePriceSubtotal);
        } else {
          newCouponDeduction = Math.min(coupon.offerPrice, newSalePriceSubtotal);
        }
      } else {
        // Minimum order price requirement is no longer met. Revoke coupon and release it back to the user.
        coupon.userId = coupon.userId.filter(id => id.toString() !== userId.toString());
        await coupon.save();
        order.couponApplied = false;
        order.couponId = null;
        couponRevoked = true;
        order.cancelReason = (order.cancelReason ? order.cancelReason + " | " : "") + "Coupon revoked because order subtotal fell below minimum purchase limit of ₹" + coupon.minimumPrice;
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
  } else {
    syncOrderStatusFromItems(order);
  }

  // AUTOMATED PARTIAL/FULL REFUND FOR PRE-PAID ORDERS
  if (order.paymentStatus === "Paid" || order.paymentMethod === "Wallet") {
    if (refundAmount > 0) {
      await addMoneyToWallet(userId, refundAmount, `Refund for Cancelled Item in Order ${order.orderId}`);
      order.refundedAmount = (order.refundedAmount || 0) + refundAmount;
    }
    if (allCancelled && order.finalAmount === 0) {
      order.paymentStatus = "Refunded";
    }
  }

  await order.save();

  return { success: true, couponRevoked };
};




 //  RETURN ORDER

export const returnUserOrder = async (orderId, userId, reason) => {

  if (!reason) throw new Error("Return reason required");

  const order = await Order.findOne({
    orderId,
    userId
  });

  if (!order) throw new Error("Order not found");

  // Mark all active items as Return Request
  let hasActiveItems = false;
  for (const item of order.orderedItems) {
    const itemStatus = getEffectiveItemStatus(item, order.status);
    if (RETURNABLE_ITEM_STATUSES.includes(itemStatus)) {
      item.itemStatus = "Return Request";
      item.returnReason = reason;
      hasActiveItems = true;
    }
  }

  if (!hasActiveItems) {
    throw new Error("No active items to return in this order.");
  }

  order.status = "Return Request";
  order.returnReason = reason;

  await order.save();

  return order;
};


// RETURN SINGLE ORDER ITEM
export const returnUserOrderItem = async (orderId, userId, itemId, reason) => {
  if (!reason) throw new Error("Return reason required");

  const order = await Order.findOne({ orderId, userId });
  if (!order) throw new Error("Order not found");

  const item = order.orderedItems.find(i => i._id.toString() === itemId);
  if (!item) throw new Error("Item not found in order");

  const itemStatus = getEffectiveItemStatus(item, order.status);
  if (!RETURNABLE_ITEM_STATUSES.includes(itemStatus)) {
    throw new Error(`Item cannot be returned when it is ${itemStatus}`);
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
