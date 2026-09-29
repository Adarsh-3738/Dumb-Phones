import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { ORDER_STATUS, ITEM_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from "../utils/enums.js";

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
    regularPrice: {
      type: Number,
      default: 0
    },
    itemStatus: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.PENDING
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
  refundedAmount: {
    type: Number,
    default: 0
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
    enum: Object.values(ORDER_STATUS)
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
    enum: Object.values(PAYMENT_METHOD),
    default: PAYMENT_METHOD.COD,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    required: true
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
