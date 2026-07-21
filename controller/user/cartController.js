import {
  getCartData,
  addToCartService,
  incrementQtyService,
  decrementQtyService,
  removeFromCartService
} from "../../services/user/cartService.js";
import STATUS_CODES from "../../utils/statusCodes.js";


 //  LOAD CART

export const loadCart = async (req, res) => {
  try {

    if (!req.user) return res.redirect("/login");

    const userId = req.user._id;

    const cart = await getCartData(userId);

    res.render("user/cart", {
      cartItems: cart ? cart.items : [],
      user: req.user
    });

  } catch (error) {
    console.error("Load cart error:", error);
    res.redirect("/");
  }
};



 //  ADD TO CART

export const addToCart = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        notLoggedIn: true,
        message: "Please login"
      });
    }

    const userId = req.user._id;
    const { productId, variantId, quantity = 1 } = req.body;

    await addToCartService(userId, productId, variantId, quantity);

    res.json({ success: true });

  } catch (error) {

    res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }
};



 //  INCREMENT QTY

export const incrementQty = async (req, res) => {
  try {

    if (!req.user) return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false });

    const userId = req.user._id;
    const { variantId } = req.body;

    await incrementQtyService(userId, variantId);

    res.json({ success: true });

  } catch (error) {

    res.json({
      success: false,
      message: error.message
    });

  }
};



//   DECREMENT QTY

export const decrementQty = async (req, res) => {
  try {

    if (!req.user) return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false });

    const userId = req.user._id;
    const { variantId } = req.body;

    await decrementQtyService(userId, variantId);

    res.json({ success: true });

  } catch (error) {

    res.json({
      success: false,
      message: error.message
    });

  }
};



  // REMOVE FROM CART

export const removeFromCart = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false });
    }

    const userId = req.user._id;
    const { variantId } = req.body;

    await removeFromCartService(userId, variantId);

    res.json({ success: true });

  } catch (error) {

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false });

  }
};