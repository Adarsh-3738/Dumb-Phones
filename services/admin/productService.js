import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import cloudinary from "../../config/cloudinary.js";

//Fetch products with pagination, search, and population

export const fetchProducts = async ({ search = "", page = 1, limit = 10 }) => {
  const filter = { productName: { $regex: search, $options: "i" } };
  const products = await Product.find(filter)
    .populate("brand")
    .populate("category")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const count = await Product.countDocuments(filter);
  const categories = await Category.find({ isDeleted: false });
  const brands = await Brand.find({});

  return {
    products,
    categories,
    brands,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
};

// Add a new product
 
export const createProduct = async ({ body, files }) => {
  if (!files || files.length < 3) throw new Error("Minimum 3 images required");

  const productImages = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
    productImages.push({ url: result.secure_url, public_id: result.public_id });
  }

  const newProduct = new Product({
    ...body,
    productImage: productImages,
  });

  await newProduct.save();
  return newProduct;
};

// Get a product by ID
 
export const getProductById = async (id) => {
  return await Product.findById(id).populate("brand").populate("category");
};

//Update a product

export const updateProduct = async ({ id, body, files }) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

  const { regularPrice, salesPrice, quantity } = body;
  if (Number(regularPrice) < 0 || Number(salesPrice) < 0 || Number(quantity) < 0) {
    throw new Error("Price and quantity cannot be negative");
  }

  // Upload new images if provided
  if (files && files.length > 0) {
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
      product.productImage.push({ url: result.secure_url, public_id: result.public_id });
    }
  }

  Object.assign(product, body);
  await product.save();
  return product;
};

// Remove single product image
export const removeImage = async ({ productId, publicId }) => {
  await cloudinary.uploader.destroy(publicId);
  await Product.findByIdAndUpdate(productId, { $pull: { productImage: { public_id: publicId } } });
};

// Soft delete / toggle block product
 
export const toggleProductStatus = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");
  product.isBlocked = !product.isBlocked;
  await product.save();
  return product;
};

// Fetch all brands and categories (for edit page)
 
export const fetchBrandsAndCategories = async () => {
  const brands = await Brand.find();
  const categories = await Category.find();
  return { brands, categories };
};
