import * as offerService from "../../services/admin/offerService.js";
import logger from "../../utils/logger.js";
import STATUS_CODES from "../../utils/statusCodes.js";

// Re-export recalculateVariantPrices for backward compatibility
export const recalculateVariantPrices = offerService.recalculateVariantPrices;

export const syncAllOffers = async (req, res) => {
  try {
    await offerService.syncAllOffers();
    res.json({ success: true, message: "All product prices synced to current offers successfully!" });
  } catch (error) {
    logger.error("Error syncing offers", { error });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to sync offers" });
  }
};

export const getOffers = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = 10;

    const { offers, products, categories, totalPages, currentPage } = await offerService.getOffersData({ 
      searchQuery,
      page,
      limit
    });

    res.render("admin/offers", { 
      offers, 
      products, 
      categories, 
      searchQuery,
      totalPages,
      currentPage
    });
  } catch (error) {
    logger.error("Error fetching offers", { error });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/admin-error");
  }
};

export const addOffer = async (req, res) => {
  try {
    const { name, type, discountType, discountValue, maxDiscountAmount, target, startDate, endDate } = req.body;

    if (!name || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerStartDate = offerService.getStartOfDay(startDate);
    const offerEndDate = offerService.getEndOfDay(endDate);
    
    if (offerEndDate < offerStartDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "End Date cannot be before Start Date" });
    }

    if (type === "Referral" && discountType !== "Fixed Amount") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Referral offers must use a Fixed Amount discount type." });
    }

    if (type !== "Referral") {
      const existingOffer = await offerService.findConflictingOffer({
        type,
        target,
        startDate: offerStartDate,
        endDate: offerEndDate
      });
      if (existingOffer) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: `This ${type} already has an active or scheduled offer during the selected dates.` });
      }
    } else {
      const existingReferral = await offerService.findConflictingOffer({
        type: "Referral",
        startDate: offerStartDate,
        endDate: offerEndDate
      });
      if (existingReferral) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "A Referral offer already exists during the selected dates." });
      }
    }

    await offerService.createOffer({
      name,
      type,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      target: type === "Referral" ? undefined : target,
      targetModel: type,
      startDate: offerStartDate,
      endDate: offerEndDate
    });

    res.json({ success: true, message: "Offer added successfully" });
  } catch (error) {
    logger.error("Error adding offer", { error });
    if (error.code === 11000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Offer name already exists" });
    }
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to add offer" });
  }
};

export const toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await offerService.toggleOfferStatus(id);

    if (!offer) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Offer not found" });
    }

    res.json({ success: true, message: `Offer ${offer.status.toLowerCase()} successfully` });
  } catch (error) {
    logger.error("Error toggling offer status", { error });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to toggle offer status" });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await offerService.deleteOffer(id);

    if (!offer) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Offer not found" });
    }

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    logger.error("Error deleting offer", { error });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to delete offer" });
  }
};

export const editOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, discountType, discountValue, maxDiscountAmount, target, startDate, endDate } = req.body;

    if (!name || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerStartDate = offerService.getStartOfDay(startDate);
    const offerEndDate = offerService.getEndOfDay(endDate);

    if (offerEndDate < offerStartDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "End Date cannot be before Start Date" });
    }

    if (type === "Referral" && discountType !== "Fixed Amount") {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Referral offers must use a Fixed Amount discount type." });
    }

    if (type !== "Referral") {
      const existingOffer = await offerService.findConflictingOffer({
        type,
        target,
        startDate: offerStartDate,
        endDate: offerEndDate,
        excludeId: id
      });
      if (existingOffer) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: `This ${type} already has another active or scheduled offer during the selected dates.` });
      }
    } else {
      const existingReferral = await offerService.findConflictingOffer({
        type: "Referral",
        startDate: offerStartDate,
        endDate: offerEndDate,
        excludeId: id
      });
      if (existingReferral) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Another Referral offer already exists during the selected dates." });
      }
    }

    const updatedOffer = await offerService.updateOffer(id, {
      name,
      type,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      target: type === "Referral" ? undefined : target,
      targetModel: type,
      startDate: offerStartDate,
      endDate: offerEndDate
    });

    if (!updatedOffer) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Offer not found" });
    }

    res.json({ success: true, message: "Offer updated successfully" });
  } catch (error) {
    logger.error("Error editing offer", { error });
    if (error.code === 11000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Offer name already exists" });
    }
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to edit offer" });
  }
};
