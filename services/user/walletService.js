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
export const addMoneyToWallet = async (userId, amount) => {
  const wallet = await Wallet.findOne({ userId });

  if (!wallet) return null;

  wallet.balance += Number(amount);

  wallet.transactions.push({
    amount,
    type: "credit",
    description: "Wallet Top-up"
  });

  await wallet.save();

  return wallet;
};