
import Category from "../../models/categorySchema.js";

// LIST / SEARCH CATEGORIES
export const getCategories = async (searchQuery = "", page = 1, limit = 5) => {
  const filter = {
    isDeleted: false,
    name: { $regex: searchQuery, $options: "i" },
  };

  const totalCategories = await Category.countDocuments(filter);
  const totalPages = Math.ceil(totalCategories / limit);

  const categories = await Category.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { categories, totalPages, totalCategories };
};

// ADD CATEGORY
export const createCategory = async ({ name, status }) => {
  if (!name || !status) throw new Error("Name & status are required");

  const exists = await Category.findOne({ name, isDeleted: false });
  if (exists) throw new Error("Category already exists");

  const category = await Category.create({
    name,
    status,
    isListed: status === "Active",
    isDeleted: false,
    categoryOffer: 0,
  });

  return category;
};

// EDIT CATEGORY
export const updateCategory = async ({ id, name, status }) => {
  if (!id || !name) throw new Error("Invalid data");

  const exists = await Category.findOne({
    _id: { $ne: id },
    name: { $regex: "^" + name + "$", $options: "i" },
    isDeleted: false,
  });

  if (exists) throw new Error("Category name already exists");

  const category = await Category.findByIdAndUpdate(id, {
    name: name.trim(),
    status,
    isListed: status === "Active",
  });

  return category;
};

// SOFT DELETE CATEGORY
export const softDeleteCategory = async (id) => {
  const category = await Category.findByIdAndUpdate(id, { isDeleted: true });
  return category;
};
