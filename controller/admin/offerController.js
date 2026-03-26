import Offer from "../../models/offerSchema.js";
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import Variant from "../../models/variantSchema.js";
import logger from "../../utils/logger.js";

// Helper function to recalculate prices for all variants of a product
export const recalculateVariantPrices = async (productId) => {
  try {
    const product = await Product.findById(productId).populate("category");
    if (!product) return;

    const categoryOffer = product.category?.categoryOffer || 0;

    const variants = await Variant.find({ productId });
    for (let variant of variants) {
      const productOffer = variant.productOffer || 0;
      const maxOffer = Math.max(categoryOffer, productOffer);

      // Offer applies to regularPrice
      variant.salesPrice = variant.regularPrice - Math.floor((variant.regularPrice * maxOffer) / 100);
      await variant.save();
    }
  } catch (error) {
    logger.error("Error recalculating variant prices", { error });
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().populate("target");
    const products = await Product.find({ isBlocked: false });
    const categories = await Category.find({ isDeleted: false });

    res.render("admin/offers", { offers, products, categories });
  } catch (error) {
    logger.error("Error fetching offers", { error });
    res.status(500).render("admin/admin-error");
  }
};

export const addOffer = async (req, res) => {
  try {
    const { name, type, discountValue, target, endDate } = req.body;

    if (!name || !type || !discountValue || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(400).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerEndDate = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (offerEndDate < today) {
      return res.status(400).json({ success: false, message: "End Date cannot be in the past" });
    }

    const newOffer = new Offer({
      name,
      type,
      discountValue: Number(discountValue),
      target: type === "Referral" ? undefined : target,
      targetModel: type,
      endDate: new Date(endDate)
    });

    await newOffer.save();

    // Update corresponding schema and recalculate
    if (type === "Product") {
      // Apply product offer to all variants of this product
      // We will update the `productOffer` field for all variants of this product
      await Variant.updateMany({ productId: target }, { $set: { productOffer: Number(discountValue) } });
      await recalculateVariantPrices(target);
    } else if (type === "Category") {
      // Update the category
      await Category.findByIdAndUpdate(target, { categoryOffer: Number(discountValue) });
      
      // Find all products in this category and recalculate
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

    const applyValue = offer.status === "Active" ? offer.discountValue : 0;

    if (offer.type === "Product") {
      await Variant.updateMany({ productId: offer.target }, { $set: { productOffer: applyValue } });
      await recalculateVariantPrices(offer.target);
    } else if (offer.type === "Category") {
      await Category.findByIdAndUpdate(offer.target, { categoryOffer: applyValue });
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

    if (offer.type === "Product") {
      await Variant.updateMany({ productId: offer.target }, { $set: { productOffer: 0 } });
      await recalculateVariantPrices(offer.target);
    } else if (offer.type === "Category") {
      await Category.findByIdAndUpdate(offer.target, { categoryOffer: 0 });
      const products = await Product.find({ category: offer.target });
      for (const prod of products) {
        await recalculateVariantPrices(prod._id);
      }
    }

    await Offer.findByIdAndDelete(id);

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    logger.error("Error deleting offer", { error });
    res.status(500).json({ success: false, message: "Failed to delete offer" });
  }
};

export const editOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, discountValue, target, endDate } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    if (!name || !type || !discountValue || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (type !== "Referral" && !target) {
      return res.status(400).json({ success: false, message: "Target is required for Product/Category offer" });
    }

    const offerEndDate = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (offerEndDate < today) {
      return res.status(400).json({ success: false, message: "End Date cannot be in the past" });
    }

    // Revert old target prices
    if (offer.status === "Active") {
      if (offer.type === "Product") {
        await Variant.updateMany({ productId: offer.target }, { $set: { productOffer: 0 } });
        await recalculateVariantPrices(offer.target);
      } else if (offer.type === "Category") {
        await Category.findByIdAndUpdate(offer.target, { categoryOffer: 0 });
        const oldProducts = await Product.find({ category: offer.target });
        for (const prod of oldProducts) {
          await recalculateVariantPrices(prod._id);
        }
      }
    }

    offer.name = name;
    offer.type = type;
    offer.discountValue = Number(discountValue);
    offer.target = type === "Referral" ? undefined : target;
    offer.targetModel = type;
    offer.endDate = offerEndDate;

    await offer.save();

    // Apply new target prices
    if (offer.status === "Active") {
      if (offer.type === "Product") {
        await Variant.updateMany({ productId: offer.target }, { $set: { productOffer: offer.discountValue } });
        await recalculateVariantPrices(offer.target);
      } else if (offer.type === "Category") {
        await Category.findByIdAndUpdate(offer.target, { categoryOffer: offer.discountValue });
        const newProducts = await Product.find({ category: offer.target });
        for (const prod of newProducts) {
          await recalculateVariantPrices(prod._id);
        }
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
