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
  if (order.status === "Delivered" && ["Pending", "Processing", "Shipped", "Out for Delivery"].includes(status)) {
    throw new Error("Cannot rollback a Delivered order to a previous status.");
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
        item.itemStatus = "Returned";
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


// CHANGE SINGLE ITEM STATUS

export const changeOrderItemStatus = async (orderId, itemId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.orderedItems.find(i => i._id.toString() === itemId);
  if (!item) throw new Error("Item not found");

  // Prevent invalid transitions
  if (item.itemStatus !== "Return Request") {
    throw new Error(`Item relies on Return Request state. Current state: ${item.itemStatus}`);
  }

  if (status === "Returned") {
    const variantObj = await Variant.findById(item.variant);
    const regularPrice = (variantObj && variantObj.regularPrice > item.price) ? variantObj.regularPrice : item.price;
    const regularItemTotal = regularPrice * item.quantity;
    
    // Provide proper refunds
    let discountToRemove = 0;
    if (regularPrice > item.price) {
      discountToRemove = (regularPrice - item.price) * item.quantity;
    }
    
    // Safeguard order totals
    discountToRemove = Math.min(discountToRemove, Math.max(0, order.discount));

    order.totalPrice = Math.max(0, order.totalPrice - regularItemTotal);
    order.discount = Math.max(0, order.discount - discountToRemove);

    let taxToRemove = 0;
    if (order.totalPrice > 0 && order.tax > 0) {
      const saleItemTotal = item.price * item.quantity;
      const previousSaleTotal = (order.totalPrice + regularItemTotal) - (order.discount + discountToRemove);
      if (previousSaleTotal > 0) {
         taxToRemove = Math.round(saleItemTotal * (order.tax / previousSaleTotal));
      }
    } else if (order.totalPrice === 0) {
      taxToRemove = order.tax;
    }
    
    order.tax = Math.max(0, order.tax - taxToRemove);

    const refundAmount = (regularItemTotal + taxToRemove) - discountToRemove;

    if (order.totalPrice === 0) {
       order.finalAmount = 0;
       order.shipping = 0;
    } else {
       order.finalAmount = Math.max(0, order.finalAmount - refundAmount);
    }

    // Provide Wallet refund safely 
    if (order.paymentStatus === "Paid" || order.paymentMethod === "Wallet") {
      if (refundAmount > 0) {
        await addMoneyToWallet(order.userId, refundAmount, `Refund for Returned Item in Order ${order.orderId}`);
      }
    }

    // Restore Inventory
    if (variantObj) {
      variantObj.quantity += item.quantity;
      if (variantObj.status === "out of stock" && variantObj.quantity > 0) {
        variantObj.status = "Available";
      }
      await variantObj.save();
    }

    item.itemStatus = "Returned";

    // Detect if ALL items are resolved now
    const allItemsResolved = order.orderedItems.every(i => 
       i.itemStatus === "Returned" || i.itemStatus === "Cancelled" || i.itemStatus === "Return Rejected"
    );
    if (allItemsResolved) {
       // If every single item is eventually returned or cancelled, mark the entire order
       const everythingReturned = order.orderedItems.every(i => i.itemStatus === "Returned" || i.itemStatus === "Cancelled");
       if (everythingReturned) {
         order.status = "Returned";
       }
    }

  } else if (status === "Return Rejected") {
    item.itemStatus = "Return Rejected";
  } else {
    throw new Error("Invalid status transition for item");
  }

  await order.save();
  return item;
};