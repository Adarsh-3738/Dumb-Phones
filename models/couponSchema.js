import mongoose from "mongoose";
import { DISCOUNT_TYPE } from "../utils/enums.js";

const { Schema } = mongoose;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expireOn: {
    type: Date,
    required: true
  },
  offerPrice: {
    type: Number,
    required: true
  },
  discountType: {
    type: String,
    enum: Object.values(DISCOUNT_TYPE),
    default: DISCOUNT_TYPE.FIXED_AMOUNT
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  minimumPrice: {
    type: Number,
    required: true
  },
  isList: {
    type: Boolean,
    default: true
  },
  userId: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
