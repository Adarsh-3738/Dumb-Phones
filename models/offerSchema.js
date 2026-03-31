import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ["Product", "Category", "Referral"],
      required: true
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed Amount"],
      default: "Percentage"
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
      enum: ['Product', 'Category', 'Referral']
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
