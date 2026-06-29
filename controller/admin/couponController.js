import * as couponService from "../../services/admin/couponService.js";

// Load Coupons Page
export const getCoupons = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const coupons = await couponService.getCoupons(searchQuery);
    res.render("admin/coupons", { coupons, searchQuery: searchQuery || "" });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).render("admin/admin-error");
  }
};

// Create New Coupon
export const addCoupon = async (req, res) => {
  try {
    const { name, expireOn, offerPrice, minimumPrice, startDate, discountType, maxDiscountAmount } = req.body;

    // Validation
    if (!name || !expireOn || !offerPrice || !minimumPrice || !startDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    
    if (discountType === "Percentage" && Number(offerPrice) > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    const nameUpper = name.toUpperCase().trim();
    const existing = await couponService.findCouponByName(nameUpper);
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
    const sDate = new Date(startDate);
    const eDate = new Date(expireOn);
    
    if (eDate < today) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be in the past" });
    }

    if (eDate <= sDate) {
      return res.status(400).json({ success: false, message: "Expiry date must be strictly after the start date" });
    }

    await couponService.createCoupon({
      name: nameUpper,
      startDate: sDate,
      expireOn: eDate,
      offerPrice: offerVal,
      minimumPrice: minVal,
      discountType: discountType || "Fixed Amount",
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    });

    res.json({ success: true, message: "Coupon created successfully!" });

  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
};

// Edit Coupon
export const editCoupon = async (req, res) => {
  try {
    const { name, expireOn, offerPrice, minimumPrice, startDate, discountType, maxDiscountAmount } = req.body;
    const { id } = req.params;

    // Validation
    if (!name || !expireOn || !offerPrice || !minimumPrice || !startDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (discountType === "Percentage" && Number(offerPrice) > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    const nameUpper = name.toUpperCase().trim();
    
    // Check if another coupon has the same name
    const existing = await couponService.findCouponByName(nameUpper, id);
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
    const sDate = new Date(startDate);
    const eDate = new Date(expireOn);

    if (eDate < today) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be in the past" });
    }
    
    if (eDate <= sDate) {
      return res.status(400).json({ success: false, message: "Expiry date must be strictly after the start date" });
    }

    const updatedCoupon = await couponService.updateCoupon(id, {
      name: nameUpper,
      startDate: sDate,
      expireOn: eDate,
      offerPrice: offerVal,
      minimumPrice: minVal,
      discountType: discountType || "Fixed Amount",
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    });

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon updated successfully!" });

  } catch (error) {
    console.error("Error editing coupon:", error);
    res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
};

// Delete Coupon
export const deleteCoupon = async (req, res) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    res.json({ success: true, message: "Coupon deleted safely" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};
