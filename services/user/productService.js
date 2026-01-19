import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";

//GET PRODUCTS WITH FILTERS + PAGINATION

const getProductsService = async (query) => {
  const { search, sort, brand, category, price, page = 1 } = query;

  const limit = 9;
  const skip = (page - 1) * limit;

  // FILTER OBJECT
  let filter = { isBlocked: false };

  // SEARCH
  if (search) {
    filter.productName = { $regex: search, $options: "i" };
  }

  // BRAND FILTER
  if (brand) filter.brand = brand;

  // CATEGORY FILTER
  if (category) filter.category = category;

  // PRICE FILTER
  if (price) {
    const [min, max] = price.split("-").map(Number);
    filter.salesPrice = { $gte: min, $lte: max };
  }

  // SORT LOGIC
  let sortOption = {};
  switch (sort) {
    case "priceLowHigh":
      sortOption.salesPrice = 1;
      break;
    case "priceHighLow":
      sortOption.salesPrice = -1;
      break;
    case "nameAZ":
      sortOption.productName = 1;
      break;
    case "nameZA":
      sortOption.productName = -1;
      break;
    default:
      sortOption.createdAt = -1;
  }

  const products = await Product.find(filter)
    .populate("brand")
    .populate("category")
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  const brands = await Brand.find({ isBlocked: false });
  const categories = await Category.find({ isBlocked: false });

  return {
    products,
    brands,
    categories,
    currentPage: Number(page),
    totalPages
  };
};

//PRODUCT DETAILS + SIMILAR PRODUCTS

const getProductDetailsService = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isBlocked: false
  })
    .populate("brand", "name")
    .populate("category", "name");

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const similarProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isBlocked: false
  })
    .limit(4)
    .populate("brand", "name")
    .populate("category", "name");

  return { product, similarProducts };
};

export default {
  getProductsService,
  getProductDetailsService
};
