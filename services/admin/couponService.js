import Coupon from "../../models/couponSchema.js";

export const getCoupons = async (searchQuery, page = 1, limit = 10) => {
  let filter = {};
  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: "i" };
  }
  const skip = (page - 1) * limit;
  const coupons = await Coupon.find(filter)
    .sort({ createdOn: -1 })
    .skip(skip)
    .limit(limit);
  const totalCoupons = await Coupon.countDocuments(filter);
  return {
    coupons,
    totalPages: Math.ceil(totalCoupons / limit),
    currentPage: page
  };
};

export const findCouponByName = async (name, excludeId = null) => {
  const query = { name };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return await Coupon.findOne(query);
};

export const createCoupon = async (couponData) => {
  const newCoupon = new Coupon(couponData);
  return await newCoupon.save();
};

export const updateCoupon = async (id, couponData) => {
  return await Coupon.findByIdAndUpdate(id, couponData, { new: true });
};

export const deleteCoupon = async (id) => {
  return await Coupon.findByIdAndDelete(id);
};
