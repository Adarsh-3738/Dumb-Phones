import express from "express";
import * as settingsController from "../../controller/admin/settingsController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/settings", adminAuth, settingsController.getSettings);
router.post("/settings/update", adminAuth, settingsController.updateSettings);

export default router;
