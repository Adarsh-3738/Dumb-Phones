import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const { Schema } = mongoose;

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => "ORD-" + uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase(),
    unique: true
  },

userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderedItems: [
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    variant: {                    
    type: Schema.Types.ObjectId,
    ref: "Variant",
    required: true
  },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      default: 0
    },
    itemStatus: {
      type: String,
      enum: ["Active", "Cancelled", "Return Request", "Returned", "Return Rejected"],
      default: "Active"
    },
    cancelReason: {
      type: String,
      default: ""
    },
    returnReason: {
      type: String,
      default: ""
    }

  }
],
  totalPrice: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  shipping: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
 address: {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressType: String,
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true }
}
,

  invoiceDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Pending",
      "Processing",
      "Shipped",
       "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Return Request",
      "Returned",
      "Return Rejected",
      "Payment Failed"
    ]
  },
  cancelReason: {
    type: String,
    default: ""
  },
  returnReason: {
    type: String,
    default: ""
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
  },
  couponApplied: {
    type: Boolean,
    default: false
  },
  couponId: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "Wallet", "Razorpay"],
    default: "COD",
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Refunded", "Failed"],
    default: "Pending",
    required: true
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
