import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";


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

      await Variant.findByIdAndUpdate(
        item.variant,
        { $inc: { quantity: item.quantity } }
      );

      item.itemStatus = "Cancelled";
    }
  }

  order.status = "Cancelled";
  order.cancelReason = reason || "";

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
  await Variant.findByIdAndUpdate(
    item.variant,
    { $inc: { quantity: item.quantity } }
  );

  // Mark item as cancelled
  item.itemStatus = "Cancelled";
  item.cancelReason = reason || "";

  // Update order totals
  const itemTotal = item.price * item.quantity;
  
  // Recalculate the discount proportionally
  // If the total price was 1000 and discount was 100 (10%),
  // and we cancel a 200 item, we should remove 10% of 200 (20) from the total discount.
  let discountToRemove = 0;
  if (order.totalPrice > 0 && order.discount > 0) {
    const discountPercentage = order.discount / order.totalPrice;
    discountToRemove = Math.round(itemTotal * discountPercentage);
  }

  order.totalPrice = Math.max(0, order.totalPrice - itemTotal);
  order.discount = Math.max(0, order.discount - discountToRemove);

  // Recalculate tax proportionally
  let taxToRemove = 0;
  if (order.totalPrice > 0 && order.tax > 0) {
    const taxPercentage = order.tax / (order.totalPrice + itemTotal);
    taxToRemove = Math.round(itemTotal * taxPercentage);
  } else if (order.totalPrice === 0) {
    // If all items cancelled, remove all tax
    taxToRemove = order.tax;
  }
  order.tax = Math.max(0, order.tax - taxToRemove);
  
  // If no more items are active, shipping (if any) should probably be refunded too, 
  // but for now we'll just recalculate finalAmount based on the new total and discount
  if (order.totalPrice === 0) {
     order.finalAmount = 0;
     order.shipping = 0;
  } else {
     // original finalAmount = totalPrice + tax + shipping - discount
     // so we reduce finalAmount by (itemTotal + taxToRemove - discountToRemove)
     order.finalAmount = Math.max(0, order.finalAmount - (itemTotal + taxToRemove - discountToRemove));
  }

  // Check if ALL items are now cancelled. If so, mark the entire order as cancelled.
  const allCancelled = order.orderedItems.every(i => i.itemStatus === "Cancelled");
  
  if (allCancelled) {
    order.status = "Cancelled";
    order.cancelReason = "All individual items cancelled";
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



 //  SEARCH ORDERS

export const searchUserOrders = async (userId, searchTerm) => {

  const orders = await Order.find({
    userId,
    orderId: { $regex: searchTerm, $options: "i" }
  }).sort({ createdOn: -1 });

  return orders;
};



 //  GET ORDER FOR INVOICE

export const getOrderForInvoice = async (orderId, userId) => {

  const order = await Order.findOne({
    orderId,
    userId
  }).populate("orderedItems.product");

  return order;
};