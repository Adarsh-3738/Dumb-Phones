import Cart from "../../models/cartSchema.js";
import Order from "../../models/orderSchema.js";
import Address from "../../models/addressSchema.js";

// Get checkout data
export const getCheckoutData = async (userId) => {
  // Fetch user's cart
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    populate: { path: "category" }
  });

  if (!cart || cart.items.length === 0) {
    return null; // Cart empty
  }

  // Fetch user's addresses
  let addressDoc = await Address.findOne({ userId });
  let addresses = [];

  if (addressDoc && Array.isArray(addressDoc.address)) {
    // Ensure one default address
    const hasDefault = addressDoc.address.some(addr => addr.isDefault);
    if (!hasDefault && addressDoc.address.length > 0) {
      addressDoc.address[0].isDefault = true;
      await addressDoc.save();
    }
    addresses = addressDoc.address;
  }

  // Calculate totals
  const subtotal = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const discount = 0; // optional
  const shipping = 50; // fixed
  const total = subtotal + tax + shipping - discount;

  return { cart, addresses, subtotal, tax, discount, shipping, total };
};

// Place order cod

export const placeOrderService = async (userId, addressId) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 🔹 Find user's address document
  const addressDoc = await Address.findOne({ userId });
  if (!addressDoc) throw new Error("Address not found");

  // 🔹 Find selected sub-address
  const selectedAddress = addressDoc.address.id(addressId);
  if (!selectedAddress) throw new Error("Invalid address");

  // 🔹 Prepare ordered items
  let totalPrice = 0;
  const orderedItems = cart.items.map(item => {
    totalPrice += item.price * item.quantity;
    return {
      product: item.productId._id,
      quantity: item.quantity,
      price: item.price
    };
  });

  const discount = 0;
  const shipping = 50;
  const finalAmount = totalPrice + shipping - discount;

  // ✅ CREATE ORDER WITH ADDRESS SNAPSHOT
  const order = await Order.create({
    userId,
    orderedItems,
    totalPrice,
    discount,
    finalAmount,
    address: {
      name: selectedAddress.name,
      phone: selectedAddress.phone,
      addressType: selectedAddress.addressType,
      landmark: selectedAddress.landmark,
      city: selectedAddress.city,
      state: selectedAddress.state,
      pincode: selectedAddress.pincode
    },
    status: "Pending",
    invoiceDate: new Date()
  });

  // 🔹 Clear cart
  cart.items = [];
  await cart.save();

  return order;
};
