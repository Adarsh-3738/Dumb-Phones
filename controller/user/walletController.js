import {
  getOrCreateWallet,
  addMoneyToWallet
} from "../../services/user/walletService.js";


import Razorpay from "razorpay";
import crypto from "crypto";
import STATUS_CODES from "../../utils/statusCodes.js";

// Load wallet page
export const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user?._id || req.user?._id;
    if (!userId) return res.redirect('/login');

    const wallet = await getOrCreateWallet(userId);

    // PAGINATION LOGIC
    const page = parseInt(req.query.page) || 1; // Get current page, default is 1
    const limit = 10; // Show 10 transactions per page
    
    //Copy and sort all transactions by date (newest first)
    let allTransactions = [...wallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    //Calculate Total Pages
    const totalTransactions = allTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    
    //Slice the array for the current page
    const skip = (page - 1) * limit;
    const paginatedTransactions = allTransactions.slice(skip, skip + limit);
    

    
    res.render("user/wallet", { 
      wallet, 
      paginatedTransactions, 
      currentPage: page, 
      totalPages 
    });

  } catch (error) {
    console.error("Wallet Load Error:", error);
    res.redirect("/");
  }
};



// Initiate Razorpay Top-Up
export const createRazorpayTopUp = async (req, res) => {
  try {
    const userId = req.session.user?._id || req.user?._id;
    if (!userId) return res.json({ success: false, message: "Unauthorized" });

    const { amount } = req.body;
    if (!amount || amount < 100) return res.json({ success: false, message: "Minimum top-up is ₹100" });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: "wallet_topup_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      razorpayOrderId: order.id,
      amount: amount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Razorpay Add Money Error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// Verify Razorpay Top-Up
export const verifyRazorpayTopUp = async (req, res) => {
  try {
    const userId = req.session.user?._id || req.user?._id;
    if (!userId) return res.json({ success: false, message: "Unauthorized" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Authentic Payment
      const wallet = await addMoneyToWallet(userId, amount, "Top-up via Razorpay");
      if (!wallet) return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to credit Wallet DB" });
      
      res.json({ success: true, message: "Wallet recharged successfully!" });
    } else {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" });
  }
};