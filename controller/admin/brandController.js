import {
  getBrands,
  createBrand,
  updateBrand,
  toggleBrandStatus
} from "../../services/admin/brandService.js";

//LIST PAGE 
export const loadBrands = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;

    const { brands, totalPages } = await getBrands(
      searchQuery,
      currentPage,
      limit
    );

    res.render("admin/brandList", {
      brands,
      searchQuery,
      currentPage,
      totalPages
    });
  } catch (err) {
    res.status(500).render("admin-error");
  }
};

/* ADD BRAND */
export const addBrand = async (req, res) => {
  try {
    await createBrand(req.body);

    res.json({
      success: true,
      message: "Brand created successfully"
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
};

//EDIT BRAND 
export const editBrand = async (req, res) => {
  try {
    const updated = await updateBrand(req.params.id, req.body);

    res.json({
      success: true,
      brand: updated
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
};

//BLOCK / UNBLOCK BRAND
export const changeBrandStatus = async (req, res) => {
  try {
    const brand = await toggleBrandStatus(req.params.id);

    res.json({
      success: true,
      isBlocked: brand.isBlocked,
      message: brand.isBlocked
        ? "Brand blocked successfully"
        : "Brand unblocked successfully"
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
};
