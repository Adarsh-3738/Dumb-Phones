import Wishlist from "../../models/wishlistSchema.js";
import Product from "../../models/productSchema.js";
import Variant from "../../models/variantSchema.js";

// GET WISHLIST ITEMS
export const getWishlistItemsService = async (userId) => {
  const wishlist = await Wishlist.findOne({ userId })
    .populate({
      path: "products.productId",
      populate: { path: "category brand" } // Populate category and optionally brand if reference exists
    })
    .lean();

  if (!wishlist) return null;

  // Filter out blocked products/categories
  const validProducts = [];
  for (const item of wishlist.products) {
    const product = item.productId;
    if (
      !product ||
      product.isBlocked ||
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted ||
      product.category.status !== "Active" ||
      !product.brand ||
      product.brand.isBlocked ||
      product.status === "Discontinued"
    ) {
      continue;
    }

    const variant = await Variant.findOne({
      productId: product._id,
      isBlocked: false
    }).sort({ createdAt: 1 }).lean();

    product.defaultVariant = variant;
    validProducts.push(item);
  }

  wishlist.products = validProducts;

  return wishlist;
};

// ADD TO WISHLIST
export const addToWishlistService = async (userId, productId) => {
  const product = await Product.findById(productId).populate("category").populate("brand");
  if (
    !product ||
    product.isBlocked ||
    !product.category ||
    !product.category.isListed ||
    product.category.isDeleted ||
    product.category.status !== "Active" ||
    !product.brand ||
    product.brand.isBlocked ||
    product.status === "Discontinued"
  ) {
    throw new Error("Product is not available");
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      products: [{ productId }]
    });
  } else {
    // Check if implicitly already added
    const exists = wishlist.products.find(item => item.productId.equals(productId));
    if (exists) {
      // Removing logic if toggling (as some apps do) or just throw error/ignore
      return { added: false, message: "Product already in wishlist" };
    }

    wishlist.products.push({ productId });
    await wishlist.save();
  }

  return { added: true };
};

// REMOVE FROM WISHLIST
export const removeFromWishlistService = async (userId, productId) => {
  await Wishlist.updateOne(
    { userId },
    { $pull: { products: { productId: productId } } } // Specific array object match
  );
  return true;
};
