import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";
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

  // Update order totals
  
  const variant = await Variant.findById(item.variant);
  const regularPrice = (variant && variant.regularPrice > item.price) ? variant.regularPrice : item.price;
  
  const regularItemTotal = regularPrice * item.quantity;
  const saleItemTotal = item.price * item.quantity;

  let discountToRemove = 0;
  if (regularPrice > item.price) {
    discountToRemove = (regularPrice - item.price) * item.quantity;
  }

  // don't deduct more discount than what's available
  discountToRemove = Math.min(discountToRemove, order.discount);

  // order.totalPrice in DB represents the regularPrice subtotal now
  order.totalPrice = Math.max(0, order.totalPrice - regularItemTotal);
  order.discount = Math.max(0, order.discount - discountToRemove);

  // Recalculate tax proportionally
  // Tax is charged on the sale price (totalPrice - discount), 
  
  let taxToRemove = 0;
  if (order.totalPrice > 0 && order.tax > 0) {
    const previousSaleTotal = (order.totalPrice + regularItemTotal) - (order.discount + discountToRemove);
    if (previousSaleTotal > 0) {
       const taxPercentage = order.tax / previousSaleTotal;
       taxToRemove = Math.round(saleItemTotal * taxPercentage);
    }
  } else if (order.totalPrice === 0) {
    // If all items cancelled, remove all tax
    taxToRemove = order.tax;
  }
  order.tax = Math.max(0, order.tax - taxToRemove);
  
  // Refund Mathematics
  const refundAmount = (regularItemTotal + taxToRemove) - discountToRemove;

  // Recalculate finalAmount based on the new total and discount
  if (order.totalPrice === 0) {
     order.finalAmount = 0;
     order.shipping = 0;
  } else {
     order.finalAmount = Math.max(0, order.finalAmount - refundAmount);
  }

  // Check if ALL items are now cancelled. If so, mark the entire order as cancelled.
  const allCancelled = order.orderedItems.every(i => i.itemStatus === "Cancelled");
  
  if (allCancelled) {
    order.status = "Cancelled";
    order.cancelReason = "All individual items cancelled";
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
  if (!order || order.status !== "Delivered") {
    throw new Error("Invalid return request. Order must be delivered.");
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