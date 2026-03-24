import express from "express";
import * as categoryController from "../../controller/admin/categoryController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/category", adminAuth, categoryController.categoryInfo);
router.post("/category/add", adminAuth, categoryController.addCategory);
router.patch("/category/edit", categoryController.editCategory);
router.delete("/category/delete", categoryController.deleteCategory);

export default router;
