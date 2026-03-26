import Coupon from "../../models/couponSchema.js";

// Load Coupons Page
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdOn: -1 });
    res.render("admin/coupons", { coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).render("admin/admin-error");
  }
};

// Create New Coupon
export const addCoupon = async (req, res) => {
  try {
    const { name, expireOn, offerPrice, minimumPrice } = req.body;

    // Validation
    if (!name || !expireOn || !offerPrice || !minimumPrice) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const nameUpper = name.toUpperCase().trim();
    const existing = await Coupon.findOne({ name: nameUpper });
    if (existing) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const offerVal = Number(offerPrice);
    const minVal = Number(minimumPrice);

    if (offerVal <= 0 || minVal <= 0) {
      return res.status(400).json({ success: false, message: "Prices must be greater than 0" });
    }

    if (offerVal >= minVal) {
      return res.status(400).json({ success: false, message: "Offer price must be less than Minimum price" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(expireOn) < today) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be in the past" });
    }

    const newCoupon = new Coupon({
      name: nameUpper,
      expireOn: new Date(expireOn),
      offerPrice: offerVal,
      minimumPrice: minVal,
    });

    await newCoupon.save();
    res.json({ success: true, message: "Coupon created successfully!" });

  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
};

// Delete Coupon
export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted safely" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};
