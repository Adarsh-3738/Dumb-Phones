import {
  getCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from "../../services/admin/categoryService.js";
import logger from "../../utils/logger.js";

// LIST / SEARCH CATEGORIES
export const categoryInfo = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;

    logger.info("Loading category list", {
      searchQuery,
      page,
    });

    const { categories, totalPages, totalCategories } =
      await getCategories(searchQuery, page);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
      totalCategories,
    });
  } catch (error) {
    logger.error("Category loading error", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.redirect("/admin/page-error");
  }
};

// ADD CATEGORY
export const addCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    logger.info("Creating category", {
      name,
      status,
    });

    await createCategory({ name, status });

    logger.info("Category created successfully", { name });

    return res.json({ success: true });
  } catch (error) {
    logger.warn("Add category failed", {
      message: error.message,
      body: req.body,
    });
    return res.json({ success: false, msg: error.message });
  }
};

// EDIT CATEGORY
export const editCategory = async (req, res) => {
  try {
    const { id, name, status } = req.body;

    logger.info("Updating category", {
      id,
      name,
      status,
    });

    await updateCategory({ id, name, status });

    logger.info("Category updated successfully", { id });

    return res.json({ success: true });
  } catch (error) {
    logger.warn("Edit category failed", {
      message: error.message,
      body: req.body,
    });
    return res.json({ success: false, msg: error.message });
  }
};

// SOFT DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    logger.warn("Soft deleting category", { id });

    await softDeleteCategory(id);

    logger.info("Category soft deleted successfully", { id });

    return res.json({ success: true });
  } catch (error) {
    logger.error("Delete category error", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.json({ success: false });
  }
};
