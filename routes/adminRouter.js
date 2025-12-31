const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin/adminController");
const customerController = require("../controller/admin/customerController");
const categoryController = require("../controller/admin/categoryController");
const productController = require("../controller/admin/productController"); 
const upload = require("../middlewares/multer");
const brandController = require("../controller/admin/brandController");


const { adminAuth } = require("../middlewares/auth");

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
// router.get("/products/add", adminAuth, productController.getAddPage);
router.post("/products/add-product", upload.array("images", 5), productController.addProduct);

router.get("/products/edit/:id", adminAuth, productController.getEditPage);
router.post("/products/edit/:id", upload.array("images", 5), productController.editProduct);
router.post(
  "/products/remove-image",
  adminAuth,
  productController.removeProductImage
);

router.get("/products/delete/:id", adminAuth, productController.softDeleteProduct);



//brand management



// ---------- BRAND ROUTES ----------
// ---------- BRAND ROUTES ----------
router.get("/brands", brandController.getBrands);
router.get("/brands/add", brandController.getAddBrand);
router.post("/brands/add", upload.single("logo"), brandController.postAddBrand);

router.get("/brands/view/:id", brandController.viewBrand);
router.get("/brands/delete/:id", brandController.deleteBrand);

module.exports = router;



module.exports = router;
