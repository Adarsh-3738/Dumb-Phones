import * as referralService from "../../services/admin/referralService.js";
import logger from "../../utils/logger.js";

export const getReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || "";

    const { referrers, totalPages, currentPage } = await referralService.getReferralsData({
      page,
      limit: 10,
      searchQuery
    });

    res.render("admin/referrals", {
      referrers,
      currentPage,
      totalPages,
      searchQuery
    });
  } catch (error) {
    logger.error("Error fetching referrals", { error });
    res.status(500).render("admin/admin-error");
  }
};
