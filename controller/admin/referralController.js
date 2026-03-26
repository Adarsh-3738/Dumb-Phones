import User from "../../models/userSchema.js";
import logger from "../../utils/logger.js";

export const getReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Find users who have actually referred at least one person
    const query = {
      redeemedUsers: { $exists: true, $not: { $size: 0 } }
    };

    const totalReferrers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalReferrers / limit);

    const referrers = await User.find(query)
      .populate("redeemedUsers", "name email createdOn")
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/referrals", {
      referrers,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    logger.error("Error fetching referrals", { error });
    res.status(500).render("admin/admin-error");
  }
};
