import mongoose from "mongoose";

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    productName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    // Only to show options in UI
    attributes: {
      colors: [String]
    },

    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", ProductSchema);
