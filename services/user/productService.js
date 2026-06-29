import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import Variant from "../../models/variantSchema.js";

const getAvailableFilters = async () => {
  const [brands, categories] = await Promise.all([
    Brand.find({ isBlocked: { $ne: true } }).select("_id").lean(),
    Category.find({
      isDeleted: false,
      isListed: true,
      status: "Active"
    }).select("_id").lean()
  ]);

  return {
    brandIds: brands.map((brand) => brand._id),
    categoryIds: categories.map((category) => category._id)
  };
};

const getUnavailableReason = (product) => {
  if (product.isBlocked) {
    return "This product has been blocked by the administrator.";
  }

  if (
    !product.category ||
    product.category.isDeleted ||
    !product.category.isListed ||
    product.category.status !== "Active"
  ) {
    return "This product's category has been blocked by the administrator.";
  }

  if (!product.brand || product.brand.isBlocked) {
    return "This product's brand has been blocked by the administrator.";
  }

  return "";
};


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
  const { brandIds, categoryIds } = await getAvailableFilters();

  // FILTER 
  let filter = {
    isBlocked: false,
    brand: { $in: brandIds },
    category: { $in: categoryIds }
  };

  // SEARCH
  if (search && search.trim()) {
    filter.productName = { $regex: search.trim(), $options: "i" };
  }

  // BRAND
  if (brand) {
    filter.brand = { $in: [brand].flat().filter((id) => brandIds.some((brandId) => brandId.equals(id))) };
  }

  // CATEGORY
  if (category) {
    filter.category = { $in: [category].flat().filter((id) => categoryIds.some((categoryId) => categoryId.equals(id))) };
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
    Brand.find({ isBlocked: { $ne: true } }).lean(),
    Category.find({ isDeleted: false, isListed: true, status: "Active" }).lean()
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
    .populate("brand", "name isBlocked")
    .populate("category");

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const unavailableReason = getUnavailableReason(product);

  // Fetch variants (even if product is blocked, to display images/info)
  const variants = await Variant.find({
    productId: product._id,
    isBlocked: false
  }).sort({ createdAt: 1 });

  // Find similar products
  const similarProductsRaw = product.category
    ? await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isBlocked: false
    })
      .limit(4)
      .populate("brand", "name isBlocked")
      .populate("category", "name status isListed isDeleted")
      .lean()
    : [];

  const similarProductsFiltered = similarProductsRaw.filter((p) => !getUnavailableReason(p));

  // ATTACH DEFAULT VARIANT
  const similarProducts = await Promise.all(
    similarProductsFiltered.map(async (p) => {
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
    similarProducts,
    unavailableReason
  };
};

  
export default {
  getProductDetailsService,
  getProductsService,
};
