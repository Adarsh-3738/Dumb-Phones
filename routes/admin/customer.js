import express from "express";
import * as customerController from "../../controller/admin/customerController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/users", adminAuth, customerController.customerInfo);
router.patch("/blockCustomer", adminAuth, customerController.customerBlocked);
router.patch("/unblockCustomer", adminAuth, customerController.customerunBlocked);

export default router;
