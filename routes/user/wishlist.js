import express from "express";
import * as wishlistController from "../../controller/user/wishlistController.js";
import protect from "../../middlewares/protect.js";

const router = express.Router();

router.get("/wishlist", protect, wishlistController.loadWishlist);
router.post("/wishlist/add", protect, wishlistController.addToWishlist);
router.delete("/wishlist/remove", protect, wishlistController.removeFromWishlist);

export default router;
