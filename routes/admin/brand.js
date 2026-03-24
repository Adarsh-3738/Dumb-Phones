import express from "express";
import * as brandController from "../../controller/admin/brandController.js";

const router = express.Router();

router.get("/brands", brandController.loadBrands);
router.post("/brand/add", brandController.addBrand);
router.patch("/brand/edit/:id", brandController.editBrand);
router.delete("/brand/delete/:id", brandController.deleteBrand);

export default router;
