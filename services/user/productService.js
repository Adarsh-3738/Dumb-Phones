import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import Variant from "../../models/variantSchema.js";


//   GET PRODUCTS 


 export const getProductsService = async (query) => {
  const {
    search,
    sort,
    brand,
    category,
    price,
    page = 1
  } = query;

  const limit = 9;
  const currentPage = Math.max(Number(page), 1);
  const skip = (currentPage - 1) * limit;

  // FILTER 
  let filter = { isBlocked: false };

  // SEARCH
  if (search && search.trim()) {
    filter.productName = { $regex: search.trim(), $options: "i" };
  }

  // BRAND
  if (brand) {
    filter.brand = brand;
  }

  // CATEGORY
  if (category) {
    filter.category = category;
  }

  // PRICE RANGE
  if (price) {
    const [min, max] = price.split("-").map(Number);
    filter.salesPrice = { $gte: min, $lte: max };
  }

  // SORT 
  let sortOption = { createdAt: -1 };

  switch (sort) {
    case "priceLowHigh":
      sortOption = { salesPrice: 1 };
      break;
    case "priceHighLow":
      sortOption = { salesPrice: -1 };
      break;
    case "nameAZ":
      sortOption = { productName: 1 };
      break;
    case "nameZA":
      sortOption = { productName: -1 };
      break;
  }

  // QUERY 
  const [rawProducts, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate("brand", "name")
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter)
  ]);

  // ATTACH DEFAULT VARIANT
  const products = await Promise.all(
    rawProducts.map(async (p) => {
      const variant = await Variant.findOne({
        productId: p._id,
        isBlocked: false
      })
      .sort({ createdAt: 1 })
      .lean();

      return {
        ...p,
        defaultVariant: variant
      };
    })
  );

  const totalPages = Math.ceil(totalProducts / limit) || 1;

  // FILTER DATA 
  const [brands, categories] = await Promise.all([
    Brand.find({}).lean(),
    Category.find({ isDeleted: false, isListed: true }).lean()
  ]);

  return {
    products,
    brands,
    categories,
    currentPage,
    totalPages,
    totalProducts
  };
};


 // PRODUCT DETAILS /  SIMILAR PRODUCTS


const getProductDetailsService = async (productId) => {
  // 1. Fetch the product without filtering by isBlocked: false
  const product = await Product.findOne({ _id: productId })
    .populate("brand", "name")
    .populate("category");

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  // 2. Check if the category is deleted or unlisted
  if (
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted
  ) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  // Fetch variants (even if product is blocked, to display images/info)
  const variants = await Variant.find({
    productId: product._id,
    isBlocked: false
  }).sort({ createdAt: 1 });

  // Find similar products
  const similarProductsRaw = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isBlocked: false // Only suggest active products
  })
  .limit(4)
  .populate("brand", "name")
  .populate("category", "name")
  .lean();

  // ATTACH DEFAULT VARIANT
  const similarProducts = await Promise.all(
    similarProductsRaw.map(async (p) => {
      const variant = await Variant.findOne({
        productId: p._id,
        isBlocked: false
      })
      .sort({ createdAt: 1 })
      .lean();

      return {
        ...p,
        defaultVariant: variant
      };
    })
  );

  return {
    product,
    variants,
    similarProducts
  };
};

  
export default {
  getProductDetailsService,
  getProductsService,
};
