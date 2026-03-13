import Cart from "../../models/cartSchema.js";
import Address from "../../models/addressSchema.js";
import Variant from "../../models/variantSchema.js";
import Order from "../../models/orderSchema.js";
const TAX_RATE = 0.05;
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

    return product &&
      !product.isBlocked &&
      variant &&
      !variant.isBlocked &&
      variant.quantity > 0;
  });

  await cart.save();
  if (cart.items.length === 0) return null;

  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.price * item.quantity;
  });

  const tax = Math.round(subtotal * TAX_RATE);
  const discount = 0;
  const shipping = SHIPPING_COST;
  const total = subtotal + tax + shipping - discount;

  const addressDoc = await Address.findOne({ userId }).lean();

const addresses = addressDoc
  ? addressDoc.address.sort((a, b) => b.isDefault - a.isDefault)
  : [];

  return { cart, addresses, subtotal, tax, discount, shipping, total };
};

// PLACE ORDER SERVICE



export const placeOrderService = async (userId, addressId) => {

  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  // STOCK CHECK
  for (const item of cart.items) {
    const variant = await Variant.findById(item.variantId._id);

    if (!variant || variant.quantity < item.quantity) {
      throw new Error("Stock mismatch");
    }
  }

  // CALCULATIONS
  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.price * item.quantity;
  });

  const tax = Math.round(subtotal * TAX_RATE);
  const shipping = SHIPPING_COST;
  const finalAmount = subtotal + tax + shipping;

  // COPY ITEMS BEFORE CLEARING CART
  const orderedItems = cart.items.map(item => ({
    product: item.productId._id,
    variant: item.variantId._id,
    quantity: item.quantity,
    price: item.price,
    status: "Active"
  }));

  // CREATE ORDER 
  // Find address document
const addressDoc = await Address.findOne({ userId });

if (!addressDoc) throw new Error("Address not found");

const selectedAddress = addressDoc.address.id(addressId);

if (!selectedAddress) throw new Error("Invalid address");

// CREATE ORDER
const order = await Order.create({
  userId,

  orderedItems: orderedItems,   

  totalPrice: subtotal,
  tax: tax,
  shipping: shipping,
  discount: 0,
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

  status: "Pending"
});
  // REDUCE STOCK
  for (const item of cart.items) {
    await Variant.updateOne(
      { _id: item.variantId._id },
      { $inc: { quantity: -item.quantity } }
    );
  }

  // CLEAR CART
  cart.items = [];
  await cart.save();

  return order;
};