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
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      max: 99
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
    endDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
