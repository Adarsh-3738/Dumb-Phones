import express from "express";
import * as brandController from "../../controller/admin/brandController.js";

const router = express.Router();

router.get("/brands", brandController.loadBrands);
router.post("/brand/add", brandController.addBrand);
router.patch("/brand/edit/:id", brandController.editBrand);
router.patch("/brand/status/:id", brandController.changeBrandStatus);

export default router;
