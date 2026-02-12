import express from "express";

import * as adminController from "../controller/admin/adminController.js";
import * as customerController from "../controller/admin/customerController.js";
import * as categoryController from "../controller/admin/categoryController.js";
import * as productController from "../controller/admin/productController.js";
import * as brandController from "../controller/admin/brandController.js";
import * as orderController from "../controller/admin/orderController.js"
import upload from "../middlewares/multer.js";
import { adminAuth } from "../middlewares/auth.js";

const router = express.Router();

// Redirect to login
router.get("/", (req, res) => {
  res.redirect("/admin/login");
});

// Admin Routes
router.get("/pageerror", adminController.pageerror);

router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);

router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get("/logout", adminController.logout);

// User Management
router.get("/users", adminAuth, customerController.customerInfo);
router.post("/blockCustomer", adminAuth, customerController.customerBlocked);
router.post("/unblockCustomer", adminAuth, customerController.customerunBlocked);

// Category Management
router.get("/category", adminAuth, categoryController.categoryInfo);
router.post("/category/add", adminAuth, categoryController.addCategory);
router.post("/category/edit", categoryController.editCategory);
router.post("/category/delete", categoryController.deleteCategory);

// Product Management
router.get("/products", adminAuth, productController.getProducts);

router.post(
  "/products/add-product",
  upload.array("images", 5),
  productController.addProduct
);

router.get("/products/edit/:id", adminAuth, productController.getEditPage);

router.post(
  "/products/edit/:id",
  upload.array("images", 5),
  productController.editProduct
);

router.post(
  "/products/remove-image",
  adminAuth,
  productController.removeProductImage
);

router.get(
  "/products/delete/:id",
  adminAuth,
  productController.softDeleteProduct
);

// Brand Management
router.get("/brands", brandController.getBrands);
router.get("/brands/add", brandController.getAddBrand);
router.post("/brands/add", upload.single("logo"), brandController.postAddBrand);

router.get("/brands/view/:id", brandController.viewBrand);
router.get("/brands/delete/:id", brandController.deleteBrand);



//order-management
// List orders with pagination/search/filter
router.get("/orders", adminAuth, orderController.loadOrders);
// Order details
router.get("/orders/:orderId",adminAuth, orderController.loadOrderDetails);
// Update order status
router.post("/orders/:orderId/status", adminAuth, orderController.updateOrderStatus);




export default router;
