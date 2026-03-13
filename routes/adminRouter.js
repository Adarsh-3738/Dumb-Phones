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
router.patch("/blockCustomer", adminAuth, customerController.customerBlocked);
router.patch("/unblockCustomer", adminAuth, customerController.customerunBlocked);

// Category Management
router.get("/category", adminAuth, categoryController.categoryInfo);
router.post("/category/add", adminAuth, categoryController.addCategory);
router.patch("/category/edit", categoryController.editCategory);
router.delete("/category/delete", categoryController.deleteCategory);



// Product Management
router.get("/products", productController.getProducts);

// ADD PRODUCT
router.post(
  "/products/add-product",
  upload.any(),
  productController.addProduct
);

// LOAD EDIT PAGE 
router.get(
  "/products/edit/:id",
  productController.getEditPage
);

// UPDATE PRODUCT
router.patch(
  "/products/edit/:id",
  upload.any(),
  productController.editProduct
);

// REMOVE SINGLE IMAGE
router.post("/products/remove-image", productController.removeProductImage);

// SOFT DELETE / TOGGLE BLOCK
router.get("/products/delete/:id", productController.softDeleteProduct);





// Brand Management

// LIST PAGE
router.get("/brands", brandController.loadBrands);
// ADD BRAND 
router.post("/brand/add", brandController.addBrand);
// UPDATE BRAND
router.patch("/brand/edit/:id", brandController.editBrand);
// DELETE BRAND
router.delete("/brand/delete/:id", brandController.deleteBrand);


//order-management
// List orders 
router.get("/orders", adminAuth, orderController.loadOrders);
// Order details
router.get("/orders/:orderId",adminAuth, orderController.loadOrderDetails);
// Update order status
router.post("/orders/:orderId/status", adminAuth, orderController.updateOrderStatus);




export default router;
