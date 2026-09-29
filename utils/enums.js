/**
 * Application-wide Enum definitions for Order, Item, Payment, Offer, Coupon, Category, Variant, and Wallet statuses.
 */

export const ORDER_STATUS = Object.freeze({
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUEST: "Return Request",
  RETURNED: "Returned",
  RETURN_REJECTED: "Return Rejected",
  PAYMENT_FAILED: "Payment Failed"
});

export const ITEM_STATUS = Object.freeze({
  ACTIVE: "Active",
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUEST: "Return Request",
  RETURNED: "Returned",
  RETURN_REJECTED: "Return Rejected"
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "Pending",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed"
});

export const PAYMENT_METHOD = Object.freeze({
  COD: "COD",
  WALLET: "Wallet",
  RAZORPAY: "Razorpay"
});

export const OFFER_TYPE = Object.freeze({
  PRODUCT: "Product",
  CATEGORY: "Category",
  REFERRAL: "Referral"
});

export const DISCOUNT_TYPE = Object.freeze({
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed Amount"
});

export const CATEGORY_STATUS = Object.freeze({
  ACTIVE: "Active",
  DRAFT: "Draft"
});

export const VARIANT_STATUS = Object.freeze({
  AVAILABLE: "Available",
  OUT_OF_STOCK: "out of stock",
  DISCONTINUED: "Discontinued"
});

export const WALLET_TRANSACTION_TYPE = Object.freeze({
  CREDIT: "credit",
  DEBIT: "debit"
});

export const WALLET_TRANSACTION_STATUS = Object.freeze({
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed"
});

export default {
  ORDER_STATUS,
  ITEM_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  OFFER_TYPE,
  DISCOUNT_TYPE,
  CATEGORY_STATUS,
  VARIANT_STATUS,
  WALLET_TRANSACTION_TYPE,
  WALLET_TRANSACTION_STATUS
};
