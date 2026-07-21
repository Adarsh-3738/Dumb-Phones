import {
  getWishlistItemsService,
  addToWishlistService,
  removeFromWishlistService
} from "../../services/user/wishlistService.js";
import STATUS_CODES from "../../utils/statusCodes.js";

// LOAD WISHLIST PAGE
export const loadWishlist = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const userId = req.user._id;
    const wishlist = await getWishlistItemsService(userId);

    res.render("user/wishlist", {
      user: req.user,
      wishlistItems: wishlist ? wishlist.products : []
    });

  } catch (error) {
    console.error("Load wishlist error:", error);
    res.redirect("/pageNotFound");
  }
};

// ADD TO WISHLIST /AJAX
export const addToWishlist = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        notLoggedIn: true,
        message: "Please login to add to wishlist"
      });
    }

    const { productId } = req.body;
    const result = await addToWishlistService(req.user._id, productId);

    if (result.added) {
      res.json({ success: true, message: "Added to wishlist" });
    } else {
      res.json({ success: false, message: result.message });
    }

  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

// REMOVE FROM WISHLIST /AJAX
export const removeFromWishlist = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Please login" });
    }

    const { productId } = req.body;
    await removeFromWishlistService(req.user._id, productId);

    res.json({ success: true });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" });
  }
};
