import Cart from "../../models/cartSchema.js";
import Address from "../../models/addressSchema.js";
import Variant from "../../models/variantSchema.js";
import Order from "../../models/orderSchema.js";
import Settings from "../../models/settingsSchema.js";
import Wallet from "../../models/walletSchema.js";
import Coupon from "../../models/couponSchema.js";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";
const SHIPPING_COST = 0;


// GET CHECKOUT DATA

export const getCheckoutData = async (userId) => {

  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId");

  if (!cart || cart.items.length === 0) return null;

  cart.items = cart.items.filter(item => {
    const product = item.productId;
    const variant = item.variantId;

    if (!product || product.isBlocked || !variant || variant.isBlocked || variant.quantity <= 0) {
      return false;
    }

    if (item.quantity > variant.quantity) {
      item.quantity = variant.quantity;
    }

    if (item.price !== variant.salesPrice) {
      item.price = variant.salesPrice;
    }

    item.totalPrice = item.quantity * item.price;

    return true;
  });

  await cart.save();
  if (cart.items.length === 0) return null;

  let subtotal = 0; // Will hold the total regular price
  let salePriceSubtotal = 0; // The actual money the user is paying before tax/shipping
  let totalSavings = 0;

  cart.items.forEach(item => {
    // If the item has a valid variant with a regular price that is greater than the sale price
    if (item.variantId && item.variantId.regularPrice && item.variantId.regularPrice > item.price) {
      subtotal += item.variantId.regularPrice * item.quantity;
      totalSavings += (item.variantId.regularPrice - item.price) * item.quantity;
    } else {
      subtotal += item.price * item.quantity;
    }
    salePriceSubtotal += item.price * item.quantity;
  });

  const settings = await Settings.findOne();
  const taxRate = settings ? settings.taxRate / 100 : 0.05;

  let couponDeduction = 0;
  let appliedCouponCode = null;

  if (cart.appliedCoupon) {
    const couponId = cart.appliedCoupon._id || cart.appliedCoupon;
    const coupon = await Coupon.findById(couponId);
    
    if (coupon) {
      // Secure End OF Day Expiry
      const now = new Date();
      const expiry = new Date(coupon.expireOn);
      expiry.setHours(23, 59, 59, 999);

      const hasUsed = coupon.userId && coupon.userId.some(id => id.toString() === userId.toString());

      if (now <= expiry && salePriceSubtotal >= coupon.minimumPrice && !hasUsed) {
        if (coupon.discountType === "Percentage") {
          let calcDeduction = Math.floor((salePriceSubtotal * coupon.offerPrice) / 100);
          if (coupon.maxDiscountAmount && calcDeduction > coupon.maxDiscountAmount) {
            calcDeduction = coupon.maxDiscountAmount;
          }
          couponDeduction = Math.min(calcDeduction, salePriceSubtotal);
        } else {
          couponDeduction = Math.min(coupon.offerPrice, salePriceSubtotal);
        }
        appliedCouponCode = coupon.name;
      } else {
        await Cart.findByIdAndUpdate(cart._id, { $set: { appliedCoupon: null } });
        cart.appliedCoupon = null;
      }
    } else {
       await Cart.findByIdAndUpdate(cart._id, { $set: { appliedCoupon: null } });
       cart.appliedCoupon = null;
    }
  }

  // Tax is calculated on the actual amount paid for items after coupon deduction
  const taxableAmount = Math.max(0, salePriceSubtotal - couponDeduction);
  const tax = Math.round(taxableAmount * taxRate);
  const discount = totalSavings + couponDeduction;
  const shipping = SHIPPING_COST;
  
  let total = subtotal + tax + shipping - discount;
  if (total < 0) total = 0;

  const addressDoc = await Address.findOne({ userId }).lean();

  const addresses = addressDoc
    ? addressDoc.address.sort((a, b) => b.isDefault - a.isDefault)
    : [];

  return { cart, addresses, subtotal, tax, discount, shipping, total, totalSavings, couponDeduction, appliedCouponCode };
};

// PLACE ORDER SERVICE



export const placeOrderService = async (userId, addressId, paymentMethod = "COD") => {

  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId");

  if (!cart || cart.items.length === 0) {
    throw new Error("Your shopping cart is currently empty. Please add items to your cart before proceeding to checkout.");
  }

// CALCULATIONS
  let subtotal = 0; // Regular price sum
  let salePriceSubtotal = 0; // Sale price sum
  let totalSavings = 0;

  // ATOMIC STOCK REDUCTION TO PREVENT RACE CONDITIONS
  const reservedStock = [];
  try {
    for (const item of cart.items) {
      const product = item.productId;
      const variant = item.variantId;

      if (
        !product ||
        product.isBlocked ||
        product.status === "Discontinued" ||
        !variant ||
        variant.isBlocked
      ) {
        throw new Error(`Item "${product?.productName || 'Product'}" is currently unavailable.`);
      }

      // Deduct atomically only if enough quantity exists
      const variantDoc = await Variant.findOneAndUpdate(
        { _id: item.variantId._id, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!variantDoc) {
        throw new Error(`Item "${item.productId.productName}" is out of stock! Someone just bought the last one.`);
      }

      // If quantity drops to exactly 0, automatically toggle status to 'out of stock'
      if (variantDoc.quantity === 0) {
        variantDoc.status = "out of stock";
        await variantDoc.save();
      }

      reservedStock.push({ variantId: item.variantId._id, quantity: item.quantity });
    }
  } catch (err) {
    // If one item fails, safely rollback any previously reserved items in the loop
    for (const reserved of reservedStock) {
      const v = await Variant.findById(reserved.variantId);
      if (v) {
        v.quantity += reserved.quantity;
        if (v.status === "out of stock" && v.quantity > 0) {
          v.status = "Available";
        }
        await v.save();
      }
    }
    throw err;
  }

  let order;

  try {
    cart.items.forEach(item => {
      if (item.variantId && item.variantId.regularPrice && item.variantId.regularPrice > item.price) {
        subtotal += item.variantId.regularPrice * item.quantity;
        totalSavings += (item.variantId.regularPrice - item.price) * item.quantity;
      } else {
        subtotal += item.price * item.quantity;
      }
      salePriceSubtotal += item.price * item.quantity;
    });

  const settings = await Settings.findOne();
  const taxRate = settings ? settings.taxRate / 100 : 0.05;

  let couponDeduction = 0;
  let couponApplied = false;

  if (cart.appliedCoupon) {
    const couponId = cart.appliedCoupon._id || cart.appliedCoupon;
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      throw new Error("The applied coupon is invalid or does not exist.");
    }
    
    const now = new Date();
    const expiry = new Date(coupon.expireOn);
    expiry.setHours(23, 59, 59, 999);
    
    const hasUsed = coupon.userId && coupon.userId.some(id => id.toString() === userId.toString());

    if (now > expiry) {
      throw new Error("The applied coupon has expired.");
    }
    
    if (salePriceSubtotal < coupon.minimumPrice) {
      throw new Error(`The applied coupon requires a minimum purchase of ₹${coupon.minimumPrice.toLocaleString('en-IN')}.`);
    }
    
    if (hasUsed) {
      throw new Error("You have already used this coupon code.");
    }

    if (coupon.discountType === "Percentage") {
      let calcDeduction = Math.floor((salePriceSubtotal * coupon.offerPrice) / 100);
      if (coupon.maxDiscountAmount && calcDeduction > coupon.maxDiscountAmount) {
        calcDeduction = coupon.maxDiscountAmount;
      }
      couponDeduction = Math.min(calcDeduction, salePriceSubtotal);
    } else {
      couponDeduction = Math.min(coupon.offerPrice, salePriceSubtotal);
    }
    coupon.userId.push(userId);
    await coupon.save();
    couponApplied = true;
  }

  const taxableAmount = Math.max(0, salePriceSubtotal - couponDeduction);
  const tax = Math.round(taxableAmount * taxRate);
  const discount = totalSavings + couponDeduction;
  const shipping = SHIPPING_COST;
  let finalAmount = subtotal + tax + shipping - discount;
  if (finalAmount < 0) finalAmount = 0;

  if (paymentMethod === "COD" && finalAmount > 15000) {
    throw new Error("Cash on Delivery is not allowed for orders above ₹15,000. Please choose another payment method.");
  }

  // COPY ITEMS BEFORE CLEARING CART
  const orderedItems = cart.items.map(item => ({
    product: item.productId._id,
    variant: item.variantId._id,
    quantity: item.quantity,
    price: item.price,
    status: "Active"
  }));

  let paymentStatus = "Pending";

  const newOrderId = "ORD-" + uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase();

  // SECURE WALLET TRANSACTION PROCESSING
  if (paymentMethod === "Wallet") {
    // Atomic deduction to avoid double-spend race condition
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId, balance: { $gte: finalAmount } },
      {
        $inc: { balance: -finalAmount },
        $push: {
          transactions: {
            amount: finalAmount,
            type: "debit",
            description: `Payment for Order ${newOrderId}`,
            status: "success"
          }
        }
      },
      { new: true }
    );
    
    if (!updatedWallet) {
      throw new Error("Insufficient Wallet Balance to complete this purchase.");
    }

    paymentStatus = "Paid";
  }

 
  // Find address document
const addressDoc = await Address.findOne({ userId });

if (!addressDoc) throw new Error("We could not locate your delivery address. Please add an address to your profile.");

const selectedAddress = addressDoc.address.id(addressId);

if (!selectedAddress) throw new Error("The selected delivery address is invalid. Please select or add a valid address.");

// CREATE ORDER
order = await Order.create({
  orderId: newOrderId,
  userId,

  orderedItems: orderedItems,   

  totalPrice: subtotal,
  tax: tax,
  shipping: shipping,
  discount: discount,
  finalAmount: finalAmount,

  address: {
    name: selectedAddress.name,
    phone: selectedAddress.phone,
    addressType: selectedAddress.addressType,
    landmark: selectedAddress.landmark,
    city: selectedAddress.city,
    state: selectedAddress.state,
    pincode: selectedAddress.pincode
  },

  couponApplied: couponApplied,
  couponId: couponApplied ? cart.appliedCoupon : null,
  paymentMethod: paymentMethod,
  paymentStatus: paymentStatus,
  status: "Pending"
});
  } catch (error) {
    //  If Wallet fails, DB fails,must return the atomic stock back
    for (const reserved of reservedStock) {
      const v = await Variant.findById(reserved.variantId);
      if (v) {
        v.quantity += reserved.quantity;
        if (v.status === "out of stock" && v.quantity > 0) {
          v.status = "Available";
        }
        await v.save();
      }
    }
    throw error;
  }

  // CLEAR CART
  cart.items = [];
  await cart.save();

  return order;
};

//razorpay payment

export const generateRazorpay = async (orderId, total) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(total * 100), // convert to paise
      currency: "INR",
      receipt: "" + orderId
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    throw new Error("We encountered a problem initiating the Razorpay payment. Please try again or choose a different payment method.");
  }
};
