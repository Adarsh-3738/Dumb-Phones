import express from "express";
import * as offerController from "../../controller/admin/offerController.js";
import { adminAuth } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/offers", adminAuth, offerController.getOffers);
router.post("/offers/sync", adminAuth, offerController.syncAllOffers);
router.post("/offers/add", adminAuth, offerController.addOffer);
router.patch("/offers/edit/:id", adminAuth, offerController.editOffer);
router.patch("/offers/toggle-status/:id", adminAuth, offerController.toggleOfferStatus);
router.delete("/offers/delete/:id", adminAuth, offerController.deleteOffer);

export default router;
