import {
  getOrCreateWallet,
  addMoneyToWallet
} from "../../services/user/walletService.js";


// Load wallet page
export const loadWallet = async (req, res) => {

  const userId = req.session.user?._id || req.user?._id;

  if (!userId) return res.redirect('/login');

  const wallet = await getOrCreateWallet(userId);

  res.render("user/wallet", { wallet });

};


// Add money
export const addMoney = async (req, res) => {

  const userId = req.session.user?._id || req.user?._id;
  if (!userId) return res.json({ success: false, message: "Unauthorized" });

  const { amount } = req.body;

  const wallet = await addMoneyToWallet(userId, amount);

  if (!wallet) {
    return res.json({ success: false });
  }

  res.json({ success: true });

};