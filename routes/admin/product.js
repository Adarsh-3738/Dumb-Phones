import express from "express";
import * as productController from "../../controller/admin/productController.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

router.get("/products", productController.getProducts);
router.post("/products/add-product", upload.any(), productController.addProduct);
router.get("/products/edit/:id", productController.getEditPage);
router.patch("/products/edit/:id", upload.any(), productController.editProduct);
router.post("/products/remove-image", productController.removeProductImage);
router.get("/products/delete/:id", productController.softDeleteProduct);

export default router;
