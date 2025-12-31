const Category = require("../../models/categorySchema");


const categoryInfo = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const filter = {
      isDeleted: false,
      name: { $regex: searchQuery, $options: "i" }
    };

    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
      totalCategories
    });
  } catch (error) {
    console.log("Category loading error:", error);
    res.redirect("/admin/page-error");
  }
};


const addCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !status)
      return res.json({ success: false, msg: "Name & status are required" });

    const exists = await Category.findOne({ name, isDeleted: false });
    if (exists)
      return res.json({ success: false, msg: "Category already exists" });

    await Category.create({
      name,
      status,
      isDeleted: false,
      categoryOffer: 0
    });

    return res.json({ success: true });
  } catch (error) {
    console.log("ADD CATEGORY ERROR:", error);
    return res.json({ success: false });
  }
};


const editCategory = async (req, res) => {
  try {
    const { id, name, status } = req.body;

    if (!id || !name)
      return res.json({ success: false, msg: "Invalid data" });

    const exists = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: "^" + name + "$", $options: "i" },
      isDeleted: false
    });

    if (exists)
      return res.json({ success: false, msg: "Category name already exists" });

    await Category.findByIdAndUpdate(id, {
      name: name.trim(),
      status
    });

    return res.json({ success: true });
  } catch (error) {
    console.log("EDIT CATEGORY ERROR:", error);
    return res.json({ success: false });
  }
};

// soft delete 

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    await Category.findByIdAndUpdate(id, { isDeleted: true });
    return res.json({ success: true });
  } catch (error) {
    console.log("DELETE CATEGORY ERROR:", error);
    return res.json({ success: false });
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  editCategory,
  deleteCategory
};
