import Coupon from "../../models/couponSchema.js";

export const getCoupons = async (searchQuery) => {
  let filter = {};
  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: "i" };
  }
  return await Coupon.find(filter).sort({ createdOn: -1 });
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
