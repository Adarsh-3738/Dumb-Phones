import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import Wishlist from "../../models/wishlistSchema.js";

const MAX_QTY = 5;

/* ===========================
   LOAD CART
=========================== */
export const loadCart = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category" }
    });

    // 🧹 Auto-remove blocked / unlisted products
    if (cart) {
      cart.items = cart.items.filter(item =>
        item.productId &&
        !item.productId.isBlocked &&
        item.productId.status === "Available" &&
        item.productId.quantity > 0 &&
        item.productId.category &&
        !item.productId.category.isBlocked &&
        item.productId.category.isListed
      );
      await cart.save();
    }

    res.render("user/cart", {
      cartItems: cart ? cart.items : [],
      user: req.user
    });

  } catch (error) {
    console.error("Load cart error:", error);
    res.redirect("/");
  }
};

/* ===========================
   ADD TO CART
=========================== */
export const addToCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        notLoggedIn: true,
        message: "Please login to add items to cart"
      });
    }

    const userId = req.user._id;
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("category");

    if (
      !product ||
      product.isBlocked ||
      product.status !== "Available" ||
      product.quantity <= 0 ||
      !product.category ||
      product.category.isBlocked ||
      !product.category.isListed
    ) {
      return res.status(400).json({
        success: false,
        message: "Product unavailable"
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{
          productId,
          quantity: 1,
          price: product.salesPrice,
          totalPrice: product.salesPrice
        }]
      });
    } else {
      const item = cart.items.find(i => i.productId.equals(productId));

      if (item) {
        if (item.quantity >= MAX_QTY || item.quantity >= product.quantity) {
          return res.status(400).json({
            success: false,
            message: "Quantity limit reached"
          });
        }

        item.quantity += 1;
        item.totalPrice = item.quantity * item.price;
      } else {
        cart.items.push({
          productId,
          quantity: 1,
          price: product.salesPrice,
          totalPrice: product.salesPrice
        });
      }

      await cart.save();
    }

    await Wishlist.updateOne(
      { userId },
      { $pull: { products: productId } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

/* ===========================
   INCREMENT QUANTITY
=========================== */
export const incrementQty = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false });
    }

    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    const product = await Product.findById(productId).populate("category");

    if (
      !cart ||
      !product ||
      product.isBlocked ||
      product.quantity <= 0 ||
      !product.category ||
      product.category.isBlocked ||
      !product.category.isListed
    ) {
      return res.json({
        success: false,
        message: "Product unavailable"
      });
    }

    const item = cart.items.find(i => i.productId.equals(productId));

    if (
      !item ||
      item.quantity >= MAX_QTY ||
      item.quantity >= product.quantity
    ) {
      return res.json({
        success: false,
        message: "Quantity limit reached"
      });
    }

    item.quantity += 1;
    item.totalPrice = item.quantity * item.price;

    await cart.save();
    res.json({ success: true });

  } catch (error) {
    console.error("Increment error:", error);
    res.json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===========================
   DECREMENT QUANTITY
=========================== */
export const decrementQty = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false });
    }

    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    const product = await Product.findById(productId).populate("category");

    if (
      !cart ||
      !product ||
      product.isBlocked ||
      !product.category ||
      product.category.isBlocked ||
      !product.category.isListed
    ) {
      return res.json({
        success: false,
        message: "Product unavailable"
      });
    }

    const item = cart.items.find(i => i.productId.equals(productId));

    if (!item || item.quantity <= 1) {
      return res.json({
        success: false,
        message: "Minimum quantity reached"
      });
    }

    item.quantity -= 1;
    item.totalPrice = item.quantity * item.price;

    await cart.save();
    res.json({ success: true });

  } catch (error) {
    console.error("Decrement error:", error);
    res.json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===========================
   REMOVE FROM CART
=========================== */
export const removeFromCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login"
      });
    }

    const userId = req.user._id;
    const { productId } = req.params;

    await Cart.updateOne(
      { userId },
      { $pull: { items: { productId } } }
    );

    res.json({
      success: true,
      message: "Item removed from cart"
    });

  } catch (error) {
    console.error("Remove cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
