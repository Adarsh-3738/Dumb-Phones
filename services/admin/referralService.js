import User from "../../models/userSchema.js";
import Offer from "../../models/offerSchema.js";

const getStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const getReferralOffers = async () => {
  return await Offer.find({ type: "Referral" }).sort({ createdAt: -1 });
};

export const createReferralOffer = async ({ name, discountValue, startDate, endDate }) => {
  const offerStartDate = getStartOfDay(startDate);
  const offerEndDate = getEndOfDay(endDate);

  if (offerEndDate < offerStartDate) {
    throw new Error("End Date cannot be before Start Date");
  }

  const existingConflict = await Offer.findOne({
    type: "Referral",
    status: "Active",
    startDate: { $lte: offerEndDate },
    endDate: { $gte: offerStartDate }
  });

  if (existingConflict) {
    throw new Error("An active Referral offer already exists during the selected dates.");
  }

  const newOffer = new Offer({
    name,
    type: "Referral",
    discountType: "Fixed Amount",
    discountValue: Number(discountValue),
    targetModel: "Referral",
    startDate: offerStartDate,
    endDate: offerEndDate,
    status: "Active"
  });

  await newOffer.save();
  return newOffer;
};

export const updateReferralOffer = async (id, { name, discountValue, startDate, endDate }) => {
  const offer = await Offer.findById(id);
  if (!offer) throw new Error("Referral offer not found");

  const offerStartDate = getStartOfDay(startDate);
  const offerEndDate = getEndOfDay(endDate);

  if (offerEndDate < offerStartDate) {
    throw new Error("End Date cannot be before Start Date");
  }

  const existingConflict = await Offer.findOne({
    _id: { $ne: id },
    type: "Referral",
    status: "Active",
    startDate: { $lte: offerEndDate },
    endDate: { $gte: offerStartDate }
  });

  if (existingConflict) {
    throw new Error("Another active Referral offer already exists during the selected dates.");
  }

  offer.name = name;
  offer.discountValue = Number(discountValue);
  offer.startDate = offerStartDate;
  offer.endDate = offerEndDate;

  await offer.save();
  return offer;
};

export const toggleReferralOfferStatus = async (id) => {
  const offer = await Offer.findById(id);
  if (!offer) throw new Error("Referral offer not found");

  offer.status = offer.status === "Active" ? "Inactive" : "Active";
  await offer.save();
  return offer;
};

export const deleteReferralOffer = async (id) => {
  const offer = await Offer.findByIdAndDelete(id);
  if (!offer) throw new Error("Referral offer not found");
  return offer;
};

export const getReferralsData = async ({ page = 1, limit = 10, searchQuery = "" }) => {
  const skip = (page - 1) * limit;

  const baseQuery = { redeemedUsers: { $exists: true, $not: { $size: 0 } } };
  let query = baseQuery;

  if (searchQuery) {
    query = {
      $and: [
        baseQuery,
        {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
            { referalCode: { $regex: searchQuery, $options: "i" } }
          ]
        }
      ]
    };
  }

  const totalReferrers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalReferrers / limit) || 1;

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
