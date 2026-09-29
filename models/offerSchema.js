import mongoose from "mongoose";
import { OFFER_TYPE, DISCOUNT_TYPE } from "../utils/enums.js";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: Object.values(OFFER_TYPE),
      required: true
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      default: DISCOUNT_TYPE.PERCENTAGE
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1
    },
    maxDiscountAmount: {
      type: Number,
      min: 1,
      default: null
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel'
    },
    targetModel: {
      type: String,
      enum: Object.values(OFFER_TYPE)
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
