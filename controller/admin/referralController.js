import * as referralService from "../../services/admin/referralService.js";
import logger from "../../utils/logger.js";
import STATUS_CODES from "../../utils/statusCodes.js";

export const getReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || "";

    const referralOffers = await referralService.getReferralOffers();

    const { referrers, totalPages, currentPage } = await referralService.getReferralsData({
      page,
      limit: 10,
      searchQuery
    });

    res.render("admin/referrals", {
      referralOffers,
      referrers,
      currentPage,
      totalPages,
      searchQuery
    });
  } catch (error) {
    logger.error("Error fetching referrals", { error });
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/admin-error");
  }
};

export const addReferralOffer = async (req, res) => {
  try {
    const { name, discountValue, startDate, endDate } = req.body;

    if (!name || !discountValue || !startDate || !endDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "All fields are required" });
    }

    if (Number(discountValue) < 1) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Discount value must be at least ₹1" });
    }

    await referralService.createReferralOffer({
      name,
      discountValue,
      startDate,
      endDate
    });

    res.json({ success: true, message: "Referral offer added successfully" });
  } catch (error) {
    logger.error("Error adding referral offer", { error });
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message || "Failed to add referral offer" });
  }
};

export const editReferralOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discountValue, startDate, endDate } = req.body;

    if (!name || !discountValue || !startDate || !endDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "All fields are required" });
    }

    if (Number(discountValue) < 1) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Discount value must be at least ₹1" });
    }

    await referralService.updateReferralOffer(id, {
      name,
      discountValue,
      startDate,
      endDate
    });

    res.json({ success: true, message: "Referral offer updated successfully" });
  } catch (error) {
    logger.error("Error editing referral offer", { error });
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message || "Failed to edit referral offer" });
  }
};

export const toggleReferralOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await referralService.toggleReferralOfferStatus(id);
    res.json({ success: true, message: `Referral offer status updated to ${offer.status}` });
  } catch (error) {
    logger.error("Error toggling referral offer status", { error });
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message || "Failed to toggle status" });
  }
};

export const deleteReferralOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await referralService.deleteReferralOffer(id);
    res.json({ success: true, message: "Referral offer deleted successfully" });
  } catch (error) {
    logger.error("Error deleting referral offer", { error });
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message || "Failed to delete offer" });
  }
};

