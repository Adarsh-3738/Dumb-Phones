import Offer from "../../models/offerSchema.js";
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import Variant from "../../models/variantSchema.js";
import logger from "../../utils/logger.js";

export const getStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const getEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const findConflictingOffer = async ({ type, target, startDate, endDate, excludeId = null }) => {
  const conflictFilter = {
    type,
    status: "Active",
    startDate: { $lte: getEndOfDay(endDate) },
    endDate: { $gte: getStartOfDay(startDate) }
  };

  if (excludeId) {
    conflictFilter._id = { $ne: excludeId };
  }

  if (type !== "Referral") {
    conflictFilter.target = target;
  }

  return Offer.findOne(conflictFilter);
};

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
    
    // Category Field
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

export const syncAllOffers = async () => {
  const products = await Product.find({ isBlocked: false });
  for (const prod of products) {
    await recalculateVariantPrices(prod._id);
  }
};

export const getOffersData = async ({ searchQuery,}) => {
  let filter = {};

  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: "i" };
  }

  const offers = await Offer.find(filter).populate("target").sort({ createdAt: -1 });
  const products = await Product.find({ isBlocked: false });
  const categories = await Category.find({ isDeleted: false });

  return { offers, products, categories };
};

export const createOffer = async (offerData) => {
  const newOffer = new Offer(offerData);
  await newOffer.save();

  if (offerData.type === "Product") {
    await recalculateVariantPrices(offerData.target);
  } else if (offerData.type === "Category") {
    const products = await Product.find({ category: offerData.target });
    for (const prod of products) {
      await recalculateVariantPrices(prod._id);
    }
  }
  return newOffer;
};

export const toggleOfferStatus = async (id) => {
  const offer = await Offer.findById(id);
  if (!offer) return null;

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
  return offer;
};

export const deleteOffer = async (id) => {
  const offer = await Offer.findById(id);
  if (!offer) return null;

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
  return offer;
};

export const updateOffer = async (id, offerData) => {
  const offer = await Offer.findById(id);
  if (!offer) return null;

  const oldTarget = offer.target;
  const oldType = offer.type;

  offer.name = offerData.name;
  offer.type = offerData.type;
  offer.discountType = offerData.discountType;
  offer.discountValue = offerData.discountValue;
  offer.maxDiscountAmount = offerData.maxDiscountAmount;
  offer.target = offerData.target;
  offer.targetModel = offerData.targetModel;
  offer.startDate = offerData.startDate;
  offer.endDate = offerData.endDate;

  await offer.save();

  if (oldType === "Product") {
    await recalculateVariantPrices(oldTarget);
  } else if (oldType === "Category") {
    const oldProducts = await Product.find({ category: oldTarget });
    for (const prod of oldProducts) {
      await recalculateVariantPrices(prod._id);
    }
  }

  if (offerData.type === "Product") {
    await recalculateVariantPrices(offer.target);
  } else if (offerData.type === "Category") {
    const newProducts = await Product.find({ category: offer.target });
    for (const prod of newProducts) {
      await recalculateVariantPrices(prod._id);
    }
  }

  return offer;
};
