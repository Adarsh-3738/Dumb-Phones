import express from "express";
import * as salesController from "../../controller/admin/salesController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/sales-report", adminAuth, salesController.getSalesReport);
router.get("/sales-report/pdf", adminAuth, salesController.downloadPdf);
router.get("/sales-report/excel", adminAuth, salesController.downloadExcel);

export default router;
