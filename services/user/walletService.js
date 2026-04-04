import Wallet from "../../models/walletSchema.js";

// Get wallet or create 
export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      transactions: []
    });
  }

  return wallet;
};


// Add money to wallet
export const addMoneyToWallet = async (userId, amount, description = "Wallet Top-up") => {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await getOrCreateWallet(userId);
    if (!wallet) return null;
  }

  // Use Atomic updating to eliminate double-adds on race conditions
  wallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: { balance: Number(amount) },
      $push: { 
        transactions: {
          amount: Number(amount),
          type: "credit",
          description: description,
          status: "success"
        } 
      }
    },
    { new: true }
  );

  return wallet;
};