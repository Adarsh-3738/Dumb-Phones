import Brand from "../../models/brandSchema.js";


// GET BRANDS
export const getBrands = async (search, page, limit) => {
  const query = search
    ? { name: { $regex: search, $options: "i" } }
    : {};

  const skip = (page - 1) * limit;

  const brands = await Brand.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Brand.countDocuments(query);

  return {
    brands,
    totalPages: Math.ceil(total / limit)
  };
};

//ADD  BRAND
export const createBrand = async (data) => {
  const existing = await Brand.findOne({ name: data.name });
  if (existing) throw new Error("Brand already exists");

  return await Brand.create(data);
};

// UPDATE BRAND
export const updateBrand = async (id, data) => {
  const brand = await Brand.findById(id);
  if (!brand) throw new Error("Brand not found");

  brand.name = data.name;
  brand.country = data.country;
  brand.founded = data.founded;

  await brand.save();
  return brand;
};

//  TOGGLE BRAND STATUS
export const toggleBrandStatus = async (id) => {
  const brand = await Brand.findById(id);
  if (!brand) throw new Error("Brand not found");

  brand.isBlocked = !brand.isBlocked;
  await brand.save();
  return brand;
};
