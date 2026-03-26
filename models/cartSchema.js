import mongoose from "mongoose";

const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },

      
      variantId: {
        type: Schema.Types.ObjectId,
        ref: "Variant",
        required: true
      },

      quantity: {
        type: Number,
        required: true,
        min: 1
      },

      price: {
        type: Number,
        required: true
      },

      totalPrice: {
        type: Number,
        required: true
      }
    }
  ],
  appliedCoupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    default: null
  }
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;