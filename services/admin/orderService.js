import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";
import { addMoneyToWallet } from "../../services/user/walletService.js";
// GET ORDERS WITH FILTER
export const getOrders = async ({ page, limit, search, status, sort }) => {

  const query = {};

  if (search) {
    query.orderId = { $regex: search, $options: "i" };
  }

  if (status) {
    query.status = status;
  }

  // sorting
  let sortOption = { createdOn: -1 };

  switch (sort) {
    case "date_asc":
      sortOption = { createdOn: 1 };
      break;

    case "date_desc":
      sortOption = { createdOn: -1 };
      break;

    case "amount_asc":
      sortOption = { finalAmount: 1 };
      break;

    case "amount_desc":
      sortOption = { finalAmount: -1 };
      break;
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(query)
    .populate("userId", "name email")
    .populate("address")
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const totalOrders = await Order.countDocuments(query);
  const totalPages = Math.ceil(totalOrders / limit);

  return { orders, totalPages };
};


// GET SINGLE ORDER
export const getOrderDetails = async (orderId) => {

  const order = await Order.findById(orderId)
    .populate("userId", "name email phone")
    .populate("orderedItems.product");

  return order;
};

// UPDATE ORDER STATUS

export const changeOrderStatus = async (orderId, status) => {

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // Strict transition blocks
  if (order.status === "Cancelled" && status !== "Cancelled") {
    throw new Error("Cannot change the status of a cancelled order.");
  }
  if (order.status === "Delivered" && status === "Cancelled") {
    throw new Error("Cannot cancel an order that has already been delivered.");
  }
  if (order.status === "Returned" && status !== "Returned") {
    throw new Error("Cannot change the status of a returned order.");
  }

  // If approving a return
  if (status === "Returned" && order.status !== "Returned") {
    
    // Add amount back to user's wallet safely (excluding discounts applied)
    await addMoneyToWallet(order.userId, order.finalAmount, "Refund for Returned Order");
    order.paymentStatus = "Refunded";

    // Restore inventory and mark items as cancelled/returned
    for (const item of order.orderedItems) {
      if (item.itemStatus !== "Cancelled") {
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
  }

  // If admin is cancelling the entire order that hasn't been cancelled/returned yet
  if (status === "Cancelled" && order.status !== "Cancelled" && order.status !== "Returned") {
    
    // Refund to Wallet only if the user actually paid 
    if (order.paymentMethod !== "COD" || order.paymentStatus === "Paid") {
      await addMoneyToWallet(order.userId, order.finalAmount, "Refund for Admin Cancelled Order");
      order.paymentStatus = "Refunded";
    }

    for (const item of order.orderedItems) {
      if (item.itemStatus !== "Cancelled") {
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
  }

  order.status = status;
  await order.save();

  return order;
};