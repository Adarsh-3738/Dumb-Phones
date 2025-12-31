const Brand = require("../../models/brandSchema");

// ---------------------------------
// LOAD BRAND LIST PAGE
// ---------------------------------
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().lean();
    res.render("admin/brandList", {
      brands,
      totalBrands: brands.length
    });

  } catch (error) {
    console.log("Error loading brand list:", error);
    res.redirect("/admin/pageNotFound");
  }
};

// ---------------------------------
// LOAD ADD BRAND PAGE
// ---------------------------------
exports.getAddBrand = async (req, res) => {
  try {
    res.render("admin/addBrand");
  } catch (error) {
    console.log("Error loading add brand page:", error);
    res.redirect("/admin/pageNotFound");
  }
};

// ---------------------------------
// ADD NEW BRAND
// ---------------------------------
exports.postAddBrand = async (req, res) => {
  try {
    const { name, country, founded, website } = req.body;

    let logo = null;

    if (req.file) {
      logo = "/uploads/brands/" + req.file.filename;   // multer upload path
    }

    const newBrand = new Brand({
      name,
      country,
      founded,
      website,
      logo
    });

    await newBrand.save();
    res.redirect("/admin/brands");

  } catch (error) {
    console.log("Error adding brand:", error);
    res.redirect("/admin/add-brand");
  }
};

// ---------------------------------
// VIEW SINGLE BRAND
// ---------------------------------
exports.viewBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).lean();
    if (!brand) return res.redirect("/admin/brands");

    res.render("admin/viewBrand", { brand });
  } catch (error) {
    console.log("Error viewing brand:", error);
    res.redirect("/admin/brands");
  }
};

// ---------------------------------
// DELETE BRAND
// ---------------------------------
exports.deleteBrand = async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.redirect("/admin/brands");

  } catch (error) {
    console.log("Error deleting brand:", error);
    res.redirect("/admin/brands");
  }
};
