import Offer from "../../models/offerSchema.js";
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import Variant from "../../models/variantSchema.js";
import logger from "../../utils/logger.js";

// Helper function to dynamically recalculate prices based on live Offer documents
export const recalculateVariantPrices = async (productId) => {
  try {
    const product = await Product.findById(productId).populate("category");
    if (!product) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch Active Category Offer
    const categoryOfferDoc = product.category ? await Offer.findOne({ 
      target: product.category._id, 
      status: "Active",
      type: "Category",
      startDate: { $lte: new Date() }, 
      endDate: { $gte: today } 
    }).sort({ discountValue: -1 }) : null;

    // Fetch Active Product Offer
    const productOfferDoc = await Offer.findOne({ 
      target: productId, 
      status: "Active",
      type: "Product", 
      startDate: { $lte: new Date() }, 
      endDate: { $gte: today } 
    }).sort({ discountValue: -1 });

    const variants = await Variant.find({ productId });
    
    for (let variant of variants) {
      // Calculate Absolute Discount from Category Offer
      let cDiscount = 0;
      if (categoryOfferDoc) {
         if (categoryOfferDoc.discountType === "Fixed Amount") {
            cDiscount = categoryOfferDoc.discountValue;
         } else {
            cDiscount = Math.floor((variant.regularPrice * categoryOfferDoc.discountValue) / 100);
            if (categoryOfferDoc.maxDiscountAmount && cDiscount > categoryOfferDoc.maxDiscountAmount) {
                cDiscount = categoryOfferDoc.maxDiscountAmount;
            }
         }
      }

      // Calculate Absolute Discount from Product Offer
      let pDiscount = 0;
      if (productOfferDoc) {
         if (productOfferDoc.discountType === "Fixed Amount") {
            pDiscount = productOfferDoc.discountValue;
         } else {
            pDiscount = Math.floor((variant.regularPrice * productOfferDoc.discountValue) / 100);
            if (productOfferDoc.maxDiscountAmount && pDiscount > productOfferDoc.maxDiscountAmount) {
                pDiscount = productOfferDoc.maxDiscountAmount;
            }
         }
      }

      const maxDiscount = Math.max(cDiscount, pDiscount, 0);
      const newSalesPrice = variant.regularPrice - maxDiscount;
      
      variant.salesPrice = newSalesPrice < 0 ? 0 : newSalesPrice;
      
      
      if (pDiscount >= cDiscount && productOfferDoc && productOfferDoc.discountType === "Percentage") {
         variant.productOffer = productOfferDoc.discountValue;
      } else if (cDiscount > 0 && categoryOfferDoc && categoryOfferDoc.discountType === "Percentage") {
         variant.productOffer = categoryOfferDoc.discountValue; 
      } else {
         variant.productOffer = 0;
      }
      
      await variant.save();
    }
    
    //Category Field
    if (product.category) {
        if (categoryOfferDoc && categoryOfferDoc.discountType === "Percentage") {
            await Category.findByIdAndUpdate(product.category._id, { categoryOffer: categoryOfferDoc.discountValue });
        } else {
            await Category.findByIdAndUpdate(product.category._id, { categoryOffer: 0 });
        }
    }

  } catch (error) {
    logger.error("Error recalculating variant prices", { error });
  }
};

export const syncAllOffers = async (req, res) => {
  try {
    const products = await Product.find({ isBlocked: false });
    for (const prod of products) {
      await recalculateVariantPrices(prod._id);
    }
    res.json({ success: true, message: "All product prices synced to current offers successfully!" });
  } catch (error) {
    logger.error("Error syncing offers", { error });
    res.status(500).json({ success: false, message: "Failed to sync offers" });
  }
};

export const getOffers = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let filter = {};
    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: "i" };
    }

    const offers = await Offer.find(filter).populate("target").sort({ createdAt: -1 });
    const products = await Product.find({ isBlocked: false });
    const categories = await Category.find({ isDeleted: false });

    res.render("admin/offers", { offers, products, categories, searchQuery });
  } catch (error) {
    logger.error("Error fetching offers", { error });
    res.status(500).render("admin/admin-error");
  }
};

export const addOffer = async (req, res) => {
  try {
    const { name, type, discountType, discountValue, maxDiscountAmount, target, startDate, endDate } = req.body;

    if (!name || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(400).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerStartDate = new Date(startDate);
    const offerEndDate = new Date(endDate);
    
    // End Date is not before Start Date
    if (offerEndDate < offerStartDate) {
      return res.status(400).json({ success: false, message: "End Date cannot be before Start Date" });
    }

    if (type === "Referral" && discountType !== "Fixed Amount") {
      return res.status(400).json({ success: false, message: "Referral offers must use a Fixed Amount discount type." });
    }

    if (type !== "Referral") {
      const existingOffer = await Offer.findOne({ target, type });
      if (existingOffer) {
        return res.status(400).json({ success: false, message: `This ${type} already has an offer associated with it. Please delete the existing offer first.` });
      }
    } else {
      const existingReferral = await Offer.findOne({ type: "Referral" });
      if (existingReferral) {
        return res.status(400).json({ success: false, message: "A Referral offer already exists. Please delete it before creating a new one." });
      }
    }

    const newOffer = new Offer({
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

    await newOffer.save();

    // Trigger recalculation if it's a product or category offer
    if (type === "Product") {
      await recalculateVariantPrices(target);
    } else if (type === "Category") {
      const products = await Product.find({ category: target });
      for (const prod of products) {
        await recalculateVariantPrices(prod._id);
      }
    }

    res.json({ success: true, message: "Offer added successfully" });
  } catch (error) {
    logger.error("Error adding offer", { error });
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "Offer name already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to add offer" });
  }
};

export const toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    offer.status = offer.status === "Active" ? "Inactive" : "Active";
    await offer.save();

    if (offer.type === "Product") {
      await recalculateVariantPrices(offer.target);
    } else if (offer.type === "Category") {
      const products = await Product.find({ category: offer.target });
      for (const prod of products) {
        await recalculateVariantPrices(prod._id);
      }
    }

    res.json({ success: true, message: `Offer ${offer.status.toLowerCase()} successfully` });
  } catch (error) {
    logger.error("Error toggling offer status", { error });
    res.status(500).json({ success: false, message: "Failed to toggle offer status" });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const targetId = offer.target;
    const type = offer.type;

    await Offer.findByIdAndDelete(id);

    if (type === "Product") {
      await recalculateVariantPrices(targetId);
    } else if (type === "Category") {
      const products = await Product.find({ category: targetId });
      for (const prod of products) {
        await recalculateVariantPrices(prod._id);
      }
    }

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    logger.error("Error deleting offer", { error });
    res.status(500).json({ success: false, message: "Failed to delete offer" });
  }
};

export const editOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, discountType, discountValue, maxDiscountAmount, target, startDate, endDate } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    if (!name || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(400).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerStartDate = new Date(startDate);
    const offerEndDate = new Date(endDate);

    if (offerEndDate < offerStartDate) {
      return res.status(400).json({ success: false, message: "End Date cannot be before Start Date" });
    }

    if (type === "Referral" && discountType !== "Fixed Amount") {
      return res.status(400).json({ success: false, message: "Referral offers must use a Fixed Amount discount type." });
    }

    if (type !== "Referral") {
      const existingOffer = await Offer.findOne({ _id: { $ne: id }, target, type });
      if (existingOffer) {
        return res.status(400).json({ success: false, message: `This ${type} already has another offer associated with it. Please delete the existing offer first.` });
      }
    } else {
      const existingReferral = await Offer.findOne({ _id: { $ne: id }, type: "Referral" });
      if (existingReferral) {
        return res.status(400).json({ success: false, message: "A Referral offer already exists. Please delete it before creating a new one." });
      }
    }

    // Keep track of old targets to revert prices
    const oldTarget = offer.target;
    const oldType = offer.type;

    offer.name = name;
    offer.type = type;
    offer.discountType = discountType;
    offer.discountValue = Number(discountValue);
    offer.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    offer.target = type === "Referral" ? undefined : target;
    offer.targetModel = type;
    offer.startDate = offerStartDate;
    offer.endDate = offerEndDate;

    await offer.save();

    // Recalculate for OLD target to clear it if it moved
    if (oldType === "Product") {
      await recalculateVariantPrices(oldTarget);
    } else if (oldType === "Category") {
      const oldProducts = await Product.find({ category: oldTarget });
      for (const prod of oldProducts) {
        await recalculateVariantPrices(prod._id);
      }
    }

    // Recalculate for NEW target
    if (type === "Product") {
      await recalculateVariantPrices(offer.target);
    } else if (type === "Category") {
      const newProducts = await Product.find({ category: offer.target });
      for (const prod of newProducts) {
        await recalculateVariantPrices(prod._id);
      }
    }

    res.json({ success: true, message: "Offer updated successfully" });
  } catch (error) {
    logger.error("Error editing offer", { error });
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "Offer name already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to edit offer" });
  }
};
