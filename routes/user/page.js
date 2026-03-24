import express from "express";
import * as userController from "../../controller/user/userController.js";
import * as productController from "../../controller/user/productController.js";
import alreadyLoggedIn from "../../middlewares/alreadyLoggedin.js";
import protect from "../../middlewares/protect.js";

const router = express.Router();

router.get("/pageNotFound", userController.pageNotFound);
router.get("/", userController.loadHomepage);
router.get("/logout", userController.logout);
router.get("/signup", alreadyLoggedIn, userController.loadSignup);

router.get("/products", productController.getProducts);
router.get("/shop", protect, userController.loadShopPage);
router.get("/product/:id", productController.loadProductDetails);

export default router;
