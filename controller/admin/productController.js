import * as productService from "../../services/admin/productService.js";
import logger from "../../utils/logger.js";

// GET PRODUCTS (ADMIN PAGE)
export const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";

    logger.info("Loading admin products list", {
      search,
      page,
    });

    const data = await productService.fetchProducts({ search, page });

    res.render("admin/products", { search, ...data });
  } catch (error) {
    logger.error("Error loading admin products", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.redirect("/admin/page-404");
  }
};

// ADD PRODUCT
export const addProduct = async (req, res) => {
  try {
    logger.info("Adding new product", {
      body: req.body,
      fileCount: req.files?.length || 0,
    });

    await productService.createProduct({
      body: req.body,
      files: req.files,
    });

    logger.info("Product added successfully", {
      productName: req.body?.productName,
    });

    res.redirect("/admin/products");
  } catch (error) {
    logger.error("Error adding product", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.render("admin/products", { message: error.message });
  }
};

// LOAD EDIT PAGE
export const getEditPage = async (req, res) => {
  try {
    const productId = req.params.id;

    logger.info("Loading edit product page", { productId });

    const product = await productService.getProductById(productId);
    if (!product) {
      logger.warn("Product not found for edit", { productId });
      return res.redirect("/admin/products");
    }

    const { brands, categories } =
      await productService.fetchBrandsAndCategories();

    res.render("admin/edit-product", { product, brands, categories });
  } catch (error) {
    logger.error("Error loading edit product page", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
    });
    res.redirect("/admin/products");
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

    await productService.updateProduct({
      id: productId,
      body: req.body,
      files: req.files,
    });

    logger.info("Product updated successfully", { productId });

    res.redirect("/admin/products");
  } catch (error) {
    logger.error("Error updating product", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
    });

    const product = await productService.getProductById(req.params.id);
    const { brands, categories } =
      await productService.fetchBrandsAndCategories();

    res.render("admin/edit-product", {
      product,
      brands,
      categories,
      message: error.message,
    });
  }
};

// REMOVE SINGLE IMAGE
export const removeProductImage = async (req, res) => {
  try {
    logger.warn("Removing product image", {
      imageData: req.body,
    });

    await productService.removeImage(req.body);

    logger.info("Product image removed successfully");

    res.json({ success: true });
  } catch (error) {
    logger.error("Error removing product image", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ success: false });
  }
};

// SOFT DELETE / TOGGLE BLOCK
export const softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    logger.warn("Toggling product status (soft delete/block)", {
      productId,
    });

    await productService.toggleProductStatus(productId);

    logger.info("Product status toggled successfully", { productId });

    res.redirect("/admin/products");
  } catch (error) {
    logger.error("Error toggling product status", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
    });
    res.status(500).render("admin/error", { message: error.message });
  }
};
