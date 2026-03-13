import mongoose from "mongoose";

const { Schema } = mongoose;

const VariantSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    color: {
      type: String,
      required: true
    },

    regularPrice: {
      type: Number,
      required: true
    },

    salesPrice: {
      type: Number,
      required: true
    },

    productOffer: {
      type: Number,
      default: 0
    },

    quantity: {
      type: Number,
      required: true
    },

    variantImages: [
      {
        url: String,
        public_id: String
      }
    ],

    status: {
      type: String,
      enum: ["Available", "out of stock", "Discontinued"],
      default: "Available"
    },

    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Variant", VariantSchema);
