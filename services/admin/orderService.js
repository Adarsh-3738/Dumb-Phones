import Order from "../../models/orderSchema.js";
import Variant from "../../models/variantSchema.js";
import Coupon from "../../models/couponSchema.js";
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
    .populate("orderedItems.product")
    .populate("orderedItems.variant");

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
  const statusOrder = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];
  const currentIndex = statusOrder.indexOf(order.status);
  const newIndex = statusOrder.indexOf(status);

  if (currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
    throw new Error(`Cannot revert order status from "${order.status}" to "${status}".`);
  }
  if (order.status === "Returned" && status !== "Returned") {
    throw new Error("Cannot change the status of a returned order.");
  }

  // If approving a return
  if (status === "Returned" && order.status !== "Returned") {
    
    // Add amount back to user's wallet safely (excluding discounts applied)
    await addMoneyToWallet(order.userId, order.finalAmount, `Refund for Returned Order ${order.orderId}`);
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
      await addMoneyToWallet(order.userId, order.finalAmount, `Refund for Admin Cancelled Order ${order.orderId}`);
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

    // Release coupon if applied
    if (order.couponApplied && order.couponId) {
      const coupon = await Coupon.findById(order.couponId);
      if (coupon) {
        coupon.userId = coupon.userId.filter(id => id.toString() !== order.userId.toString());
        await coupon.save();
      }
    }
  }

  order.status = status;
  if (status === "Delivered" && order.paymentMethod === "COD" && order.paymentStatus === "Pending") {
    order.paymentStatus = "Paid";
  }
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
          coupon.userId = coupon.userId.filter(id => id.toString() !== order.userId.toString());
          await coupon.save();
          order.couponApplied = false;
          order.couponId = null;
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

  } else if (status === "Return Rejected") {
    item.itemStatus = "Return Rejected";
  } else {
    throw new Error("Invalid status transition for item");
  }

  // Resolve order status if no items are pending return
  const hasPendingReturns = order.orderedItems.some(i => i.itemStatus === "Return Request");
  if (!hasPendingReturns) {
     const everythingReturnedOrCancelled = order.orderedItems.every(i => i.itemStatus === "Returned" || i.itemStatus === "Cancelled");
     if (everythingReturnedOrCancelled) {
       order.status = "Returned";
     } else {
       order.status = "Delivered";
     }
  }


  if (order.status === "Delivered" && order.paymentMethod === "COD" && order.paymentStatus === "Pending") {
    order.paymentStatus = "Paid";
  }
  await order.save();
  return item;
};