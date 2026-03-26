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

  // If approving a return
  if (status === "Returned" && order.status !== "Returned") {
    
    // Add amount back to user's wallet safely
    await addMoneyToWallet(order.userId, order.finalAmount, "Refund for Returned Order");

    // Restore inventory and mark items as cancelled/returned
    for (const item of order.orderedItems) {
      if (item.itemStatus !== "Cancelled") {
        await Variant.findByIdAndUpdate(
          item.variant,
          { $inc: { quantity: item.quantity } }
        );
        item.itemStatus = "Cancelled";
      }
    }
  }

  // If admin is cancelling the entire order that hasn't been cancelled/returned yet
  if (status === "Cancelled" && order.status !== "Cancelled" && order.status !== "Returned") {
    // If payment was already made, we should refund, 
    // but typically only Online/Wallet payments would require a refund upon pre delivery cancellation. 
    // Assuming for now it's requested to refund on cancelled orders too if paid but safe to just restore inventory.
    for (const item of order.orderedItems) {
      if (item.itemStatus !== "Cancelled") {
        await Variant.findByIdAndUpdate(
          item.variant,
          { $inc: { quantity: item.quantity } }
        );
        item.itemStatus = "Cancelled";
      }
    }
  }

  order.status = status;
  await order.save();

  return order;
};