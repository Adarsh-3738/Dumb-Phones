import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import Wishlist from "../../models/wishlistSchema.js";
import Variant from "../../models/variantSchema.js";

const MAX_QTY = 5;



  // GET CART DATA

export const getCartData = async (userId) => {

  const cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      populate: { path: "category" }
    })
    .populate("items.variantId");

  if (cart) {
    cart.items = cart.items.filter(item => {

      const product = item.productId;
      const variant = item.variantId;

      if (
        !product ||
        !variant ||
        product.isBlocked ||
        variant.isBlocked ||
        variant.quantity <= 0 ||
        !product.category ||
        !product.category.isListed ||
        product.category.isDeleted ||
        product.status === "Discontinued"
      ) {
        return false;
      }

      // SYNC STALE PRICE - Ensure users cannot checkout with an old cached price
      if (item.price !== variant.salesPrice) {
        item.price = variant.salesPrice;
      }

      // SYNC STOCK - Ensure cart quantity doesn't exceed available variant quantity
      if (item.quantity > variant.quantity) {
        item.quantity = variant.quantity;
      }

      // Re-calculate total price to reflect any changes in quantity or price
      item.totalPrice = item.quantity * item.price;

      return true;
    });

    await cart.save();
  }

  return cart;
};



 //  ADD TO CART

export const addToCartService = async (userId, productId, variantId, quantity = 1) => {

  const product = await Product.findById(productId).populate("category");

  if (
    !product ||
    product.isBlocked ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted ||
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

  if (
    item.quantity >= MAX_QTY ||
    item.quantity >= item.variantId.quantity
  ) {
    throw new Error("Quantity limit reached");
  }

  item.quantity += 1;
  item.totalPrice = item.quantity * item.price;

  await cart.save();

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

  return true;
};



//  REMOVE FROM CART

export const removeFromCartService = async (userId, variantId) => {

  await Cart.updateOne(
    { userId },
    { $pull: { items: { variantId } } }
  );

  return true;
};