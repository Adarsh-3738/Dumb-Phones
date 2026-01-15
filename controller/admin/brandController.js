import {
  fetchBrands,
  createBrand,
  getBrandById,
  removeBrandById,
} from "../../services/admin/brandService.js";
import logger from "../../utils/logger.js";

// LOAD BRAND LIST PAGE
export const getBrands = async (req, res) => {
  try {
    const { brands, totalBrands } = await fetchBrands();

    logger.info("Brand list loaded", {
      totalBrands,
    });

    res.render("admin/brandList", { brands, totalBrands });
  } catch (error) {
    logger.error("Error loading brand list", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/admin/pageNotFound");
  }
};

// LOAD ADD BRAND PAGE
export const getAddBrand = async (req, res) => {
  try {
    logger.info("Add brand page loaded");
    res.render("admin/addBrand");
  } catch (error) {
    logger.error("Error loading add brand page", {
      message: error.message,
      stack: error.stack,
    });
    res.redirect("/admin/pageNotFound");
  }
};

// ADD NEW BRAND
export const postAddBrand = async (req, res) => {
  try {
    const { name, country, founded, website } = req.body;
    let logo = req.file ? "/uploads/brands/" + req.file.filename : null;

    logger.info("Creating new brand", {
      name,
      country,
      founded,
    });

    await createBrand({ name, country, founded, website, logo });

    logger.info("Brand created successfully", { name });

    res.redirect("/admin/brands");
  } catch (error) {
    logger.error("Error adding brand", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.redirect("/admin/add-brand");
  }
};

// VIEW SINGLE BRAND
export const viewBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    logger.info("Viewing brand", { brandId });

    const brand = await getBrandById(brandId);
    if (!brand) {
      logger.warn("Brand not found", { brandId });
      return res.redirect("/admin/brands");
    }

    res.render("admin/viewBrand", { brand });
  } catch (error) {
    logger.error("Error viewing brand", {
      message: error.message,
      stack: error.stack,
      brandId: req.params.id,
    });
    res.redirect("/admin/brands");
  }
};

// DELETE BRAND
export const deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    logger.warn("Deleting brand", { brandId });

    await removeBrandById(brandId);

    logger.info("Brand deleted successfully", { brandId });

    res.redirect("/admin/brands");
  } catch (error) {
    logger.error("Error deleting brand", {
      message: error.message,
      stack: error.stack,
      brandId: req.params.id,
    });
    res.redirect("/admin/brands");
  }
};
