import mongoose from "mongoose";
import { WALLET_TRANSACTION_TYPE, WALLET_TRANSACTION_STATUS } from "../utils/enums.js";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(WALLET_TRANSACTION_TYPE),
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
      enum: Object.values(WALLET_TRANSACTION_STATUS),
      default: WALLET_TRANSACTION_STATUS.SUCCESS
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