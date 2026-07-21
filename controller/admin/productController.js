import * as productService from "../../services/admin/productService.js";
import logger from "../../utils/logger.js";
import STATUS_CODES from "../../utils/statusCodes.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import { recalculateVariantPrices } from "../../services/admin/offerService.js";

// GET PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";

    const data = await productService.fetchProducts({ search, page });

    const { brands, categories } =
      await productService.fetchBrandsAndCategories();

    res.render("admin/products", {
      search,
      brands,
      categories,
      ...data
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/page-404");
  }
};



// ADD PRODUCT 

export const addProduct = async (req, res) => {
  try {
    const { productName, description, brand, category, variants } = req.body;

    if (!productName || !productName.trim()) {
      throw new Error("Product name is required.");
    }
    if (productName.trim().length < 2 || productName.trim().length > 100) {
      throw new Error("Product name must be between 2 and 100 characters.");
    }
    if (!description || !description.trim()) {
      throw new Error("Description is required.");
    }
    if (description.trim().length < 10) {
      throw new Error("Description must be at least 10 characters long.");
    }
    if (!brand) {
      throw new Error("Brand is required.");
    }
    if (!category) {
      throw new Error("Category is required.");
    }

    const variantsArray = [];
    if (Array.isArray(variants)) {
      variantsArray.push(...variants.filter(v => v !== undefined && v !== null));
    } else if (variants && typeof variants === "object") {
      Object.keys(variants).forEach(key => {
        if (variants[key]) variantsArray.push(variants[key]);
      });
    }

    if (!variantsArray.length) {
      throw new Error("At least one variant required");
    }

    // Check duplicate color validation
    const variantColors = variantsArray.map(v => (v.color || "").trim().toLowerCase());
    const duplicateColor = variantColors.find((color, idx) => variantColors.indexOf(color) !== idx);
    if (duplicateColor) {
      const displayColor = variantsArray.find(v => (v.color || "").trim().toLowerCase() === duplicateColor)?.color || duplicateColor;
      throw new Error(`Duplicate variant color "${displayColor}" is not allowed.`);
    }

    // Validate variant properties
    for (let i = 0; i < variantsArray.length; i++) {
      const variant = variantsArray[i];
      if (!variant.color || !variant.color.trim()) {
        throw new Error(`Color for Variant ${i + 1} is required.`);
      }
      
      const regPrice = Number(variant.regularPrice);
      const salPrice = Number(variant.salesPrice);
      const qty = Number(variant.quantity);

      if (isNaN(regPrice) || regPrice <= 0) {
        throw new Error(`Regular price for variant "${variant.color}" must be a positive number.`);
      }
      if (isNaN(salPrice) || salPrice <= 0) {
        throw new Error(`Sales price for variant "${variant.color}" must be a positive number.`);
      }
      if (salPrice > regPrice) {
        throw new Error(`Sales price for variant "${variant.color}" cannot be greater than regular price.`);
      }
      if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
        throw new Error(`Quantity for variant "${variant.color}" must be a non-negative integer.`);
      }
    }

    //CREATE PRODUCT
    const product = await productService.createProduct({
      productName,
      description,
      brand,
      category,
      attributes: {
        colors: Array.from(new Set(variantsArray.map(v => v.color).filter(Boolean)))
      }
    });

    // CREATE VARIANTS
    const variantDocs = variantsArray.map((variant, index) => {

      const images = (req.files || [])
        .filter(file => file.fieldname === `variants[${index}][images]`)
        .map(file => ({
          url: `/uploads/${file.filename}`,
          public_id: file.filename
        }));

      if (images.length < 3) {
        throw new Error(`Minimum 3 images required for ${variant.color}`);
      }

      return {
        productId: product._id,
        color: variant.color,
        regularPrice: Number(variant.regularPrice),
        salesPrice: Number(variant.salesPrice),
        baseSalesPrice: Number(variant.salesPrice),
        quantity: Number(variant.quantity),
        variantImages: images
      };
    });

    await productService.createVariants(variantDocs);
    await recalculateVariantPrices(product._id);

    res.json({ success: true, message: "Product created successfully!" });

  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    logger.error("Add product failed", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};
// LOAD EDIT PAGE
import Product from "../../models/productSchema.js";
import Variant from "../../models/variantSchema.js";

export const getEditPage = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId)
      .populate("brand")
      .populate("category");

    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).render("admin/404");
    }

    //  FETCH VARIANTS SEPARATELY
    const variants = await Variant.find({ productId });

    res.render("admin/edit-product", {
      product,
      variants,
      brands: await Brand.find(),
      categories: await Category.find({
  isDeleted: false,
  isListed: true,
  status: "Active"
}),
    });

  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/admin-error");
  }
};
// UPDATE PRODUCT 
export const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    logger.info("Updating product", {
      productId,
      body: req.body,
      fileCount: req.files?.length || 0,
    });

    const { productName, description, brand, category } = req.body;

    if (!productName || !productName.trim()) {
      throw new Error("Product name is required.");
    }
    if (productName.trim().length < 2 || productName.trim().length > 100) {
      throw new Error("Product name must be between 2 and 100 characters.");
    }
    if (!description || !description.trim()) {
      throw new Error("Description is required.");
    }
    if (description.trim().length < 10) {
      throw new Error("Description must be at least 10 characters long.");
    }
    if (!brand) {
      throw new Error("Brand is required.");
    }
    if (!category) {
      throw new Error("Category is required.");
    }

    // Extract colors dynamically from variants
    const variantsArray = [];
    if (Array.isArray(req.body.variants)) {
      variantsArray.push(...req.body.variants.filter(v => v !== undefined && v !== null));
    } else if (req.body.variants && typeof req.body.variants === "object") {
      Object.keys(req.body.variants).forEach(key => {
        if (req.body.variants[key]) variantsArray.push(req.body.variants[key]);
      });
    }

    if (!variantsArray.length) {
      throw new Error("At least one variant required.");
    }
      
    // Check duplicate color validation
    const variantColors = variantsArray.map(v => (v.color || "").trim().toLowerCase());
    const duplicateColor = variantColors.find((color, idx) => variantColors.indexOf(color) !== idx);
    if (duplicateColor) {
      const displayColor = variantsArray.find(v => (v.color || "").trim().toLowerCase() === duplicateColor)?.color || duplicateColor;
      throw new Error(`Duplicate variant color "${displayColor}" is not allowed.`);
    }

    // Validate variant properties
    for (let i = 0; i < variantsArray.length; i++) {
      const v = variantsArray[i];
      if (!v.color || !v.color.trim()) {
        throw new Error(`Color for Variant ${i + 1} is required.`);
      }
      
      const regPrice = Number(v.regularPrice);
      const salPrice = Number(v.salesPrice);
      const qty = Number(v.quantity);

      if (isNaN(regPrice) || regPrice <= 0) {
        throw new Error(`Regular price for variant "${v.color}" must be a positive number.`);
      }
      if (isNaN(salPrice) || salPrice <= 0) {
        throw new Error(`Sales price for variant "${v.color}" must be a positive number.`);
      }
      if (salPrice > regPrice) {
        throw new Error(`Sales price for variant "${v.color}" cannot be greater than regular price.`);
      }
      if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
        throw new Error(`Quantity for variant "${v.color}" must be a non-negative integer.`);
      }

      // Validate images count
      const isNewVariant = !v._id;
      if (isNewVariant) {
        const newImages = (req.files || [])
          .filter(file => file.fieldname === `variants[${i}][images]`);
        if (newImages.length < 3) {
          throw new Error(`Minimum 3 images required for new variant "${v.color}".`);
        }
      } else {
        const variantDoc = await Variant.findById(v._id);
        if (!variantDoc) {
          throw new Error("Variant not found.");
        }
        const existingCount = variantDoc.variantImages?.length || 0;
        const newImages = (req.files || [])
          .filter(file => file.fieldname.includes(`variants[${i}][images]`));
        const totalImages = existingCount + newImages.length;
        if (totalImages < 3) {
          throw new Error(`Variant "${v.color}" must have at least 3 images total. Current total: ${totalImages}.`);
        }
      }
    }
      
    req.body.colors = Array.from(new Set(variantsArray.map(v => v.color).filter(Boolean)));

    await productService.updateProduct({
      id: productId,
      body: req.body,
      files: req.files,
    });

    await recalculateVariantPrices(productId);

    logger.info("Product updated successfully", { productId });

    res.json({ success: true, message: "Product updated successfully!" });
  } catch (error) {
    logger.error("Error updating product", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
    });

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// REMOVE SINGLE IMAGE
export const removeProductImage = async (req, res) => {
  try {
    const { variantId, imageUrl } = req.body;

    if (!variantId || !imageUrl) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Missing data"
      });
    }

    logger.warn("Removing product image", { variantId, imageUrl });

    await productService.removeImage({ variantId, imageUrl });

    logger.info("Product image removed successfully");

    res.json({ success: true });

  } catch (error) {
    logger.error("Error removing product image", {
      message: error.message,
      stack: error.stack,
    });

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};
// SOFT DELETE 
export const softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // preserve state
    const page = req.query.page || 1;
    const search = req.query.search || "";

    logger.warn("Toggling product status (soft delete/block)", {
      productId,
      page,
      search
    });

    await productService.toggleProductStatus(productId);

    logger.info("Product status toggled successfully", { productId });

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: "Status toggled successfully" });
    }

    // redirect back with state preserved
    res.redirect(
      `/admin/products?page=${page}&search=${encodeURIComponent(search)}`
    );
  } catch (error) {
    logger.error("Error toggling product status", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id
    });

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/error", { message: error.message });
  }
};

