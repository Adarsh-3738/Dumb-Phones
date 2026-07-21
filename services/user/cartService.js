import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import Wishlist from "../../models/wishlistSchema.js";
import Variant from "../../models/variantSchema.js";
import Coupon from "../../models/couponSchema.js";

const MAX_QTY = 5;



  // CHECK IF CART ITEM IS UNAVAILABLE

export const isItemUnavailable = (item) => {
  const product = item.productId;
  const variant = item.variantId;

  return (
    !product ||
    !variant ||
    product.isBlocked ||
    variant.isBlocked ||
    variant.quantity <= 0 ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted ||
    product.category.status !== "Active" ||
    !product.brand ||
    product.brand.isBlocked ||
    product.status === "Discontinued"
  );
};

  // GET CART DATA

export const getCartData = async (userId) => {

  const cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      populate: [{ path: "category" }, { path: "brand" }]
    })
    .populate("items.variantId");

  if (cart) {
    // Modify item prices and quantities for available items
    // Unavailable items are kept in the cart but their totalPrice is set to 0
    cart.items.forEach(item => {
      const variant = item.variantId;

      if (!isItemUnavailable(item)) {
        // Ensure users cannot checkout with an old cached price
        if (item.price !== variant.salesPrice) {
          item.price = variant.salesPrice;
        }

        // Ensure cart quantity doesn't exceed available variant quantity
        if (item.quantity > variant.quantity) {
          item.quantity = variant.quantity;
        }

        // Re-calculate total price
        item.totalPrice = item.quantity * item.price;
      } else {
        item.totalPrice = 0;
      }
    });

    if (cart.appliedCoupon) {
      const coupon = await Coupon.findById(cart.appliedCoupon);
      if (coupon) {
        let subtotal = cart.items.reduce((sum, item) => {
          return sum + (isItemUnavailable(item) ? 0 : item.totalPrice);
        }, 0);
        const now = new Date();
        const expiry = new Date(coupon.expireOn);
        expiry.setHours(23, 59, 59, 999);
        const hasUsed = coupon.userId && coupon.userId.some(id => id.toString() === userId.toString());
        if (now > expiry || subtotal < coupon.minimumPrice || hasUsed) {
          cart.appliedCoupon = null;
        }
      } else {
        cart.appliedCoupon = null;
      }
    }

    await cart.save();
  }

  return cart;
};



 //  ADD TO CART

export const addToCartService = async (userId, productId, variantId, quantity = 1) => {

  const product = await Product.findById(productId).populate("category").populate("brand");

  if (
    !product ||
    product.isBlocked ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted ||
    product.category.status !== "Active" ||
    !product.brand ||
    product.brand.isBlocked ||
    product.status === "Discontinued"
  ) {
    throw new Error("Product unavailable");
  }

  const variant = await Variant.findOne({
    _id: variantId,
    productId,
    isBlocked: false
  });

  if (!variant || variant.quantity <= 0) {
    throw new Error("Variant unavailable");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {

    cart = await Cart.create({
      userId,
      items: [{
        productId,
        variantId,
        quantity,
        price: variant.salesPrice,
        totalPrice: quantity * variant.salesPrice
      }]
    });

  } else {

    const item = cart.items.find(
      i =>
        i.productId.equals(productId) &&
        i.variantId.equals(variantId)
    );

    if (item) {

      if (
        item.quantity + quantity > MAX_QTY ||
        item.quantity + quantity > variant.quantity
      ) {
        throw new Error("Quantity limit reached");
      }

      item.quantity += quantity;
      item.totalPrice = item.quantity * item.price;

    } else {

      cart.items.push({
        productId,
        variantId,
        quantity,
        price: variant.salesPrice,
        totalPrice: quantity * variant.salesPrice
      });

    }

    await cart.save();
  }

  // Auto-revalidate coupon
  await revalidateCartCoupon(userId, cart);

  await Wishlist.updateOne(
    { userId },
    { $pull: { products: { productId: productId } } }
  );

  return true;
};



//   INCREMENT QTY 


export const incrementQtyService = async (userId, variantId) => {

  const cart = await Cart.findOne({ userId }).populate("items.variantId");

  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(i =>
    i.variantId._id.equals(variantId)
  );

  if (!item) throw new Error("Item not found");

  const Product = await import("../../models/productSchema.js").then(m => m.default);
  const product = await Product.findById(item.productId).populate("category").populate("brand");

  if (
    !product ||
    product.isBlocked ||
    product.status === "Discontinued" ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted ||
    product.category.status !== "Active" ||
    !product.brand ||
    product.brand.isBlocked ||
    !item.variantId ||
    item.variantId.isBlocked ||
    item.variantId.quantity <= 0
  ) {
    throw new Error("This product is currently unavailable.");
  }

  if (
    item.quantity >= MAX_QTY ||
    item.quantity >= item.variantId.quantity
  ) {
    throw new Error("Quantity limit reached");
  }

  item.quantity += 1;
  item.totalPrice = item.quantity * item.price;

  await cart.save();
  await revalidateCartCoupon(userId, cart);

  return true;
};



 //  DECREMENT QTY

export const decrementQtyService = async (userId, variantId) => {

  const cart = await Cart.findOne({ userId });

  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(i =>
    i.variantId.equals(variantId)
  );

  if (!item || item.quantity <= 1) {
    throw new Error("Minimum quantity reached");
  }

  item.quantity -= 1;
  item.totalPrice = item.quantity * item.price;

  await cart.save();
  await revalidateCartCoupon(userId, cart);

  return true;
};



//  REMOVE FROM CART

export const removeFromCartService = async (userId, variantId) => {

  await Cart.updateOne(
    { userId },
    { $pull: { items: { variantId } } }
  );

  await revalidateCartCoupon(userId);

  return true;
};

// HELPER TO REVALIDATE CART COUPON
export const revalidateCartCoupon = async (userId, cart = null) => {
  try {
    const cartDoc = cart || await Cart.findOne({ userId });
    if (!cartDoc || !cartDoc.appliedCoupon) return;

    // Ensure items are populated for availability check
    await cartDoc.populate([
      { path: "items.productId", populate: [{ path: "category" }, { path: "brand" }] },
      { path: "items.variantId" }
    ]);

    const coupon = await Coupon.findById(cartDoc.appliedCoupon);
    if (!coupon) {
      cartDoc.appliedCoupon = null;
      await cartDoc.save();
      return;
    }

    let subtotal = 0;
    cartDoc.items.forEach(item => {
      if (!isItemUnavailable(item)) {
        subtotal += item.totalPrice;
      }
    });

    const now = new Date();
    const start = new Date(coupon.startDate);
    start.setHours(0, 0, 0, 0);
    const expiry = new Date(coupon.expireOn);
    expiry.setHours(23, 59, 59, 999);

    const hasUsed = coupon.userId && coupon.userId.some(id => id.toString() === userId.toString());

    if (now < start || now > expiry || subtotal < coupon.minimumPrice || hasUsed) {
      cartDoc.appliedCoupon = null;
      await cartDoc.save();
    }
  } catch (error) {
    console.error("Coupon revalidation error:", error);
  }
};
