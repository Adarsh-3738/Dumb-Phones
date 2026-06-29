import User from "../../models/userSchema.js";

export const getReferralsData = async ({ page = 1, limit = 10, searchQuery = "" }) => {
  const skip = (page - 1) * limit;

  const query = {
    redeemedUsers: { $exists: true, $not: { $size: 0 } }
  };

  if (searchQuery) {
    query.name = { $regex: searchQuery, $options: "i" };
  }

  const totalReferrers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalReferrers / limit);

  const referrers = await User.find(query)
    .populate("redeemedUsers", "name email createdOn")
    .sort({ createdOn: -1 })
    .skip(skip)
    .limit(limit);

  return {
    referrers,
    totalPages,
    currentPage: page
  };
};
