import mongoose from "mongoose";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      required: true
    },

    referenceId: {
      type: String, // orderId / paymentId etc
      default: null
    },

    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success"
    }
  },
  { timestamps: true }
);

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    transactions: [transactionSchema]
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;