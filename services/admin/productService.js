
import Product from "../../models/productSchema.js";
import Variant from "../../models/variantSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";

export const fetchProducts = async ({ search = "", page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const matchStage = {};

  if (search && search.trim() !== "") {
    matchStage.productName = {
      $regex: search.trim(),
      $options: "i"
    };
  }

  const products = await Product.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand"
      }
    },
    { $unwind: "$brand" },

    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },

    {
      $lookup: {
        from: "variants",
        localField: "_id",
        foreignField: "productId",
        as: "variants"
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  const totalProducts = await Product.countDocuments(matchStage);

  return {
    products,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page
  };
};

// CREATE PRODUCT 
export const createProduct = async (data) => {
  return await Product.create(data);
};

// CREATE VARIANTS 
export const createVariants = async (variants) => {
  return await Variant.insertMany(variants);
};

// SINGLE PRODUCT 
export const getProductById = async (id) => {
  return await Product.findById(id)
    .populate("brand")
    .populate("category")
    .lean();
};

// FETCH BRANDS & CATEGORIES 
export const fetchBrandsAndCategories = async () => {
  const brands = await Brand.find().lean(); // no filter
  const categories = await Category.find({
    isDeleted: false,
    isListed: true,
    status: "Active"
  }).lean();

  return { brands, categories };
};
// TOGGLE PRODUCT 
export const toggleProductStatus = async (id) => {
  const product = await Product.findById(id);
  product.isBlocked = !product.isBlocked;
  await product.save();
};


export const updateProduct = async ({ id, body, files }) => {

  //Update main product
  await Product.findByIdAndUpdate(id, {
    productName: body.productName,
    description: body.description,
    brand: body.brand,
    category: body.category,
    "attributes.colors": body.colors || []
  });

  //Normalize variants array
  const variantsArray = [];
  if (Array.isArray(body.variants)) {
    variantsArray.push(...body.variants.filter(v => v !== undefined && v !== null));
  } else if (body.variants && typeof body.variants === "object") {
    Object.keys(body.variants).forEach(key => {
      if (body.variants[key]) variantsArray.push(body.variants[key]);
    });
  }
  
  const submittedVariantIds = [];

  // Loop through variants
  for (let i = 0; i < variantsArray.length; i++) {

    const v = variantsArray[i];

    let variantDoc;

    if (v._id) {
      variantDoc = await Variant.findById(v._id);
      if (!variantDoc) continue;
    } else {
      variantDoc = new Variant({ productId: id });
    }

    variantDoc.color = v.color;
    variantDoc.regularPrice = Number(v.regularPrice);
    variantDoc.salesPrice = Number(v.salesPrice);
    variantDoc.quantity = Number(v.quantity);

    // Handle new images
    if (files && files.length > 0) {
      const images = files
        .filter(f => f.fieldname.includes(`variants[${i}][images]`))
        .map(f => ({
          url: `/uploads/${f.filename}`,
          public_id: f.filename
        }));

      if (images.length > 0) {
        variantDoc.variantImages.push(...images);
      }
    }

    await variantDoc.save();
    
    // Add processed _id to tracker
    if (variantDoc._id) submittedVariantIds.push(variantDoc._id.toString());
  }
  
  // Clean up deleted variants
  if (submittedVariantIds.length > 0) {
    await Variant.deleteMany({
      productId: id,
      _id: { $nin: submittedVariantIds }
    });
  }
};

export const removeImage = async ({ variantId, imageUrl }) => {
  const variant = await Variant.findById(variantId);

  if (!variant) throw new Error("Variant not found");

  variant.variantImages = variant.variantImages.filter(
    img => img.url !== imageUrl
  );

  await variant.save();
};